# @nexorajs/logger

Structured logging for the Nexora framework — colored console output, file rotation, and live stream hooks for the dashboard.

```ts
import { createLogger, createLiveLogger } from '@nexorajs/logger';

const logger = createLiveLogger({ level: 'info', context: 'bot' });
logger.info('Nexora started');
```

## Features

- Log levels: `debug` | `info` | `warn` | `error`
- Optional file logging with size-based rotation
- Live subscribers for WebSocket / dashboard console

## License

MIT
