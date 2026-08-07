# @nexorajs/database

Drizzle ORM + repository factory for PostgreSQL (SQLite optional).

```ts
import { createDatabase, RepositoryFactory } from '@nexorajs/database';

const db = await createDatabase(config.database);
const repos = new RepositoryFactory(db);
```

See [Database](/guide/database).
