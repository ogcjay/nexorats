# Nexora Studio

**Nexora Studio** is the local **Developer Center** for your bot project.

It is **not** the public documentation website.

| | Public docs | Nexora Studio |
| --- | --- | --- |
| Where | [GitBook](https://cjays-organization.gitbook.io/nexora.ts/) | `localhost:3002` |
| Audience | Everyone | You, on your machine |
| Content | Framework guides | **Your** commands, plugins, logs, config |
| Start | Open the URL | `pnpm dev` (embedded UI via `@nexora.ts/dev-server`) |

## Scaffold includes Studio

Projects from `create-nexora-ts@latest` wire `@nexora.ts/dev-server` so **both** the Studio API and an embedded Studio UI start with the bot. After `cp .env.example .env` and `pnpm install`:

```bash
pnpm dev
```

Open **http://localhost:3002** — no second terminal required.

Optional: `nexora dev` starts the bot and, when `@nexora.ts/studio` is available (monorepo), the Vite UI instead of the embedded page.

## Why Studio exists

A public docs site can never know:

- how many commands **your** bot registered
- which plugins **you** installed
- whether **your** database is connected
- live logs from **this** process

Studio shows exactly that.

## Ports

| Service | URL |
| --- | --- |
| Dashboard (optional Next app) | http://localhost:3000 |
| **Nexora Studio** | http://localhost:3002 |
| Studio API | http://127.0.0.1:3920 |

> Dashboard (`:3000`) and Studio (`:3002`) are different apps. The startup banner only shows Studio when the UI is actually listening.

## Wire it in your bot

```ts
import { createDevServer } from '@nexora.ts/dev-server';

const studioApi = createDevServer(bot, { port: 3920, studioPort: 3002 });
await studioApi.start();

// after plugins load:
studioApi.setPlugins(/* … */);
```

CLI helpers:

```bash
nexora dev      # bot + Studio (Vite UI if available, else embedded)
nexora studio    # Vite Studio UI only (expects API on :3920)
```

In the monorepo:

```bash
pnpm --filter @nexora.ts/studio dev
```

## Features (v0.1)

- Bot status & uptime
- Command tree
- Registered events
- Plugin list
- Sanitized configuration (secrets redacted)
- Log buffer
- Link to public docs
- Embedded UI served by `@nexora.ts/dev-server` (no separate Vite process required)
