# @nexorajs/core

Discord client, commands, events, DI container, event bus, cache, and scheduler.

```ts
import { Nexora, command, event, SlashCommand } from '@nexorajs/core';

const bot = new Nexora({ config, commandsPath: './commands/**/*.ts' });
await bot.start();
```

## Main exports

| Export | Purpose |
| --- | --- |
| `Nexora` | Bot lifecycle |
| `command` / `event` | Typed builders |
| `SlashCommand` / `BaseCommand` | Class-based slash commands |
| `EventHandler` | Class-based Discord events |
| `Service` | Injectable service base (child logger) |
| `Container` / `TOKENS` | Dependency injection |
| `EventBus` / `FrameworkEvents` | Internal events (`COMMAND_EXECUTED`, …) |
| `Cache` / `MemoryCacheAdapter` | Caching |
| `Scheduler` | Cron / interval / delayed jobs |

## Command context & guards

`CommandContext` includes `reply`, `defer`, `editReply`, `followUp`, plus `user`, `guild`, `member`, `channel`, and `interaction`.

Definition options: `guildOnly`, `adminOnly`, `permissions`, `cooldown` (ms).

See: [Commands](../guide/commands.md), [Classes](../guide/classes.md), [Events](../guide/events.md), [DI](../guide/dependency-injection.md).
