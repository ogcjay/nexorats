import type { LogLevel } from '@nexorajs/config';
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Log entry structure for file and live stream output */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
}

/** Logger options */
export interface LoggerOptions {
  level?: LogLevel;
  context?: string;
  file?: {
    enabled: boolean;
    path?: string;
    maxSize?: string;
    maxFiles?: number;
  };
  liveStream?: boolean;
  onLiveEntry?: (entry: LogEntry) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

const RESET = '\x1b[0m';

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

/** Structured logger with console, file, and live stream support */
export class Logger {
  private readonly level: LogLevel;
  private readonly context?: string;
  private readonly fileConfig?: LoggerOptions['file'];
  private readonly liveStream: boolean;
  private readonly onLiveEntry?: (entry: LogEntry) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.context = options.context;
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

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
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
      this.onLiveEntry(entry);
    }
  }

  private writeConsole(entry: LogEntry): void {
    const color = COLORS[entry.level];
    const contextStr = entry.context ? `[${entry.context}] ` : '';
    const metaStr = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
    const line = `${color}${entry.timestamp} ${entry.level.toUpperCase().padEnd(5)}${RESET} ${contextStr}${entry.message}${metaStr}`;

    if (entry.level === 'error') {
      console.error(line);
    } else if (entry.level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  private writeFile(entry: LogEntry): void {
    if (!this.fileConfig?.enabled) return;

    const filePath = this.fileConfig.path ?? './logs/nexora.log';
    const dir = dirname(filePath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.rotateIfNeeded(filePath);

    const contextStr = entry.context ? `[${entry.context}] ` : '';
    const metaStr = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
    const line = `${entry.timestamp} ${entry.level.toUpperCase().padEnd(5)} ${contextStr}${entry.message}${metaStr}\n`;

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
