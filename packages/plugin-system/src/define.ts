import type {
  CommandDefinition,
  Container,
  EventDefinition,
  Nexora,
} from '@nexorajs/core';
import type { Logger } from '@nexorajs/logger';

/** Dashboard page definition for plugins */
export interface PluginDashboardPage {
  path: string;
  title: string;
  icon?: string;
  component: string;
  permissions?: string[];
}

/** API route definition for plugins */
export interface PluginApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: string;
  permissions?: string[];
}

/** Plugin migration definition */
export interface PluginMigration {
  version: string;
  up: string;
  down?: string;
}

/** Plugin service registration */
export interface PluginService {
  token: string;
  factory: string;
  singleton?: boolean;
}

/** Plugin context passed during lifecycle hooks */
export interface PluginContext {
  name: string;
  version: string;
  /** Plugin-specific options from nexora config */
  options: Record<string, unknown>;
  /** Nexora bot instance */
  bot: Nexora;
  /** Alias for {@link bot} */
  nexora: Nexora;
  logger: Logger;
  container: Container;
  /** Plugin manifest config block (or empty object) */
  config: Record<string, unknown>;
  /** Register a slash command at runtime */
  registerCommand: (command: CommandDefinition) => void;
  /** Register a Discord event handler at runtime */
  registerEvent: (event: EventDefinition) => void;
}

/** Full plugin manifest */
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
  nexora?: string;
  commands?: string[];
  events?: string[];
  dashboard?: PluginDashboardPage[];
  api?: PluginApiRoute[];
  migrations?: PluginMigration[];
  services?: PluginService[];
  config?: Record<string, unknown>;
}

/**
 * Abstract base class for class-based plugins with lifecycle hooks.
 * Additive to the {@link plugin} helper — either style can be a default export.
 *
 * @example
 * export default class TicketsPlugin extends NexoraPlugin {
 *   readonly manifest = {
 *     name: 'tickets',
 *     version: '1.0.0',
 *     description: 'Ticket system',
 *   };
 *
 *   async onLoad(ctx: PluginContext) {
 *     ctx.logger.info('Tickets plugin loaded');
 *   }
 * }
 */
export abstract class NexoraPlugin {
  abstract readonly manifest: PluginManifest;

  abstract onLoad(ctx: PluginContext): Promise<void> | void;

  onUnload?(ctx: PluginContext): Promise<void> | void;
}

/** Alias for {@link NexoraPlugin} */
export { NexoraPlugin as Plugin };

/** Loaded plugin instance */
export interface LoadedPlugin {
  manifest: PluginManifest;
  enabled: boolean;
  path: string;
  commands: CommandDefinition[];
  events: EventDefinition[];
  /** Class-based plugin instance, if loaded via NexoraPlugin */
  instance?: NexoraPlugin;
  /** Lifecycle context (present after successful load) */
  context?: PluginContext;
}

/**
 * Type-safe plugin builder (manifest-only / declarative style).
 *
 * @example
 * export default plugin({
 *   name: 'tickets',
 *   version: '1.0.0',
 *   description: 'Ticket system',
 * });
 */
export function plugin(manifest: PluginManifest): PluginManifest {
  return manifest;
}

/** True if `value` is a constructor that extends {@link NexoraPlugin} */
export function isNexoraPluginClass(value: unknown): value is new () => NexoraPlugin {
  return typeof value === 'function' && value.prototype instanceof NexoraPlugin;
}

/** True if `value` looks like a {@link PluginManifest} object */
export function isPluginManifest(value: unknown): value is PluginManifest {
  if (typeof value !== 'object' || value === null) return false;
  if (value instanceof NexoraPlugin) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === 'string' && typeof candidate.version === 'string';
}
