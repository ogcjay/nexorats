# NexoraPlugin

Abstract plugin class with lifecycle hooks. Additive to `plugin({…})` manifests.

**Package:** `@nexora.ts/plugin-system`  
**Alias:** `Plugin`

## Example

```ts
import { NexoraPlugin, type PluginContext } from '@nexora.ts/plugin-system';
import { command } from '@nexora.ts/core';

export default class TicketsPlugin extends NexoraPlugin {
  readonly manifest = {
    name: 'tickets',
    version: '1.0.0',
    description: 'Support tickets',
  };

  async onLoad(ctx: PluginContext) {
    ctx.logger.info('Tickets plugin loaded');

    ctx.registerCommand(
      command({
        name: 'ticket',
        description: 'Open a support ticket',
        async execute({ interaction }) {
          await interaction.reply('Ticket created!');
        },
      }),
    );
  }

  async onUnload(ctx: PluginContext) {
    ctx.logger.info('Tickets plugin unloaded');
  }
}
```

## PluginContext

| Field | Description |
| --- | --- |
| `bot` / `nexora` | Running Nexora instance |
| `logger` | Scoped logger |
| `container` | DI container |
| `config` | App config |
| `options` | Plugin-specific options from config |
| `registerCommand` | Register a command at runtime |
| `registerEvent` | Register an event at runtime |

## Declarative alternative

```ts
import { plugin } from '@nexora.ts/plugin-system';

export default plugin({
  name: 'tickets',
  version: '1.0.0',
  description: 'Support tickets',
});
```

## Related

- [Plugins guide](../guide/plugins.md)
- [SlashCommand](slash-command.md)
