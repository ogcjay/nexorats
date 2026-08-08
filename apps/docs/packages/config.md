# @nexora.ts/config

Type-safe configuration with `defineConfig()` and Zod validation. Loads `.env` via `loadEnv()` on import so secrets are available before you read `process.env`.

`defineConfig()` validates at runtime and throws `ConfigValidationError` with path-prefixed messages (e.g. `bot.token: …`). `Nexora` also re-validates on construct if you pass a raw config object.

```ts
import { defineConfig } from '@nexora.ts/config';

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
| `logger.console.mode` | Console formatting for `@nexora.ts/logger` |
| `loadEnv()` | Also exported for explicit calls |
| `validateConfig()` | Same Zod check as `defineConfig` (used by Core) |
| `NEXORA_*` env | Common overrides (token, DB URL, log level, …) |

See [Configuration](../guide/configuration.md) and [Logging](../guide/logging.md).
