import type { Logger } from '@nexora.ts/logger';
import { FrameworkEvents, type Nexora } from '@nexora.ts/core';
import {
  isNexoraPluginClass,
  isPluginManifest,
  type LoadedPlugin,
  type NexoraPlugin,
  type PluginContext,
  type PluginManifest,
} from './define.js';

/** Plugin loader options */
export interface PluginLoaderOptions {
  pluginsPath: string;
  enabledPlugins?: Record<string, { enabled: boolean; options?: Record<string, unknown> }>;
}

const ENTRY_CANDIDATES = [
  'index.js',
  'index.ts',
  'index.mjs',
  'dist/index.js',
  'src/index.js',
  'src/index.ts',
] as const;

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
    const { basename, dirname, join } = await import('node:path');
    const { existsSync } = await import('node:fs');

    const pluginDirs = new Map<string, string>();

    const manifestFiles = await glob(`${options.pluginsPath}/**/plugin.json`, { absolute: true });
    for (const file of manifestFiles) {
      pluginDirs.set(dirname(file), file);
    }

    const rootEntries = await glob(`${options.pluginsPath}/*/index.{ts,js,mjs}`, {
      absolute: true,
    });
    const srcEntries = await glob(`${options.pluginsPath}/*/src/index.{ts,js,mjs}`, {
      absolute: true,
    });

    for (const file of [...rootEntries, ...srcEntries]) {
      const parent = dirname(file);
      const dir = basename(parent) === 'src' ? dirname(parent) : parent;
      if (!pluginDirs.has(dir)) {
        pluginDirs.set(dir, file);
      }
    }

    type Pending = {
      manifest: PluginManifest;
      path: string;
      entry?: unknown;
    };

    const pending: Pending[] = [];

    for (const [pluginPath, discoveryFile] of pluginDirs) {
      try {
        let jsonManifest: PluginManifest | undefined;

        const jsonPath = join(pluginPath, 'plugin.json');
        if (existsSync(jsonPath)) {
          const content = await import(pathToFileURL(jsonPath).href);
          jsonManifest = (content.default ?? content) as PluginManifest;
        }

        const entry = await this.resolveEntry(pluginPath);
        const resolved = this.resolveExport(entry, jsonManifest);

        if (!resolved.manifest) {
          this.logger.warn(`Skipping plugin without manifest: ${pluginPath}`);
          continue;
        }

        pending.push({
          manifest: resolved.manifest,
          path: pluginPath,
          entry: resolved.entry ?? entry,
        });
      } catch (error) {
        this.logger.error(`Failed to discover plugin: ${discoveryFile}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const sorted = this.resolveDependencies(pending.map((p) => p.manifest));
    const byName = new Map(pending.map((p) => [p.manifest.name, p]));

    for (const manifest of sorted) {
      const item = byName.get(manifest.name);
      if (!item) continue;

      const config = options.enabledPlugins?.[manifest.name];
      if (config && !config.enabled) {
        this.logger.info(`Plugin disabled: ${manifest.name}`);
        continue;
      }

      await this.loadPlugin(item.manifest, item.path, config?.options ?? {}, item.entry);
    }
  }

  /** Load a single plugin by name */
  async load(
    name: string,
    pluginPath: string,
    pluginOptions: Record<string, unknown> = {},
  ): Promise<void> {
    const { pathToFileURL } = await import('node:url');
    const { join } = await import('node:path');
    const { existsSync } = await import('node:fs');

    let jsonManifest: PluginManifest | undefined;
    const manifestFile = join(pluginPath, 'plugin.json');
    if (existsSync(manifestFile)) {
      const content = await import(pathToFileURL(manifestFile).href);
      jsonManifest = (content.default ?? content) as PluginManifest;
    }

    const entry = await this.resolveEntry(pluginPath);
    const resolved = this.resolveExport(entry, jsonManifest);

    if (!resolved.manifest) {
      throw new Error(`Plugin "${name}" has no manifest (plugin.json or default export)`);
    }

    if (resolved.manifest.name !== name) {
      this.logger.warn(
        `Plugin path name "${name}" differs from manifest name "${resolved.manifest.name}"`,
      );
    }

    await this.loadPlugin(resolved.manifest, pluginPath, pluginOptions, resolved.entry ?? entry);
  }

  /** Unload a plugin */
  async unload(name: string): Promise<boolean> {
    const plugin = this.loaded.get(name);
    if (!plugin) return false;

    if (plugin.instance?.onUnload && plugin.context) {
      try {
        await plugin.instance.onUnload(plugin.context);
      } catch (error) {
        this.logger.error(`Plugin onUnload failed: ${name}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.nexora.eventBus.emit(FrameworkEvents.PLUGIN_UNLOADED, {
      name,
      plugin,
    });

    this.loaded.delete(name);
    this.logger.info(`Unloaded plugin: ${name}`);
    return true;
  }

  private async loadPlugin(
    manifest: PluginManifest,
    pluginPath: string,
    pluginOptions: Record<string, unknown> = {},
    entry?: unknown,
  ): Promise<void> {
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

    const context = this.createContext(manifest, pluginOptions, commands, events);

    let instance: NexoraPlugin | undefined;
    const resolvedEntry = entry ?? (await this.resolveEntry(pluginPath));

    if (isNexoraPluginClass(resolvedEntry)) {
      instance = new resolvedEntry();
      await instance.onLoad(context);
    } else if (isPluginInstance(resolvedEntry)) {
      instance = resolvedEntry;
      await instance.onLoad(context);
    }

    const loaded: LoadedPlugin = {
      manifest,
      enabled: true,
      path: pluginPath,
      commands,
      events,
      instance,
      context,
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

  private createContext(
    manifest: PluginManifest,
    options: Record<string, unknown>,
    commands: LoadedPlugin['commands'],
    events: LoadedPlugin['events'],
  ): PluginContext {
    const commandRegistry = this.nexora.commandRegistry;
    const eventRegistry = this.nexora.eventRegistry;
    const pluginLogger = this.logger.child(`plugin:${manifest.name}`);

    return {
      name: manifest.name,
      version: manifest.version,
      options,
      bot: this.nexora,
      nexora: this.nexora,
      logger: pluginLogger,
      container: this.nexora.container,
      config: manifest.config ?? {},
      registerCommand: (command) => {
        commandRegistry.register({ ...command, source: `plugin:${manifest.name}` });
        commands.push(command);
      },
      registerEvent: (event) => {
        eventRegistry.register({ ...event, source: `plugin:${manifest.name}` });
        events.push(event);
      },
    };
  }

  private async resolveEntry(pluginPath: string): Promise<unknown | undefined> {
    const { pathToFileURL } = await import('node:url');
    const { join } = await import('node:path');
    const { existsSync } = await import('node:fs');

    for (const candidate of ENTRY_CANDIDATES) {
      const full = join(pluginPath, candidate);
      if (!existsSync(full)) continue;

      try {
        const mod = await import(pathToFileURL(full).href);
        return mod.default ?? mod;
      } catch (error) {
        this.logger.debug(`Failed to import plugin entry: ${full}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return undefined;
  }

  /**
   * Resolve default export: NexoraPlugin class, instance, or plugin() manifest.
   * Instantiates class exports once so loadPlugin can reuse the same instance.
   */
  private resolveExport(
    entry: unknown,
    jsonManifest?: PluginManifest,
  ): { manifest?: PluginManifest; entry?: unknown } {
    if (isNexoraPluginClass(entry)) {
      const instance = new entry();
      return {
        manifest: mergeManifests(jsonManifest, instance.manifest),
        entry: instance,
      };
    }

    if (isPluginInstance(entry)) {
      return {
        manifest: mergeManifests(jsonManifest, entry.manifest),
        entry,
      };
    }

    if (isPluginManifest(entry)) {
      return { manifest: mergeManifests(jsonManifest, entry), entry };
    }

    if (jsonManifest) {
      return { manifest: jsonManifest, entry };
    }

    return {};
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

function isPluginInstance(value: unknown): value is NexoraPlugin {
  return (
    typeof value === 'object' &&
    value !== null &&
    'manifest' in value &&
    isPluginManifest((value as NexoraPlugin).manifest) &&
    typeof (value as NexoraPlugin).onLoad === 'function'
  );
}

function mergeManifests(
  base: PluginManifest | undefined,
  override: PluginManifest,
): PluginManifest {
  if (!base) return override;
  return {
    ...base,
    ...override,
    dependencies: { ...base.dependencies, ...override.dependencies },
    config: { ...base.config, ...override.config },
  };
}
