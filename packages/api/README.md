# @nexorajs/api

Internal REST API used by the Nexora dashboard. Validation, auth middleware, and typed error responses.

```ts
import { createApiServer, ApiError, success } from '@nexorajs/api';

const server = createApiServer(auth, repos, logger, 4000);
await server.start();
```

Dashboard clients must call this API — never the database.

## License

MIT
