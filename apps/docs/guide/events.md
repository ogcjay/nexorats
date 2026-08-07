# Events

Register Discord.js client events with `event()`.

```ts
import { event } from '@nexorajs/core';

export default event('ready', (client) => {
  console.log(`Ready as ${client.user.tag}`);
  client.user.setActivity('Nexora', { type: 3 });
});
```

## Once vs on

```ts
export default event('ready', (client) => {
  /* runs once */
}, true);
```

## Class style

For larger handlers you can export a class instead of `event()`:

```ts
import { EventHandler } from '@nexorajs/core';

export default class ReadyHandler extends EventHandler {
  name = 'ready' as const;
  once = true;

  execute(client: import('discord.js').Client) {
    client.user?.setActivity('Nexora', { type: 3 });
  }
}
```

Discovery accepts both `event()` definitions and class exports. See [Classes](../classes/index.md).

## Framework event bus

Besides Discord events, Nexora has an internal `EventBus` with hooks, middleware, and priorities — used by plugins and platform features (for example `COMMAND_EXECUTED` after a slash command runs). See [@nexorajs/core](../packages/core.md).
