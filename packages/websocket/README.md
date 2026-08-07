# @nexora.ts/websocket

WebSocket hub for live dashboard updates: logs, bot status, guild events, and stats.

```ts
import { WebSocketHub, WsEvents } from '@nexora.ts/websocket';

const hub = new WebSocketHub(logger);
hub.start(4001);
hub.sendBotStatus({ online: true, guilds: 12 });
```

Pairs with `@nexora.ts/logger` live stream for console streaming.

## License

MIT
