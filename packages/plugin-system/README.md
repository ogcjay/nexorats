# @nexora.ts/plugin-system

First-class plugin API for the Nexora ecosystem. Plugins extend the framework without modifying core.

```ts
import { PluginLoader, plugin } from '@nexora.ts/plugin-system';

export default plugin({
  name: 'tickets',
  version: '1.0.0',
  description: 'Ticket system plugin',
});

const loader = new PluginLoader(bot, bot.logger);
await loader.loadAll({ pluginsPath: './plugins' });
```

## A plugin can

- Add commands and events
- Register dashboard pages
- Expose API routes
- Ship migrations and config
- Register DI services

Community plugins are encouraged — see the root [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

MIT
