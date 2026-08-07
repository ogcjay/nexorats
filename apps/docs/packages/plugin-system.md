# @nexora.ts/plugin-system

Plugin manifests, class-based plugins, dependency resolution, and loader lifecycle.

```ts
import { PluginLoader, plugin, NexoraPlugin } from '@nexora.ts/plugin-system';

const loader = new PluginLoader(bot, bot.logger);
await loader.loadAll({ pluginsPath: './plugins' });
```

## Styles

**Manifest helper** (unchanged):

```ts
export default plugin({
  name: 'tickets',
  version: '1.0.0',
});
```

**Class** with lifecycle:

```ts
export default class TicketsPlugin extends NexoraPlugin {
  manifest = { name: 'tickets', version: '1.0.0' };

  async onLoad(ctx) {
    ctx.logger.info('loaded');
  }
}
```

The loader accepts either default export. `onLoad` / `onUnload` run around enable/disable.

See [Plugins](../guide/plugins.md) and [NexoraPlugin](../classes/nexora-plugin.md).
