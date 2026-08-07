# Database

`@nexora.ts/database` uses **Drizzle ORM** with a **repository layer**.

Supported providers:

- PostgreSQL (recommended for production)
- SQLite (optional peer; useful for local/dev)

```ts
import { createDatabase, RepositoryFactory } from '@nexora.ts/database';

const db = await createDatabase(config.database);
const repos = new RepositoryFactory(db);

const user = await repos.users.findByDiscordId('123');
await repos.guildSettings.set(guildId, 'prefix', '!');
```

## Schema highlights

- Users & sessions (OAuth)
- Guild settings
- Guild members / roles for dashboard access
- Plugin state per guild
- Audit logs & statistics

All dashboard and API data access should go through repositories — never query from the UI layer.
