import type { LogLevel } from '@nexorajs/config';
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  formatCompact,
  formatConsole,
  serializeMeta,
  writeToConsole,
} from './format.js';
import { printStartupBanner } from './banner.js';
import type {
  CommandMeta,
  ConsoleMode,
  LogEntry,
  LoggerOptions,
  StartupBannerOptions,
} from './types.js';

export type {
  CommandMeta,
  ConsoleMode,
  LogEntry,
  LoggerOptions,
  StartupBannerOptions,
};
export type { LoggerConsoleMode } from '@nexorajs/config';
export { printStartupBanner };

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Parse size string like "10mb" to bytes */
function parseSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)?$/i);
  if (!match) return 10 * 1024 * 1024;

  const value = parseFloat(match[1] ?? '10');
  const unit = (match[2] ?? 'mb').toLowerCase();

  const multipliers: Record<string, number> = {
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] ?? 1024 * 1024);
}

function defaultConsoleMode(): ConsoleMode {
  return process.env.NODE_ENV === 'production' ? 'compact' : 'pretty';
}

/** Structured logger with console, file, and live stream support */
export class Logger {
  private readonly level: LogLevel;
  private readonly context?: string;
  private readonly consoleMode: ConsoleMode;
  private readonly fileConfig?: LoggerOptions['file'];
  private readonly liveStream: boolean;
  private readonly onLiveEntry?: (entry: LogEntry) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.context = options.context;
    this.consoleMode = options.console?.mode ?? defaultConsoleMode();
    this.fileConfig = options.file;
    this.liveStream = options.liveStream ?? false;
    this.onLiveEntry = options.onLiveEntry;
  }

  /** Create a child logger with additional context */
  child(context: string): Logger {
    const childContext = this.context ? `${this.context}:${context}` : context;
    return new Logger({
      level: this.level,
      context: childContext,
      console: { mode: this.consoleMode },
      file: this.fileConfig,
      liveStream: this.liveStream,
      onLiveEntry: this.onLiveEntry,
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown> | Error): void {
    if (meta instanceof Error) {
      this.log('error', message, { error: meta });
      return;
    }
    this.log('error', message, meta);
  }

  /**
   * Command execution trace — pretty mode shows a CMD badge.
   * Equivalent to `info(msg, { type: 'command', ... })`.
   */
  command(message: string, meta?: CommandMeta): void {
    this.log('info', message, { ...meta, type: 'command' });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      meta,
    };

    this.writeConsole(entry);
    this.writeFile(entry);

    if (this.liveStream && this.onLiveEntry) {
      this.onLiveEntry(this.toLiveEntry(entry));
    }
  }

  /** Live / dashboard entries stay structured; Errors are serialized */
  private toLiveEntry(entry: LogEntry): LogEntry {
    return {
      ...entry,
      meta: serializeMeta(entry.meta),
    };
  }

  private writeConsole(entry: LogEntry): void {
    const line = formatConsole(entry, this.consoleMode);
    writeToConsole(entry.level, line);
  }

  private writeFile(entry: LogEntry): void {
    if (!this.fileConfig?.enabled) return;

    const filePath = this.fileConfig.path ?? './logs/nexora.log';
    const dir = dirname(filePath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.rotateIfNeeded(filePath);

    // File output stays compact + serializable (no ANSI)
    const line = `${formatCompact({
      ...entry,
      meta: serializeMeta(entry.meta),
    })}\n`;

    appendFileSync(filePath, line, 'utf-8');
  }

  private rotateIfNeeded(filePath: string): void {
    if (!existsSync(filePath)) return;

    const maxSize = parseSize(this.fileConfig?.maxSize ?? '10mb');
    const maxFiles = this.fileConfig?.maxFiles ?? 5;

    if (statSync(filePath).size < maxSize) return;

    for (let i = maxFiles - 1; i >= 1; i--) {
      const from = i === 1 ? filePath : `${filePath}.${i - 1}`;
      const to = `${filePath}.${i}`;
      if (existsSync(from)) {
        renameSync(from, to);
      }
    }
  }
}

/** Factory for creating loggers */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/** Global live stream subscribers */
const liveSubscribers = new Set<(entry: LogEntry) => void>();

/** Subscribe to live log events */
export function subscribeLiveLogs(callback: (entry: LogEntry) => void): () => void {
  liveSubscribers.add(callback);
  return () => liveSubscribers.delete(callback);
}

/** Create logger with built-in live stream broadcasting */
export function createLiveLogger(
  options?: Omit<LoggerOptions, 'liveStream' | 'onLiveEntry'>,
): Logger {
  return new Logger({
    ...options,
    liveStream: true,
    onLiveEntry: (entry) => {
      for (const subscriber of liveSubscribers) {
        subscriber(entry);
      }
    },
  });
}
