import type { CommandDefinition } from '@nexorajs/core';
import type { EventDefinition } from '@nexorajs/core';

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
  options: Record<string, unknown>;
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

/** Loaded plugin instance */
export interface LoadedPlugin {
  manifest: PluginManifest;
  enabled: boolean;
  path: string;
  commands: CommandDefinition[];
  events: EventDefinition[];
}

/**
 * Type-safe plugin builder.
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
