# @nexorajs/plugin-system

Plugin manifests, dependency resolution, and loader lifecycle.

```ts
import { PluginLoader, plugin } from '@nexorajs/plugin-system';

const loader = new PluginLoader(bot, bot.logger);
await loader.loadAll({ pluginsPath: './plugins' });
```

See [Plugins](../guide/plugins.md).
