# Configuration

All bot configuration goes through type-safe `defineConfig()`.

```ts
import { defineConfig } from '@nexorajs/config';

export default defineConfig({
  bot: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    guildIds: process.env.DISCORD_GUILD_ID
      ? [process.env.DISCORD_GUILD_ID]
      : undefined,
  },
  database: {
    provider: 'postgresql', // or 'sqlite'
    url: process.env.DATABASE_URL!,
  },
  dashboard: {
    enabled: true,
    port: 3000,
    secret: process.env.DASHBOARD_SECRET,
  },
  auth: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    redirectUri: process.env.OAUTH_REDIRECT_URI!,
  },
  logger: {
    level: 'info',
    console: { mode: 'pretty' }, // 'pretty' | 'compact' | 'json'
    file: { enabled: true, path: './logs/nexora.log' },
    liveStream: true,
  },
  plugins: {
    tickets: { enabled: true },
  },
});
```

## Environment overrides

Importing `@nexorajs/config` loads `.env` via `loadEnv()`. Scaffold scripts also pass `--env-file=.env`.

`@nexorajs/config` can merge common `NEXORA_*` env vars (token, database URL, log level, dashboard secret). Prefer keeping secrets in `.env`, never in git.

## Validation

Use `validateConfig()` for runtime Zod checks when loading untrusted config sources.
