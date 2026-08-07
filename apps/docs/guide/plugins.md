# Plugins

Plugins are the heart of the Nexora ecosystem. A plugin can add:

- Commands & events
- Dashboard pages
- API routes
- Migrations
- Config extensions
- Custom services

…without modifying `@nexorajs/core`.

## Plugin layout

```
my-plugin/
├── plugin.json
├── commands/
├── events/
├── dashboard/
├── api/
├── migrations/
└── config/
```

## Manifest helper

```json
{
  "name": "tickets",
  "version": "1.0.0",
  "description": "Support ticket system",
  "dependencies": {}
}
```

Or via the typed helper:

```ts
import { plugin } from '@nexorajs/plugin-system';

export default plugin({
  name: 'tickets',
  version: '1.0.0',
  description: 'Support ticket system',
});
```

## Plugin class (`NexoraPlugin`)

For lifecycle hooks and DI, export a class. The loader supports **both** `plugin({})` manifests and class defaults.

```ts
import { NexoraPlugin, type PluginContext } from '@nexorajs/plugin-system';

export default class TicketsPlugin extends NexoraPlugin {
  manifest = {
    name: 'tickets',
    version: '1.0.0',
    description: 'Support ticket system',
  };

  async onLoad(ctx: PluginContext) {
    ctx.logger.info('Tickets plugin loaded');
    // register services, commands, etc.
  }

  async onUnload(ctx: PluginContext) {
    ctx.logger.info('Tickets plugin unloaded');
  }
}
```

`PluginContext` exposes logger, container, config, and bot-related refs so plugins can register commands/services without touching core.

## Loading

```ts
import { PluginLoader } from '@nexorajs/plugin-system';

const loader = new PluginLoader(bot, bot.logger);
await loader.loadAll({
  pluginsPath: './plugins',
  enabledPlugins: config.plugins,
});
```

`onLoad` runs after the plugin is loaded; `onUnload` runs when the plugin is unloaded (if implemented).

## Install (CLI — planned)

```bash
nexora add tickets
nexora add moderation
```

## Community plugins

Building and publishing plugins is how the ecosystem grows. See [Plugin ecosystem](ecosystem.md) and [Contributing](contributing.md). More on classes: [Classes](../classes/index.md).
