# @nexorajs/config

Type-safe configuration with `defineConfig()` and Zod validation.

```ts
import { defineConfig } from '@nexorajs/config';

export default defineConfig({
  bot: { token: process.env.DISCORD_TOKEN!, clientId: process.env.DISCORD_CLIENT_ID! },
  database: { provider: 'postgresql', url: process.env.DATABASE_URL! },
});
```

See [Configuration](/guide/configuration).
