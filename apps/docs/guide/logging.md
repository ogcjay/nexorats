# Logging

`@nexorajs/logger` provides structured logging with:

- Console modes: **pretty** (default in development), **compact**, **json**
- Colored level badges and short timestamps (`HH:mm:ss`)
- Error stacks when you pass an `Error` or `meta.error`
- Optional file logging + rotation
- Live stream hooks for the dashboard WebSocket
- Startup banner and command traces

```ts
import { createLogger, printStartupBanner } from '@nexorajs/logger';

const log = createLogger({
  level: 'info',
  context: 'my-bot',
  console: { mode: 'pretty' },
});

log.info('Bot starting');
log.child('commands').debug('Registered ping');

log.error('Deploy failed', { error: new Error('Missing access') });

log.command?.('ping', {
  user: '@Alice',
  guild: 'My Server',
  durationMs: 42,
});
```

## Console modes

| Mode | Use when |
| --- | --- |
| `pretty` | Local development — badges, padded context, multi-line meta + stacks |
| `compact` | Shorter single-line output |
| `json` | Production / log aggregators |

Configure via `defineConfig`:

```ts
logger: {
  level: 'info',
  console: { mode: 'pretty' }, // or 'compact' | 'json'
  file: { enabled: true, path: './logs/nexora.log' },
  liveStream: true,
},
```

## Startup banner

```ts
printStartupBanner({
  name: 'Nexora',
  version: '0.1.x',
  userTag: 'MyBot#1234',
  commands: 3,
  events: 2,
  studioUrl: 'http://localhost:3002',
});
```

Typical output:

```text
┌─ Nexora  v0.1.x ─────────────────────────────────
│  ● ready   as MyBot#1234
│  3 commands · 2 events
│  Studio → http://localhost:3002
└──────────────────────────────────────────────────
```

## Command traces

Use `logger.command(…)` (or meta `type: 'command'`) so successful runs show as `CMD` lines with name, user, and duration — useful next to Studio’s live log buffer.

See [@nexorajs/logger](../packages/logger.md).
