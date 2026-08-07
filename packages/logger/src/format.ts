import type { LogLevel } from '@nexorajs/config';
import type { LogEntry, ConsoleMode } from './types.js';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

const LEVEL_BADGE: Record<string, string> = {
  debug: `\x1b[90m${BOLD} DEBUG ${RESET}`,
  info: `\x1b[46m\x1b[30m${BOLD} INFO  ${RESET}`,
  warn: `\x1b[43m\x1b[30m${BOLD} WARN  ${RESET}`,
  error: `\x1b[41m\x1b[37m${BOLD} ERROR ${RESET}`,
  command: `\x1b[45m\x1b[37m${BOLD} CMD   ${RESET}`,
};

const LEVEL_PLAIN: Record<string, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
  command: 'CMD  ',
};

const CONTEXT_WIDTH = 14;
const META_INDENT = ' '.repeat(17);

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function resolveDisplayLevel(entry: LogEntry): string {
  if (entry.meta?.type === 'command') return 'command';
  return entry.level;
}

function padContext(context?: string): string {
  const raw = context ?? '';
  if (raw.length >= CONTEXT_WIDTH) return raw.slice(0, CONTEXT_WIDTH - 1) + '…';
  return raw.padEnd(CONTEXT_WIDTH);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
}

function formatMetaValue(value: unknown, depth = 0): string[] {
  if (value instanceof Error) {
    const lines = [`${value.name}: ${value.message}`];
    if (value.stack) {
      const stackLines = value.stack.split('\n').slice(1);
      for (const line of stackLines) {
        lines.push(line.trimEnd());
      }
    }
    return lines;
  }

  if (isPlainObject(value) && depth < 2) {
    const keys = Object.keys(value);
    if (keys.length === 0) return ['{}'];
    const lines: string[] = [];
    for (const key of keys) {
      const nested = formatMetaValue(value[key], depth + 1);
      if (nested.length === 1) {
        lines.push(`${key}: ${nested[0]}`);
      } else {
        lines.push(`${key}:`);
        for (const n of nested) {
          lines.push(`  ${n}`);
        }
      }
    }
    return lines;
  }

  if (Array.isArray(value)) {
    try {
      return [JSON.stringify(value)];
    } catch {
      return ['[Array]'];
    }
  }

  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return [String(value)];
  }

  try {
    return [JSON.stringify(value)];
  } catch {
    return [String(value)];
  }
}

/** Serialize meta for JSON / live stream (Errors → plain objects) */
export function serializeMeta(
  meta?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!meta) return undefined;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value instanceof Error) {
      out[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    } else if (isPlainObject(value)) {
      out[key] = serializeMeta(value) ?? value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function formatPrettyMeta(meta?: Record<string, unknown>): string[] {
  if (!meta) return [];

  const lines: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (key === 'type' && value === 'command') continue;

    const displayValue =
      key === 'duration' && typeof value === 'number' ? `${value}ms` : value;
    const formatted = formatMetaValue(displayValue);
    if (formatted.length === 1) {
      lines.push(`${META_INDENT}${DIM}${key}:${RESET} ${formatted[0]}`);
    } else {
      lines.push(`${META_INDENT}${DIM}${key}:${RESET}`);
      for (const line of formatted) {
        lines.push(`${META_INDENT}  ${DIM}${line}${RESET}`);
      }
    }
  }
  return lines;
}

export function formatPretty(entry: LogEntry): string {
  const display = resolveDisplayLevel(entry);
  const badge = LEVEL_BADGE[display] ?? LEVEL_BADGE.info;
  const time = `${DIM}${formatTimestamp(entry.timestamp)}${RESET}`;
  const ctx = `${DIM}${padContext(entry.context)}${RESET}`;
  const header = `${time} ${badge} ${ctx} ${entry.message}`;
  const metaLines = formatPrettyMeta(entry.meta);
  return metaLines.length > 0 ? [header, ...metaLines].join('\n') : header;
}

export function formatCompact(entry: LogEntry): string {
  const display = resolveDisplayLevel(entry);
  const level = LEVEL_PLAIN[display] ?? entry.level.toUpperCase().padEnd(5);
  const time = formatTimestamp(entry.timestamp);
  const ctx = entry.context ? `[${entry.context}] ` : '';
  const meta = entry.meta ? ` ${compactMeta(entry.meta)}` : '';
  return `${time} ${level} ${ctx}${entry.message}${meta}`;
}

function compactMeta(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (key === 'type' && value === 'command') continue;
    if (value instanceof Error) {
      parts.push(`${key}=${value.name}:${value.message}`);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      parts.push(`${key}=${value}`);
    } else {
      try {
        parts.push(`${key}=${JSON.stringify(value)}`);
      } catch {
        parts.push(`${key}=[unserializable]`);
      }
    }
  }
  return parts.join(' ');
}

export function formatJson(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    context: entry.context,
    meta: serializeMeta(entry.meta),
  });
}

export function formatConsole(entry: LogEntry, mode: ConsoleMode): string {
  switch (mode) {
    case 'json':
      return formatJson(entry);
    case 'compact':
      return formatCompact(entry);
    case 'pretty':
    default:
      return formatPretty(entry);
  }
}

export function writeToConsole(level: LogLevel, line: string): void {
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
