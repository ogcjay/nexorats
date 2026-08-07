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

## Framework event bus

Besides Discord events, Nexora has an internal `EventBus` with hooks, middleware, and priorities — used by plugins and platform features. See [@nexorajs/core](../packages/core.md).
