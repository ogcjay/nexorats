# @nexorajs/dev-server

Introspection API that powers **Nexora Studio**.

```ts
import { createDevServer } from '@nexorajs/dev-server';

const api = createDevServer(bot, { port: 3920 });
await api.start();
```

Exposes `/api/studio/snapshot`, commands, events, plugins, sanitized config, logs, and database status — for the **local** Developer Center only.
