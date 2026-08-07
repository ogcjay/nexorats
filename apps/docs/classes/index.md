# Classes

Reference for Nexora’s most important classes — each page has a short description and copy-paste examples.

Functional helpers (`command()`, `event()`, `plugin()`) stay fully supported. Classes are the preferred style for larger bots and clearer IDE navigation.

## Framework

| Class | Package | Role |
| --- | --- | --- |
| [Nexora](nexora.md) | `@nexora.ts/core` | Bot lifecycle, Discord client, discovery |
| [SlashCommand](slash-command.md) | `@nexora.ts/core` | Class-based slash commands |
| [SlashCommandGroup](slash-command-group.md) | `@nexora.ts/core` | Subcommand groups + context menus |
| [EventHandler](event-handler.md) | `@nexora.ts/core` | Class-based Discord events |
| [ButtonHandler](button-handler.md) | `@nexora.ts/core` | Button / select / modal handlers |
| [Service](service.md) | `@nexora.ts/core` | Injectable services with logger |
| [NexoraPlugin](nexora-plugin.md) | `@nexora.ts/plugin-system` | Plugin lifecycle (`onLoad` / `onUnload`) |
| [Logger](logger.md) | `@nexora.ts/logger` | Pretty console, command traces, files |

## Message UI

| Class | Package | Role |
| --- | --- | --- |
| [EmbedBuilder](embed-builder.md) | `@nexora.ts/core` | Embeds + success/error/warn/info presets |
| [ButtonBuilder](button-builder.md) | `@nexora.ts/core` | Buttons + `ActionRowBuilder` |
| [ModalBuilder](modal-builder.md) | `@nexora.ts/core` | Modals + text inputs |
| [LayoutContainerBuilder](layout-container.md) | `@nexora.ts/core` | Components V2 layouts (`container()`) |
| [Paginator](paginator.md) | `@nexora.ts/core` | Pages, ConfirmDialog, ChoicePrompt |

## Quick pick

```ts
import {
  Nexora,
  SlashCommand,
  EmbedBuilder,
  container,
  text,
} from '@nexora.ts/core';
import type { CommandContext } from '@nexora.ts/core';

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

See also: [Commands](../guide/commands.md) · [Events](../guide/events.md) · [Builders](../guide/builders.md) · [Components V2](../guide/components-v2.md)
