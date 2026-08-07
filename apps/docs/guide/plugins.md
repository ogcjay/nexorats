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

## Manifest

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

## Loading

```ts
import { PluginLoader } from '@nexorajs/plugin-system';

const loader = new PluginLoader(bot, bot.logger);
await loader.loadAll({
  pluginsPath: './plugins',
  enabledPlugins: config.plugins,
});
```

## Install (CLI — planned)

```bash
nexora add tickets
nexora add moderation
```

## Community plugins

Building and publishing plugins is how the ecosystem grows. See [Plugin ecosystem](/guide/ecosystem) and [Contributing](/guide/contributing).
