# Nexora

Main bot class — wires Discord client, command/event discovery, DI container, cache, scheduler, and logging.

**Package:** `@nexora.ts/core`

## Create & start

```ts
import config from '../nexora.config.js';
import { Nexora } from '@nexora.ts/core';
import { createDevServer } from '@nexora.ts/dev-server';

const bot = new Nexora({
  config,
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
});

const studio = createDevServer(bot, { port: 3920, studioPort: 3002 });
await studio.start();
await bot.start();

process.on('SIGINT', async () => {
  await studio.stop();
  await bot.stop();
  process.exit(0);
});
```

## Important properties

| Property | Description |
| --- | --- |
| `bot.client` | discord.js `Client` |
| `bot.logger` | Nexora `Logger` (pretty console by default) |
| `bot.container` | DI `Container` |
| `bot.commandRegistry` | Registered slash / message commands |
| `bot.eventRegistry` | Registered event handlers |
| `bot.eventBus` | Framework hooks (`COMMAND_EXECUTED`, …) |
| `bot.cache` | In-memory cache |
| `bot.scheduler` | Cron / interval / delayed jobs |
| `bot.lifecycle` | `'idle' \| 'starting' \| 'ready' \| 'stopping' \| 'stopped'` |

## Options

```ts
new Nexora({
  config,                    // from defineConfig()
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
  clientOptions: {
    // optional discord.js ClientOptions overrides
  },
  // Optional error boundary
  onError: ({ error, source, command }) => {
    console.error(`[${source}]`, command, error);
  },
  errorMessage: 'Etwas ist schiefgelaufen. Bitte später erneut versuchen.',
});
```

Or chain after construction:

```ts
bot
  .onError(async (ctx) => { /* Sentry / webhook */ })
  .setErrorMessage('Something went wrong.');
```

On ready, Nexora prints a **startup banner** (commands/events count, Studio URL when live).

## Related

- [Configuration](../guide/configuration.md)
- [SlashCommand](slash-command.md)
- [Logger](logger.md)
