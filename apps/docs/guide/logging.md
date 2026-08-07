# Logging

`@nexorajs/logger` provides structured logging with:

- Timestamps and log levels
- Colored console output
- Optional file logging + rotation
- Live stream hooks for the dashboard WebSocket

```ts
import { createLogger } from '@nexorajs/logger';

const log = createLogger({ level: 'info', context: 'my-bot' });
log.info('Bot starting');
log.child('commands').debug('Registered ping');
```

Configure via `defineConfig({ logger: { … } })`.
