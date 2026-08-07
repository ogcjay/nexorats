# @nexora.ts/database

Drizzle ORM layer with a **repository pattern**. All database access goes through repositories — never from the dashboard directly.

```ts
import { createDatabase, RepositoryFactory } from '@nexora.ts/database';

const db = await createDatabase({
  provider: 'postgresql',
  url: process.env.DATABASE_URL!,
});

const repos = new RepositoryFactory(db);
const user = await repos.users.findByDiscordId('123');
```

## Providers

- **PostgreSQL** (recommended for production)
- **SQLite** (optional; requires `better-sqlite3`)

## Schema highlights

Users, sessions, guild settings, guild members, plugin states, audit logs, statistics.

## License

MIT
