# @nexora.ts/core

Heart of the Nexora framework: Discord client, slash commands, events, DI container, cache, and scheduler.

Not a thin Discord.js wrapper — the foundation bots and plugins build on.

## Usage

```ts
import { Nexora, command, event } from '@nexora.ts/core';
import config from './nexora.config.js';

const bot = new Nexora({
  config,
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
});

await bot.start();
```

## Commands & events

```ts
export default command({
  name: 'ping',
  description: 'Ping',
  execute(ctx) {
    return ctx.interaction.reply('Pong!');
  },
});

export default event('ready', (client) => {
  console.log(client.user.tag);
});
```

Auto-discovered — no manual registration.

## Exports

- `Nexora` — lifecycle
- `command` / `event`
- `Container` / `TOKENS`
- `EventBus` / `FrameworkEvents`
- `Cache` / `MemoryCacheAdapter`
- `Scheduler`

## License

MIT
