# Logger

Structured logging with pretty / compact / json console modes, command traces, file rotation, and live Studio stream.

**Package:** `@nexorajs/logger`  
Created automatically by `Nexora` via `createLiveLogger()`.

## Modes

```ts
// nexora.config.ts
export default defineConfig({
  // …
  logger: {
    level: 'info',
    console: { mode: 'pretty' }, // 'pretty' | 'compact' | 'json'
    file: { enabled: true, path: './logs/nexora.log' },
    liveStream: true,
  },
});
```

| Mode | Use |
| --- | --- |
| `pretty` | Default in development — badges, short time, stacks |
| `compact` | Single-line, less noise |
| `json` | Production / log aggregators |

## Usage

```ts
bot.logger.info('Server synced', { guilds: 12 });
bot.logger.warn('Rate limit approaching');
bot.logger.error('Deploy failed', err); // Error → stack in pretty mode
bot.logger.command('/ban', { name: 'ban', user: 'Jay#0001', duration: 42 });

const tickets = bot.logger.child('tickets');
tickets.info('Queue worker started');
```

## Startup banner

Printed by Core on ready:

```ts
import { printStartupBanner } from '@nexorajs/logger';

printStartupBanner({
  name: 'Nexora',
  version: '0.1.3',
  userTag: client.user.tag,
  commands: 12,
  events: 4,
  studioUrl: 'http://localhost:3002',
});
```

## Related

- [Logging guide](../guide/logging.md)
- [Nexora](nexora.md)
- [Nexora Studio](../guide/studio.md)
