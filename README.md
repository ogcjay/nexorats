# Nexora

**Modern open-source TypeScript framework for Discord bots.**

Nexora is a complete foundation — CLI, command system, plugin system, dashboard, authentication, and more — so you can focus on your bot’s features instead of wiring libraries together.

[![CI](https://github.com/ogcjay/nexorajs/actions/workflows/ci.yml/badge.svg)](https://github.com/ogcjay/nexorajs/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-GitBook-blue)](https://cjays-organization.gitbook.io/nexorajs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io)

> **Status:** early preview (`0.1.1`). APIs may change before `1.0.0`.
>
> **Documentation:** [https://cjays-organization.gitbook.io/nexorajs/](https://cjays-organization.gitbook.io/nexorajs/)  
> **Nexora Studio (local):** `http://localhost:3002` — Developer Center for *your* running project (commands, plugins, logs, status)

---

## Vision

Nexora is not “another Discord.js wrapper”. It is an **open-source developer ecosystem** for Discord applications:

- **Free to use** under MIT
- **Free to extend** — build plugins, dashboards pages, API routes
- **Free to improve** — PRs and issues welcome
- **Community-driven** — a growing plugin ecosystem around one shared foundation

You get a production-ready bot stack in minutes. The community grows it into a platform.

## Why Nexora?

| Building block        | What you get                                     |
| --------------------- | ------------------------------------------------ |
| **CLI**               | `create-nexorajs` scaffolds a full project         |
| **Commands & events** | `command()` / `event()` with auto-discovery      |
| **Plugin system**     | Commands, events, dashboard, API, migrations     |
| **Dashboard**         | Next.js UI for guild settings, modules, logs     |
| **Auth**              | Discord OAuth, sessions, permissions             |
| **Database**          | Drizzle + repository layer (PostgreSQL / SQLite) |
| **API + WebSocket**   | Internal REST API and live dashboard events      |
| **Config & logging**  | Type-safe `defineConfig()`, structured logs      |

## Quick Start

```bash
npx create-nexorajs my-bot
cd my-bot
pnpm install
cp .env.example .env   # add your Discord token
pnpm dev
```

### Minimal bot

```ts
import { command, event } from '@nexorajs/core';
import { defineConfig } from '@nexorajs/config';

export default defineConfig({
  bot: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});

// commands/ping.ts
export default command({
  name: 'ping',
  description: 'Ping command',
  execute(ctx) {
    return ctx.interaction.reply('Pong!');
  },
});

// events/ready.ts
export default event('ready', (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});
```

Commands and events are **auto-discovered** — no manual registration.

## Nexora Studio (local Developer Center)

When you develop a bot, start **Nexora Studio** alongside it. It is a local control panel — not the public docs site.

```text
Dashboard         http://localhost:3000
Nexora Studio     http://localhost:3002
Studio API        http://127.0.0.1:3920
```

Studio shows **project-specific** data: registered commands, events, plugins, sanitized config, database status, and live logs.

```bash
# monorepo
pnpm --filter @nexorajs/playground dev   # bot + Studio API
pnpm studio:dev                        # Studio UI
```

See the docs guide: [Nexora Studio](https://cjays-organization.gitbook.io/nexorajs/platform/nexora-studio).

## Build plugins, grow the ecosystem

Plugins are first-class. A plugin can register commands, events, dashboard pages, API endpoints, migrations, and services — without changing core.

```bash
nexora add tickets      # planned
nexora add moderation   # planned
```

Want to contribute a plugin or improve the framework? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Monorepo Structure

```
apps/
  dashboard/      Next.js dashboard
  docs/           Public VitePress docs → GitHub Pages
  studio/         Nexora Studio (local Developer Center)
  playground/     Demo bot + Studio API
packages/
  core/           Client, commands, events, DI, cache, scheduler
  config/         defineConfig() + validation
  logger/         Console, file rotation, live stream
  database/       Drizzle + repositories
  auth/           Discord OAuth & permissions
  api/            Internal REST API
  plugin-system/  Plugin API & lifecycle
  websocket/      Live dashboard events
  ui/             Shared dashboard components
  dev-server/     Introspection API for Studio
  cli/            create-nexorajs + nexora
examples/
templates/
```

## Development (this repository)

**Requirements:** Node.js ≥ 20, pnpm 9.15+

```bash
git clone https://github.com/ogcjay/nexorajs.git
cd nexora
pnpm install
pnpm build
pnpm dev
```

| Command                             | Description                                      |
| ----------------------------------- | ------------------------------------------------ |
| `pnpm build`                        | Build all packages and apps                      |
| `pnpm dev`                          | Start apps (dashboard / docs / playground)       |
| `pnpm studio:dev`                   | Nexora Studio UI (`localhost:3002`)              |
| `pnpm docs:dev`                     | Preview public docs locally (optional)           |
| `pnpm docs:build`                   | Static docs build (same as CI → GitHub Pages)    |
| `pnpm typecheck`                    | TypeScript checks                                |
| `pnpm format` / `pnpm format:check` | Prettier                                         |

> Use **`pnpm`**, not `npm` / `npx pnpm` in this repo.

Publishing checklist: [PUBLISHING.md](./PUBLISHING.md) (GitHub) · [NPM_PUBLISH.md](./NPM_PUBLISH.md) (npm)

## Architecture Principles

- SOLID + Clean Architecture
- Dependency Injection via per-instance `Container` (no global singletons)
- Repository pattern for all DB access
- Dashboard talks **only** through the internal API
- Plugins extend the platform without modifying core

## Community & Contributing

Nexora thrives when developers:

1. **Use** it for real bots
2. **Extend** it with plugins
3. **Improve** core, docs, and DX
4. **Share** patterns with the community

- Contribute: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Community: [COMMUNITY.md](./COMMUNITY.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security: [SECURITY.md](./SECURITY.md)

## Roadmap (high level)

- [ ] Discord OAuth login in dashboard
- [ ] Plugin install CLI (`nexora add <plugin>`)
- [ ] Redis cache adapter
- [ ] Official example plugins (tickets, moderation)
- [ ] Community plugin guidelines + showcase
- [ ] Stable `1.0.0` API

## License

[MIT](./LICENSE) © Nexora Contributors — free to use, modify, and distribute.
