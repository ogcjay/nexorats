# @nexora.ts/config

Type-safe configuration with `defineConfig()` and Zod validation.
`defineConfig()` validates at runtime and throws a clear error with config paths on failure.

```ts
import { defineConfig } from '@nexora.ts/config';

export default defineConfig({
  bot: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});
```

## License

MIT
