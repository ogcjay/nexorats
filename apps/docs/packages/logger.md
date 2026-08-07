# @nexorajs/logger

Structured logging: levels, colors, file rotation, live stream subscribers.

```ts
import { createLiveLogger, subscribeLiveLogs } from '@nexorajs/logger';

const log = createLiveLogger({ level: 'info', context: 'bot' });
subscribeLiveLogs((entry) => {
  // forward to WebSocket
});
```

See [Logging](/guide/logging).
