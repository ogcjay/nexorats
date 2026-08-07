# @nexorajs/core

Discord client, commands, events, DI container, event bus, cache, and scheduler.

```ts
import { Nexora, command, event } from '@nexorajs/core';

const bot = new Nexora({ config, commandsPath: './commands/**/*.ts' });
await bot.start();
```

## Main exports

| Export | Purpose |
| --- | --- |
| `Nexora` | Bot lifecycle |
| `command` / `event` | Typed builders |
| `Container` / `TOKENS` | Dependency injection |
| `EventBus` / `FrameworkEvents` | Internal events |
| `Cache` / `MemoryCacheAdapter` | Caching |
| `Scheduler` | Cron / interval / delayed jobs |

See also: [Commands](/guide/commands), [Events](/guide/events), [DI](/guide/dependency-injection).
