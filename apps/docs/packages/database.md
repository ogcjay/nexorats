# @nexora.ts/database

Drizzle ORM + repository factory for PostgreSQL (SQLite optional).

```ts
import { createDatabase, RepositoryFactory } from '@nexora.ts/database';

const db = await createDatabase(config.database);
const repos = new RepositoryFactory(db);
```

See [Database](../guide/database.md).
