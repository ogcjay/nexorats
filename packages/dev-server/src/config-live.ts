import type { NexoraConfig } from '@nexora.ts/config';

/** Dot-paths that may be hot-patched in-memory (no secrets). */
export const LIVE_CONFIG_ALLOWLIST = [
  'logger.level',
  'bot.guildIds',
  'logger.console.mode',
  'updateCheck',
] as const;

export type LiveConfigKey = (typeof LIVE_CONFIG_ALLOWLIST)[number];

export interface LiveConfigGetResponse {
  config: Record<string, unknown>;
  allowlist: readonly string[];
  limitations: string[];
}

export interface LiveConfigPutBody {
  patch?: Record<string, unknown>;
}

export interface LiveConfigPutResponse {
  ok: boolean;
  applied: string[];
  rejected: Array<{ key: string; reason: string }>;
  config: Record<string, unknown>;
  limitations: string[];
}

const LIMITATIONS = [
  'Hot patch is in-memory only — not written to disk / nexora.config.',
  'Only allowlisted non-secret keys can be changed.',
  'Token, secrets, database URL, and auth credentials are never writable via Studio.',
  'Some changes (intents, plugins) require a full restart and are not allowlisted.',
] as const;

const VALID_LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const VALID_CONSOLE_MODES = new Set(['pretty', 'compact', 'json']);

function getPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const next = cur[part];
    if (!next || typeof next !== 'object') {
      cur[part] = {};
    }
    cur = cur[part] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function validatePatchValue(key: LiveConfigKey, value: unknown): string | null {
  switch (key) {
    case 'logger.level':
      if (typeof value !== 'string' || !VALID_LOG_LEVELS.has(value)) {
        return 'logger.level must be debug|info|warn|error';
      }
      return null;
    case 'logger.console.mode':
      if (typeof value !== 'string' || !VALID_CONSOLE_MODES.has(value)) {
        return 'logger.console.mode must be pretty|compact|json';
      }
      return null;
    case 'bot.guildIds':
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
        return 'bot.guildIds must be string[]';
      }
      return null;
    case 'updateCheck':
      if (typeof value !== 'boolean') {
        return 'updateCheck must be boolean';
      }
      return null;
    default:
      return 'Key not allowlisted';
  }
}

export function buildLiveConfigGet(
  sanitized: Record<string, unknown>,
): LiveConfigGetResponse {
  const allowlisted: Record<string, unknown> = {};
  for (const key of LIVE_CONFIG_ALLOWLIST) {
    allowlisted[key] = getPath(sanitized, key);
  }
  return {
    config: {
      ...sanitized,
      __liveAllowlist: allowlisted,
    },
    allowlist: LIVE_CONFIG_ALLOWLIST,
    limitations: [...LIMITATIONS],
  };
}

/**
 * Apply allowlisted hot patches onto the live NexoraConfig object.
 */
export function applyLiveConfigPatch(
  liveConfig: NexoraConfig,
  body: unknown,
  sanitize: (config: NexoraConfig) => Record<string, unknown>,
): LiveConfigPutResponse {
  const applied: string[] = [];
  const rejected: Array<{ key: string; reason: string }> = [];

  const patch =
    body && typeof body === 'object' && body !== null && 'patch' in body
      ? (body as LiveConfigPutBody).patch
      : body && typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : undefined;

  if (!patch || typeof patch !== 'object') {
    return {
      ok: false,
      applied,
      rejected: [{ key: '*', reason: 'Body must be `{ patch: { ... } }` or a flat allowlisted map' }],
      config: sanitize(liveConfig),
      limitations: [...LIMITATIONS],
    };
  }

  const live = liveConfig as unknown as Record<string, unknown>;

  for (const [key, value] of Object.entries(patch)) {
    if (!(LIVE_CONFIG_ALLOWLIST as readonly string[]).includes(key)) {
      rejected.push({ key, reason: 'Not in allowlist (secrets and most keys are blocked)' });
      continue;
    }
    const typedKey = key as LiveConfigKey;
    const err = validatePatchValue(typedKey, value);
    if (err) {
      rejected.push({ key, reason: err });
      continue;
    }
    setPath(live, typedKey, value);
    applied.push(typedKey);
  }

  return {
    ok: rejected.length === 0,
    applied,
    rejected,
    config: sanitize(liveConfig),
    limitations: [...LIMITATIONS],
  };
}
