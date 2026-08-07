# @nexorajs/api

Internal REST API with validation and error handling.

```ts
import { createApiServer, ApiError } from '@nexorajs/api';

const server = createApiServer(auth, repos, logger, 4000);
await server.start();
```

See [API](../guide/api.md).
