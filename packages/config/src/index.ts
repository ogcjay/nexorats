import { z } from 'zod';
import { loadEnv } from './load-env.js';

// Load project .env before defineConfig consumers read process.env
loadEnv();

export { loadEnv } from './load-env.js';

/** Supported database providers */
export type DatabaseProvider = 'postgresql' | 'sqlite';

/** Log level enumeration */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Discord bot configuration */
export interface BotConfig {
  token: string;
  clientId: string;
  guildIds?: string[];
  intents?: string[];
}

/** Database configuration */
export interface DatabaseConfig {
  provider: DatabaseProvider;
  url: string;
}

/** Dashboard configuration */
export interface DashboardConfig {
  enabled: boolean;
  port?: number;
  url?: string;
  secret?: string;
}

/** Auth / OAuth configuration */
export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/** Console output mode for @nexora.ts/logger */
export type LoggerConsoleMode = 'pretty' | 'compact' | 'json';

/** Logger configuration */
export interface LoggerConfig {
  level: LogLevel;
  /** Console formatting — defaults to pretty in development */
  console?: {
    mode?: LoggerConsoleMode;
  };
  file?: {
    enabled: boolean;
    path?: string;
    maxSize?: string;
    maxFiles?: number;
  };
  liveStream?: boolean;
}

/** Cache configuration */
export interface CacheConfig {
  provider: 'memory' | 'redis';
  redis?: {
    url: string;
  };
  defaultTtl?: number;
}

/** Plugin configuration entry */
export interface PluginConfigEntry {
  enabled: boolean;
  options?: Record<string, unknown>;
}

/** Root Nexora configuration */
export interface NexoraConfig {
  bot: BotConfig;
  database: DatabaseConfig;
  dashboard?: DashboardConfig;
  auth?: AuthConfig;
  logger?: LoggerConfig;
  cache?: CacheConfig;
  plugins?: Record<string, PluginConfigEntry>;
  /**
   * Check npm on bot start for a newer `@nexora.ts/core` and print update commands.
   * Default: `true`. Set `false` or env `NEXORA_UPDATE_CHECK=0` to disable.
   */
  updateCheck?: boolean;
}

/** Zod schema for runtime validation */
export const nexoraConfigSchema = z.object({
  bot: z.object({
    token: z.string().min(1),
    clientId: z.string().min(1),
    guildIds: z.array(z.string()).optional(),
    intents: z.array(z.string()).optional(),
  }),
  database: z.object({
    provider: z.enum(['postgresql', 'sqlite']),
    url: z.string().min(1),
  }),
  dashboard: z
    .object({
      enabled: z.boolean(),
      port: z.number().int().positive().optional(),
      url: z.string().url().optional(),
      secret: z.string().optional(),
    })
    .optional(),
  auth: z
    .object({
      clientId: z.string().min(1),
      clientSecret: z.string().min(1),
      redirectUri: z.string().url(),
      scopes: z.array(z.string()).optional(),
    })
    .optional(),
  logger: z
    .object({
      level: z.enum(['debug', 'info', 'warn', 'error']),
      console: z
        .object({
          mode: z.enum(['pretty', 'compact', 'json']).optional(),
        })
        .optional(),
      file: z
        .object({
          enabled: z.boolean(),
          path: z.string().optional(),
          maxSize: z.string().optional(),
          maxFiles: z.number().int().positive().optional(),
        })
        .optional(),
      liveStream: z.boolean().optional(),
    })
    .optional(),
  cache: z
    .object({
      provider: z.enum(['memory', 'redis']),
      redis: z
        .object({
          url: z.string().min(1),
        })
        .optional(),
      defaultTtl: z.number().int().positive().optional(),
    })
    .optional(),
  plugins: z
    .record(
      z.object({
        enabled: z.boolean(),
        options: z.record(z.unknown()).optional(),
      }),
    )
    .optional(),
  updateCheck: z.boolean().optional(),
});

/** Deep partial type helper */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type-safe configuration builder.
 * Returns the config unchanged — enables IDE autocomplete and type checking.
 */
export function defineConfig<T extends NexoraConfig>(config: T): T {
  return config;
}

/**
 * Validates configuration at runtime using Zod.
 * @throws {z.ZodError} when validation fails
 */
export function validateConfig(config: unknown): NexoraConfig {
  return nexoraConfigSchema.parse(config);
}

/**
 * Loads environment variables into config overrides.
 * Maps standard NEXORA_* env vars to config paths.
 */
export function loadEnvOverrides(): DeepPartial<NexoraConfig> {
  const overrides: DeepPartial<NexoraConfig> = {};

  if (process.env.NEXORA_BOT_TOKEN) {
    overrides.bot = { ...overrides.bot, token: process.env.NEXORA_BOT_TOKEN };
  }
  if (process.env.NEXORA_BOT_CLIENT_ID) {
    overrides.bot = { ...overrides.bot, clientId: process.env.NEXORA_BOT_CLIENT_ID };
  }
  if (process.env.NEXORA_DATABASE_URL) {
    overrides.database = {
      ...overrides.database,
      url: process.env.NEXORA_DATABASE_URL,
      provider: (process.env.NEXORA_DATABASE_PROVIDER as DatabaseProvider) ?? 'postgresql',
    };
  }
  if (process.env.NEXORA_DASHBOARD_SECRET) {
    overrides.dashboard = {
      enabled: true,
      ...overrides.dashboard,
      secret: process.env.NEXORA_DASHBOARD_SECRET,
    };
  }
  if (process.env.NEXORA_LOG_LEVEL) {
    overrides.logger = {
      ...overrides.logger,
      level: process.env.NEXORA_LOG_LEVEL as LogLevel,
    };
  }

  return overrides;
}

/** Deep merge two config objects */
export function mergeConfig<T extends NexoraConfig>(base: T, overrides: DeepPartial<T>): T {
  const result = { ...base } as Record<string, unknown>;
  const baseRecord = base as Record<string, unknown>;
  const overridesRecord = overrides as Record<string, unknown>;

  for (const key of Object.keys(overridesRecord)) {
    const overrideValue = overridesRecord[key];
    const baseValue = baseRecord[key];

    if (
      overrideValue !== undefined &&
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeConfig(
        baseValue as NexoraConfig,
        overrideValue as DeepPartial<NexoraConfig>,
      );
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }

  return result as T;
}
