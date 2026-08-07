# @nexora.ts/logger

Structured logging for the Nexora framework — pretty terminal console, file rotation, and live stream hooks for the dashboard.

```ts
import { createLiveLogger, printStartupBanner } from '@nexora.ts/logger';

const logger = createLiveLogger({
  level: 'info',
  context: 'bot',
  console: { mode: 'pretty' }, // pretty | compact | json
});

logger.info('Nexora started');
logger.command('/ping', { name: 'ping', user: 'Jay#0001', duration: '12ms' });
logger.error('Failed', new Error('boom'));

printStartupBanner({
  name: 'my-bot',
  version: '0.1.0',
  userTag: 'MyBot#1234',
  commands: 12,
  events: 4,
});
```

## Features

- Console modes: `pretty` (dev default) | `compact` | `json`
- Log levels: `debug` | `info` | `warn` | `error` + `command()` traces
- Optional file logging with size-based rotation
- Live subscribers for WebSocket / dashboard console
- `printStartupBanner()` helper for Core / apps

## License

MIT
