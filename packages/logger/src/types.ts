import type { LogLevel, LoggerConsoleMode } from '@nexorajs/config';

/** Console output mode */
export type ConsoleMode = LoggerConsoleMode;

/** Log entry structure for file and live stream output */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
}

/** Meta payload for command traces */
export interface CommandMeta {
  type?: 'command';
  name?: string;
  user?: string;
  duration?: number | string;
  [key: string]: unknown;
}

/** Logger options */
export interface LoggerOptions {
  level?: LogLevel;
  context?: string;
  /** Console formatting — defaults to `pretty` outside production */
  console?: {
    mode?: ConsoleMode;
  };
  file?: {
    enabled: boolean;
    path?: string;
    maxSize?: string;
    maxFiles?: number;
  };
  liveStream?: boolean;
  onLiveEntry?: (entry: LogEntry) => void;
}

/** Options for the startup banner helper */
export interface StartupBannerOptions {
  name: string;
  version: string;
  userTag?: string;
  commands?: number;
  events?: number;
  studioUrl?: string;
}
