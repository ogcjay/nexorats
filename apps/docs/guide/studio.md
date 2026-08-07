# Nexora Studio

**Nexora Studio** is the local **Developer Center** for your bot project.

It is **not** the public documentation website.

| | Public docs | Nexora Studio |
| --- | --- | --- |
| Where | GitHub Pages | `localhost:3002` |
| Audience | Everyone | You, on your machine |
| Content | Framework guides | **Your** commands, plugins, logs, config |
| Start | Open the URL | Runs with `nexora dev` / monorepo `pnpm studio:dev` |

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
import { createDevServer } from '@nexorajs/dev-server';

const studioApi = createDevServer(bot, { port: 3920, studioPort: 3002 });
await studioApi.start();

// after plugins load:
studioApi.setPlugins(/* … */);
```

Then start the UI:

```bash
pnpm --filter @nexorajs/studio dev
# or: nexora studio
```

## Features (v0.1)

- Bot status & uptime
- Command tree
- Registered events
- Plugin list
- Sanitized configuration (secrets redacted)
- Log buffer
- Link to public GitHub Pages docs
