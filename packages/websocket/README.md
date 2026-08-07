# @nexorajs/websocket

WebSocket hub for live dashboard updates: logs, bot status, guild events, and stats.

```ts
import { WebSocketHub, WsEvents } from '@nexorajs/websocket';

const hub = new WebSocketHub(logger);
hub.start(4001);
hub.sendBotStatus({ online: true, guilds: 12 });
```

Pairs with `@nexorajs/logger` live stream for console streaming.

## License

MIT
