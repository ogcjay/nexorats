# @nexora.ts/websocket

Live dashboard WebSocket hub for logs, status, and guild events.

```ts
import { WebSocketHub } from '@nexora.ts/websocket';

const hub = new WebSocketHub(logger);
hub.start(4001);
```

See [WebSocket](../guide/websocket.md).
