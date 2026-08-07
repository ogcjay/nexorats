# @nexora.ts/core

Discord client, commands, events, message builders, DI container, event bus, cache, and scheduler.

```ts
import { Nexora, command, event, SlashCommand, EmbedBuilder } from '@nexora.ts/core';

const bot = new Nexora({ config, commandsPath: './commands/**/*.ts' });
await bot.start();
```

## Main exports

| Export | Purpose |
| --- | --- |
| `Nexora` | Bot lifecycle |
| `command` / `event` | Typed command / event helpers |
| `SlashCommand` / `BaseCommand` | Class-based slash commands |
| `SlashCommandGroup` / `ContextMenuCommand` | Subcommands + context menus |
| `EventHandler` | Class-based Discord events |
| `ButtonHandler` / `StringSelectHandler` / `ModalHandler` | Interaction handlers (`interactions/`) |
| `Paginator` / `ConfirmDialog` / `ChoicePrompt` | Prompt / UI helpers |
| `Service` | Injectable service base (child logger) |
| `Container` / `TOKENS` | Dependency injection |
| `EventBus` / `FrameworkEvents` | Internal events (`COMMAND_EXECUTED`, …) |
| `Cache` / `MemoryCacheAdapter` | Caching |
| `Scheduler` | Cron / interval / delayed jobs |
| Message builders | Embeds, buttons, modals, Components V2 (below) |

## Builders

Fluent Discord payload builders with presets and short chains — shorter than raw discord.js, still `toJSON()`-compatible.

| Export | Purpose |
| --- | --- |
| `EmbedBuilder` / `EmbedColor` | Embeds + `success` / `error` / `warn` / `info` presets |
| `ButtonBuilder` / `ActionRowBuilder` | Buttons and rows |
| `ModalBuilder` / `TextInputBuilder` | Modals (auto action-row wrap) |
| Select builders | `StringSelectBuilder`, `UserSelectBuilder`, … |
| `customId` | Optional `nexora:` / custom namespaces |
| Components V2 | `text`, `container` / `MessageContainerBuilder`, `section`, `gallery`, `separator`, `ComponentsV2`, … |

`CommandContext.reply` resolves builders and can set `IS_COMPONENTS_V2` via `v2` or `ctx.componentsV2(…)`.

```ts
await ctx.embed(EmbedBuilder.info('Hello', 'From Nexora'));
await ctx.componentsV2(text('# Hi'));
```

Guides: [Builders](../guide/builders.md), [Components V2](../guide/components-v2.md).

## Command context & guards

`CommandContext` includes `reply`, `embed`, `componentsV2`, `defer`, `editReply`, `followUp`, plus `user`, `guild`, `member`, `channel`, and `interaction`.

Definition options: `guildOnly`, `adminOnly`, `permissions`, `cooldown` (ms).

See: [Commands](../guide/commands.md), [Classes](../classes/index.md), [Events](../guide/events.md), [DI](../guide/dependency-injection.md).
