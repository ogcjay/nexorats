# @nexora.ts/dev-server

Introspection API that powers **Nexora Studio**, plus an **embedded Studio UI** so a single `pnpm dev` is enough.

```ts
import { createDevServer } from '@nexora.ts/dev-server';

const api = createDevServer(bot, { port: 3920, studioPort: 3002 });
await api.start();
// → API  http://127.0.0.1:3920
// → UI   http://localhost:3002
```

## Ports

| Service | Default |
| --- | --- |
| Studio API | `127.0.0.1:3920` |
| Studio UI (embedded) | `localhost:3002` |

When `NEXORA_STUDIO=1` (set by `nexora dev` while starting the Vite app), the embedded UI is skipped so the CLI can own `:3002`.

Disable the UI with `{ ui: false }` if you only want the API.

## API

Exposes `/api/studio/snapshot`, commands, events, plugins, sanitized config, logs, and database status — for the **local** Developer Center only.
