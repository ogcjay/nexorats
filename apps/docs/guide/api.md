# API

The dashboard talks **only** to the internal REST API — never directly to the database.

`@nexorajs/api` provides:

- Router with path params
- Auth + permission middleware
- Zod validation helpers
- Structured `ApiError` responses

```ts
import { createApiServer } from '@nexorajs/api';

const api = createApiServer(auth, repos, logger, 4000);
await api.start();
```

## Example routes

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/health` | no |
| `GET` | `/api/me` | yes |
| `GET` | `/api/guilds/:guildId/settings` | yes + permission |
| `GET` | `/api/guilds/:guildId/logs` | yes + permission |

Plugins can register additional API routes via their manifest.
