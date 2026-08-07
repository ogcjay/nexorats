import type { Logger } from '@nexorajs/logger';
import {
  FrameworkEvents,
  TOKENS,
  type CommandRegistry,
  type EventRegistry,
  type EventBus,
  type Nexora,
} from '@nexorajs/core';
import type { LoadedPlugin, PluginManifest } from './define.js';

/** Plugin loader options */
export interface PluginLoaderOptions {
  pluginsPath: string;
  enabledPlugins?: Record<string, { enabled: boolean; options?: Record<string, unknown> }>;
}

/** Plugin loader — discovers, resolves dependencies, and loads plugins */
export class PluginLoader {
  private readonly loaded = new Map<string, LoadedPlugin>();

  constructor(
    private readonly nexora: Nexora,
    private readonly logger: Logger,
  ) {}

  /** Get all loaded plugins */
  getAll(): LoadedPlugin[] {
    return [...this.loaded.values()];
  }

  /** Get a specific plugin */
  get(name: string): LoadedPlugin | undefined {
    return this.loaded.get(name);
  }

  /** Load all plugins from directory */
  async loadAll(options: PluginLoaderOptions): Promise<void> {
    const { glob } = await import('glob');
    const { pathToFileURL } = await import('node:url');
    const { dirname, join } = await import('node:path');

    const manifestFiles = await glob(`${options.pluginsPath}/**/plugin.json`, { absolute: true });

    const manifests: PluginManifest[] = [];

    for (const file of manifestFiles) {
      try {
        const content = await import(pathToFileURL(file).href);
        const manifest = (content.default ?? content) as PluginManifest;
        manifests.push(manifest);
      } catch (error) {
        this.logger.error(`Failed to read plugin manifest: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const sorted = this.resolveDependencies(manifests);

    for (const manifest of sorted) {
      const config = options.enabledPlugins?.[manifest.name];
      if (config && !config.enabled) {
        this.logger.info(`Plugin disabled: ${manifest.name}`);
        continue;
      }

      await this.loadPlugin(
        manifest,
        dirname(
          manifestFiles.find((f: string) => f.includes(manifest.name)) ?? options.pluginsPath,
        )!,
      );
    }
  }

  /** Load a single plugin by name */
  async load(name: string, pluginPath: string): Promise<void> {
    const { pathToFileURL } = await import('node:url');
    const { join } = await import('node:path');

    const manifestFile = join(pluginPath, 'plugin.json');
    const content = await import(pathToFileURL(manifestFile).href);
    const manifest = (content.default ?? content) as PluginManifest;

    await this.loadPlugin(manifest, pluginPath);
  }

  /** Unload a plugin */
  async unload(name: string): Promise<boolean> {
    const plugin = this.loaded.get(name);
    if (!plugin) return false;

    const eventBus = this.nexora.eventBus;

    await eventBus.emit(FrameworkEvents.PLUGIN_UNLOADED, {
      name,
      plugin,
    });

    this.loaded.delete(name);
    this.logger.info(`Unloaded plugin: ${name}`);
    return true;
  }

  private async loadPlugin(manifest: PluginManifest, pluginPath: string): Promise<void> {
    if (this.loaded.has(manifest.name)) return;

    this.logger.info(`Loading plugin: ${manifest.name} v${manifest.version}`);

    const { pathToFileURL } = await import('node:url');
    const { join } = await import('node:path');
    const { glob } = await import('glob');

    const commands: LoadedPlugin['commands'] = [];
    const events: LoadedPlugin['events'] = [];

    const commandFiles = await glob(join(pluginPath, 'commands', '**/*.{ts,js}'), {
      absolute: true,
    });
    for (const file of commandFiles) {
      try {
        const mod = await import(pathToFileURL(file).href);
        if (mod.default?.name) commands.push(mod.default);
      } catch (error) {
        this.logger.error(`Failed to load plugin command: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const eventFiles = await glob(join(pluginPath, 'events', '**/*.{ts,js}'), { absolute: true });
    for (const file of eventFiles) {
      try {
        const mod = await import(pathToFileURL(file).href);
        if (mod.default?.name) events.push(mod.default);
      } catch (error) {
        this.logger.error(`Failed to load plugin event: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const commandRegistry = this.nexora.commandRegistry;
    const eventRegistry = this.nexora.eventRegistry;

    for (const cmd of commands) {
      commandRegistry.register({ ...cmd, source: `plugin:${manifest.name}` });
    }

    for (const evt of events) {
      eventRegistry.register({ ...evt, source: `plugin:${manifest.name}` });
    }

    const loaded: LoadedPlugin = {
      manifest,
      enabled: true,
      path: pluginPath,
      commands,
      events,
    };

    this.loaded.set(manifest.name, loaded);

    await this.nexora.eventBus.emit(FrameworkEvents.PLUGIN_LOADED, {
      name: manifest.name,
      plugin: loaded,
    });

    this.logger.info(
      `Loaded plugin: ${manifest.name} (${commands.length} commands, ${events.length} events)`,
    );
  }

  /** Topological sort for plugin dependencies */
  private resolveDependencies(manifests: PluginManifest[]): PluginManifest[] {
    const graph = new Map<string, string[]>();
    const manifestMap = new Map<string, PluginManifest>();

    for (const m of manifests) {
      manifestMap.set(m.name, m);
      graph.set(m.name, Object.keys(m.dependencies ?? {}));
    }

    const sorted: PluginManifest[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular plugin dependency detected: ${name}`);
      }

      visiting.add(name);
      for (const dep of graph.get(name) ?? []) {
        if (manifestMap.has(dep)) visit(dep);
      }
      visiting.delete(name);
      visited.add(name);

      const manifest = manifestMap.get(name);
      if (manifest) sorted.push(manifest);
    };

    for (const name of graph.keys()) {
      visit(name);
    }

    return sorted;
  }
}
