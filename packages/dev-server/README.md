# @nexora.ts/dev-server

Introspection API that powers **Nexora Studio**.

```ts
import { createDevServer } from '@nexora.ts/dev-server';

const api = createDevServer(bot, { port: 3920 });
await api.start();
```

Exposes `/api/studio/snapshot`, commands, events, plugins, sanitized config, logs, and database status — for the **local** Developer Center only.
