# Dashboard

The dashboard (`apps/dashboard`) is a Next.js App Router app with:

- Discord login (via auth package)
- Guild selection
- Dark mode & responsive layout
- Module management, stats, logs, settings UI

It uses `@nexorajs/ui` components (SettingsCard, StatCard, ServerSelector, GuildSidebar, pickers, tables, …).

## Architecture rule

**All data flows through the internal API.** The browser never opens a database connection.

```ts
import { api } from '@/lib/api';

const settings = await api.guildSettings(guildId);
```

## Local development

From the monorepo root:

```bash
pnpm --filter @nexorajs/dashboard dev
```

Opens at `http://localhost:3000`.
