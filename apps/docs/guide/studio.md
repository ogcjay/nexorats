# Nexora Studio

**Nexora Studio** is the local **Developer Center** for your bot project.

It is **not** the public documentation website.

| | Public docs | Nexora Studio |
| --- | --- | --- |
| Where | [GitBook](https://cjays-organization.gitbook.io/nexora.ts/) | `localhost:3002` |
| Audience | Everyone | You, on your machine |
| Content | Framework guides | **Your** commands, plugins, logs, config |
| Start | Open the URL | Scaffold + `nexora dev` / `pnpm studio:dev` |

## Scaffold includes Studio

Projects from `create-nexora-ts@latest` wire `@nexora.ts/dev-server` so Studio’s API starts with the bot. After `cp .env.example .env` and `pnpm install`:

```bash
pnpm dev
# or:
nexora dev
```

That starts the bot process and the Studio UI. Open **http://localhost:3002**.

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
| Dashboard | http://localhost:3000 |
| **Nexora Studio** | http://localhost:3002 |
| Studio API | http://127.0.0.1:3920 |

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
nexora dev      # bot + Studio UI
nexora studio    # Studio UI only (expects API on :3920)
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
