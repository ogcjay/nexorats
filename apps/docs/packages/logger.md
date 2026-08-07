# @nexorajs/logger

Structured logging with pretty / compact / json console modes, stacks, startup banner, and command traces.

```ts
import { createLiveLogger, printStartupBanner, subscribeLiveLogs } from '@nexorajs/logger';

const log = createLiveLogger({
  level: 'info',
  context: 'bot',
  console: { mode: 'pretty' },
});

subscribeLiveLogs((entry) => {
  // forward to WebSocket / Studio
});

printStartupBanner({
  name: 'Nexora',
  version: '0.1.x',
  userTag: 'MyBot#1234',
  commands: 3,
  events: 2,
  studioUrl: 'http://localhost:3002',
});
```

## Modes

- `pretty` — short timestamps, colored badges, multi-line meta, error stacks
- `compact` — denser single-line output
- `json` — machine-readable lines

Command traces: `log.command?.('ping', { user, durationMs })`.

See [Logging](../guide/logging.md).
