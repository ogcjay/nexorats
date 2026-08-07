import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface DepHealthEntry {
  name: string;
  expected?: string;
  installed?: string | null;
  status: 'ok' | 'missing' | 'mismatch' | 'unknown';
  note?: string;
}

export interface DepsHealthReport {
  cwd: string;
  packageName?: string;
  packageManager?: 'pnpm' | 'npm' | 'yarn' | 'unknown';
  dependencies: DepHealthEntry[];
  nexora: DepHealthEntry[];
  note?: string;
}

const NEXORA_PREFIX = '@nexora.ts/';

async function readJsonSafe(path: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function detectPackageManager(pkg: Record<string, unknown> | null): DepsHealthReport['packageManager'] {
  if (!pkg) return 'unknown';
  if (pkg.packageManager && typeof pkg.packageManager === 'string') {
    if (pkg.packageManager.startsWith('pnpm')) return 'pnpm';
    if (pkg.packageManager.startsWith('yarn')) return 'yarn';
    if (pkg.packageManager.startsWith('npm')) return 'npm';
  }
  return 'unknown';
}

async function resolveInstalledVersion(cwd: string, name: string): Promise<string | null> {
  // Prefer nested package.json under node_modules (works for scoped pkgs)
  const pkgPath = join(cwd, 'node_modules', ...name.split('/'), 'package.json');
  const pkg = await readJsonSafe(pkgPath);
  if (pkg && typeof pkg.version === 'string') return pkg.version;
  return null;
}

function collectDeps(pkg: Record<string, unknown> | null): Record<string, string> {
  if (!pkg) return {};
  const out: Record<string, string> = {};
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies'] as const) {
    const block = pkg[field];
    if (!block || typeof block !== 'object') continue;
    for (const [name, range] of Object.entries(block as Record<string, unknown>)) {
      if (typeof range === 'string') out[name] = range;
    }
  }
  return out;
}

function classify(
  name: string,
  expected: string | undefined,
  installed: string | null,
): DepHealthEntry {
  if (!installed) {
    return {
      name,
      expected,
      installed: null,
      status: 'missing',
      note: 'Not found under node_modules',
    };
  }
  if (!expected) {
    return { name, installed, status: 'ok' };
  }
  // Loose check: installed satisfies if exact or expected includes version
  const clean = expected.replace(/^[\^~>=<\s]+/, '');
  if (installed === clean || expected.includes(installed) || installed.startsWith(clean)) {
    return { name, expected, installed, status: 'ok' };
  }
  return {
    name,
    expected,
    installed,
    status: 'mismatch',
    note: 'Declared range vs installed version (best-effort)',
  };
}

/**
 * Best-effort dependency health from bot `package.json` + `node_modules`.
 * Localhost Studio only — never fetches the network.
 */
export async function collectDepsHealth(cwd: string = process.cwd()): Promise<DepsHealthReport> {
  const pkgPath = join(cwd, 'package.json');
  const pkg = await readJsonSafe(pkgPath);
  if (!pkg) {
    return {
      cwd,
      packageManager: 'unknown',
      dependencies: [],
      nexora: [],
      note: `Could not read ${pkgPath}`,
    };
  }

  const declared = collectDeps(pkg);
  const names = Object.keys(declared).sort();
  const dependencies: DepHealthEntry[] = [];
  const nexora: DepHealthEntry[] = [];

  for (const name of names) {
    const installed = await resolveInstalledVersion(cwd, name);
    const entry = classify(name, declared[name], installed);
    if (name.startsWith(NEXORA_PREFIX)) {
      nexora.push(entry);
    } else {
      dependencies.push(entry);
    }
  }

  return {
    cwd,
    packageName: typeof pkg.name === 'string' ? pkg.name : undefined,
    packageManager: detectPackageManager(pkg),
    dependencies,
    nexora,
  };
}
