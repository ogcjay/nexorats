# Classes

Reference for Nexora’s most important classes — each page has a short description and copy-paste examples.

Functional helpers (`command()`, `event()`, `plugin()`) stay fully supported. Classes are the preferred style for larger bots and clearer IDE navigation.

## Framework

| Class | Package | Role |
| --- | --- | --- |
| [Nexora](nexora.md) | `@nexorajs/core` | Bot lifecycle, Discord client, discovery |
| [SlashCommand](slash-command.md) | `@nexorajs/core` | Class-based slash commands |
| [Service](service.md) | `@nexorajs/core` | Injectable services with logger |
| [NexoraPlugin](nexora-plugin.md) | `@nexorajs/plugin-system` | Plugin lifecycle (`onLoad` / `onUnload`) |
| [Logger](logger.md) | `@nexorajs/logger` | Pretty console, command traces, files |

## Message UI

| Class | Package | Role |
| --- | --- | --- |
| [EmbedBuilder](embed-builder.md) | `@nexorajs/core` | Embeds + success/error/warn/info presets |
| [ButtonBuilder](button-builder.md) | `@nexorajs/core` | Buttons + `ActionRowBuilder` |
| [ModalBuilder](modal-builder.md) | `@nexorajs/core` | Modals + text inputs |
| [LayoutContainerBuilder](layout-container.md) | `@nexorajs/core` | Components V2 layouts (`container()`) |

## Quick pick

```ts
import {
  Nexora,
  SlashCommand,
  EmbedBuilder,
  container,
  text,
} from '@nexorajs/core';
import type { CommandContext } from '@nexorajs/core';

export default class PingCommand extends SlashCommand {
  name = 'ping';
  description = 'Latency check';

  async execute(ctx: CommandContext) {
    await ctx.reply(EmbedBuilder.success('Pong', 'Bot is online.'));
    // or Components V2:
    // await ctx.componentsV2(container().add(text('# Pong')));
  }
}
```

See also: [Commands](../guide/commands.md) · [Builders](../guide/builders.md) · [Components V2](../guide/components-v2.md)
