# Dashboard

The dashboard (`apps/dashboard`, package `@nexora.ts/dashboard`) is a **separate** Next.js App Router app. It is **not** started by `pnpm dev` on your bot or by `nexora dev`.

| | Nexora Studio | Dashboard |
| --- | --- | --- |
| Role | Local Developer Center | Public admin UI (guilds, modules, logs) |
| Typical URL | `http://localhost:3002` | `http://localhost:3000` |
| With bot start? | Yes (`createDevServer` / scaffold) | No — start separately |

Scaffolding with “Include dashboard?” only adds `dashboard` / `auth` config and related backend packages (`@nexora.ts/api`, auth, database, websocket). The Next.js UI lives in the Nexora monorepo.

Features:

- Discord login (via auth package)
- Guild selection
- Dark mode & responsive layout
- Module management, stats, logs, settings UI

It uses `@nexora.ts/ui` components (SettingsCard, StatCard, ServerSelector, GuildSidebar, pickers, tables, …).

When `dashboard.enabled` is set in config, the bot startup banner shows the configured URL with **(start separately)** — that does not mean the UI is running.

## Architecture rule

**All data flows through the internal API.** The browser never opens a database connection.

```ts
import { api } from '@/lib/api';

const settings = await api.guildSettings(guildId);
```

## Local development

From the **Nexora monorepo** root (not from a scaffolded bot folder):

```bash
pnpm --filter @nexora.ts/dashboard dev
```

Opens at `http://localhost:3000` (or `dashboard.url` / `dashboard.port` from config).
