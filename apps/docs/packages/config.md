# @nexorajs/config

Type-safe configuration with `defineConfig()` and Zod validation. Loads `.env` via `loadEnv()` on import so secrets are available before you read `process.env`.

```ts
import { defineConfig } from '@nexorajs/config';

export default defineConfig({
  bot: { token: process.env.DISCORD_TOKEN!, clientId: process.env.DISCORD_CLIENT_ID! },
  database: { provider: 'postgresql', url: process.env.DATABASE_URL! },
  logger: {
    level: 'info',
    console: { mode: 'pretty' }, // 'pretty' | 'compact' | 'json'
  },
});
```

## Notable options

| Area | Notes |
| --- | --- |
| `logger.console.mode` | Console formatting for `@nexorajs/logger` |
| `loadEnv()` | Also exported for explicit calls |
| `NEXORA_*` env | Common overrides (token, DB URL, log level, …) |

See [Configuration](../guide/configuration.md) and [Logging](../guide/logging.md).
