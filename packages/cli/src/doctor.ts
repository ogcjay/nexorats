/**
 * `nexora doctor` — non-destructive environment checks for a bot project.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const STUDIO_API_HEALTH = 'http://127.0.0.1:3920/api/studio/health';
const MIN_NODE_MAJOR = 20;

const TOKEN_PLACEHOLDERS = new Set([
  '',
  'your_bot_token',
  'your-bot-token',
  'changeme',
  'change_me',
  'change_me_to_random_string',
  'todo',
  'replace_me',
  '<token>',
  'xxx',
]);

export type DoctorStatus = 'pass' | 'fail' | 'skip';

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail: string;
}

function parseNodeMajor(version: string = process.versions.node): number {
  const major = Number.parseInt(version.split('.')[0] ?? '', 10);
  return Number.isFinite(major) ? major : 0;
}

function checkNodeVersion(): DoctorCheck {
  const version = process.versions.node;
  const major = parseNodeMajor(version);
  if (major >= MIN_NODE_MAJOR) {
    return {
      name: 'Node.js version',
      status: 'pass',
      detail: `v${version} (>= ${MIN_NODE_MAJOR})`,
    };
  }
  return {
    name: 'Node.js version',
    status: 'fail',
    detail: `v${version} — need >= ${MIN_NODE_MAJOR}`,
  };
}

function readEnvFile(cwd: string): { exists: boolean; values: Record<string, string> } {
  const envPath = resolve(cwd, '.env');
  if (!existsSync(envPath)) {
    return { exists: false, values: {} };
  }

  const values: Record<string, string> = {};
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  } catch {
    return { exists: true, values: {} };
  }

  return { exists: true, values };
}

function isPlaceholderToken(value: string | undefined): boolean {
  if (value === undefined) return true;
  const normalized = value.trim().toLowerCase();
  if (TOKEN_PLACEHOLDERS.has(normalized)) return true;
  if (normalized.includes('your_') || normalized.includes('your-')) return true;
  if (normalized.startsWith('<') && normalized.endsWith('>')) return true;
  return false;
}

function checkEnvToken(cwd: string): DoctorCheck {
  const { exists, values } = readEnvFile(cwd);
  if (!exists) {
    return {
      name: '.env / DISCORD_TOKEN',
      status: 'fail',
      detail: 'No .env file — copy .env.example and set DISCORD_TOKEN',
    };
  }

  const token = values.DISCORD_TOKEN ?? process.env.DISCORD_TOKEN;
  if (isPlaceholderToken(token)) {
    return {
      name: '.env / DISCORD_TOKEN',
      status: 'fail',
      detail: 'DISCORD_TOKEN missing or still a placeholder',
    };
  }

  return {
    name: '.env / DISCORD_TOKEN',
    status: 'pass',
    detail: '.env present, token looks set',
  };
}

const CONFIG_CANDIDATES = [
  'nexora.config.ts',
  'nexora.config.js',
  'nexora.config.mjs',
  'nexora.config.cjs',
] as const;

function checkConfigFile(cwd: string): DoctorCheck {
  for (const name of CONFIG_CANDIDATES) {
    if (existsSync(resolve(cwd, name))) {
      return {
        name: 'nexora.config.*',
        status: 'pass',
        detail: `Found ${name}`,
      };
    }
  }
  return {
    name: 'nexora.config.*',
    status: 'fail',
    detail: 'No nexora.config.ts / .js / .mjs / .cjs in project root',
  };
}

function checkCoreDependency(cwd: string): DoctorCheck {
  const pkgPath = resolve(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    return {
      name: '@nexora.ts/core',
      status: 'fail',
      detail: 'No package.json in current directory',
    };
  }

  try {
    const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const hasCore =
      Boolean(raw.dependencies?.['@nexora.ts/core']) ||
      Boolean(raw.devDependencies?.['@nexora.ts/core']) ||
      Boolean(raw.peerDependencies?.['@nexora.ts/core']);

    if (hasCore) {
      const range =
        raw.dependencies?.['@nexora.ts/core'] ??
        raw.devDependencies?.['@nexora.ts/core'] ??
        raw.peerDependencies?.['@nexora.ts/core'] ??
        '';
      return {
        name: '@nexora.ts/core',
        status: 'pass',
        detail: `Listed in package.json (${range})`,
      };
    }

    return {
      name: '@nexora.ts/core',
      status: 'fail',
      detail: 'Missing from dependencies — add @nexora.ts/core',
    };
  } catch {
    return {
      name: '@nexora.ts/core',
      status: 'fail',
      detail: 'Could not parse package.json',
    };
  }
}

async function checkStudioApiHealth(): Promise<DoctorCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);

  try {
    const res = await fetch(STUDIO_API_HEALTH, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      return {
        name: 'Studio API (:3920)',
        status: 'pass',
        detail: `GET /api/studio/health → ${res.status}`,
      };
    }

    return {
      name: 'Studio API (:3920)',
      status: 'fail',
      detail: `Responded with HTTP ${res.status}`,
    };
  } catch {
    clearTimeout(timer);
    return {
      name: 'Studio API (:3920)',
      status: 'skip',
      detail: 'Not running (optional) — start with pnpm dev / nexora dev',
    };
  }
}

function printCheck(check: DoctorCheck): void {
  const icon =
    check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '○';
  const label =
    check.status === 'pass' ? 'pass' : check.status === 'fail' ? 'fail' : 'skip';
  console.log(`  ${icon} [${label}] ${check.name}`);
  console.log(`         ${check.detail}`);
}

/**
 * Run all doctor checks and print a pass/fail report.
 * @returns process exit code (0 = no failures)
 */
export async function runDoctor(cwd: string = process.cwd()): Promise<number> {
  console.log('\n  Nexora Doctor\n');
  console.log(`  Project: ${cwd}\n`);

  const checks: DoctorCheck[] = [
    checkNodeVersion(),
    checkEnvToken(cwd),
    checkConfigFile(cwd),
    checkCoreDependency(cwd),
    await checkStudioApiHealth(),
  ];

  for (const check of checks) {
    printCheck(check);
    console.log('');
  }

  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const skipped = checks.filter((c) => c.status === 'skip').length;

  console.log(`  Summary: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);

  if (failed > 0) {
    console.log('  Fix the failed checks, then run `nexora doctor` again.\n');
    return 1;
  }

  console.log('  All required checks passed.\n');
  return 0;
}
