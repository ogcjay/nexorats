# WebSocket

`@nexora.ts/websocket` streams live events to the dashboard:

- Log lines
- Bot status
- Guild events
- Stats updates

```ts
import { WebSocketHub } from '@nexora.ts/websocket';

const hub = new WebSocketHub(logger);
hub.start(4001);
hub.sendBotStatus({ online: true, guilds: 12 });
```

Clients can `subscribe` / `unsubscribe` to channels and authenticate with a session token.
