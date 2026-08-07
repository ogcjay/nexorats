import { createRequire } from 'node:module';
import type { Logger } from '@nexora.ts/logger';

const require = createRequire(import.meta.url);

const CORE_PACKAGE = '@nexora.ts/core';
const REGISTRY_URL = `https://registry.npmjs.org/${CORE_PACKAGE}/latest`;
const FETCH_TIMEOUT_MS = 3_500;

export interface UpdateCheckResult {
  current: string;
  latest: string;
  updateAvailable: boolean;
}

/** Read the installed @nexora.ts/core version from its package.json */
export function getInstalledCoreVersion(): string {
  try {
    const pkg = require('../package.json') as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** Compare semver-ish versions (major.minor.patch). Returns true if latest > current. */
export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string): number[] =>
    v
      .replace(/^v/, '')
      .split('-')[0]!
      .split('.')
      .map((p) => Number.parseInt(p, 10) || 0);

  const a = parse(latest);
  const b = parse(current);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return false;
}

/** Fetch latest version from the npm registry (fails soft). */
export async function fetchLatestCoreVersion(): Promise<string | null> {
  try {
    const response = await fetch(REGISTRY_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    return typeof data.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

/**
 * Check npm for a newer @nexora.ts/core and log a clear update hint.
 * Never throws — network/registry errors are ignored.
 */
export async function checkForCoreUpdate(logger: Logger): Promise<UpdateCheckResult | null> {
  const current = getInstalledCoreVersion();
  const latest = await fetchLatestCoreVersion();
  if (!latest) return null;

  const updateAvailable = isNewerVersion(latest, current);
  if (!updateAvailable) {
    return { current, latest, updateAvailable: false };
  }

  logger.warn(`Update available: ${CORE_PACKAGE}@${current} → ${latest}`);
  logger.info(`Update with:  pnpm add ${CORE_PACKAGE}@latest`);
  logger.info(`Or all pkgs:  pnpm update "@nexora.ts/*"`);

  return { current, latest, updateAvailable: true };
}
