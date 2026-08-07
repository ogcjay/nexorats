# Quick start

Create a production-ready Nexora bot in minutes.

## Requirements

- Node.js **≥ 20**
- pnpm **9.x** (recommended)

```bash
npm install -g pnpm@9.15.0
```

## Scaffold a project

```bash
npx create-nexorajs@latest my-bot
cd my-bot
pnpm install
cp .env.example .env
```

Edit `.env` and set at least:

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

Scripts use Node’s `--env-file=.env`, and `@nexorajs/config` also loads `.env` via `loadEnv()` so `process.env` is ready when `defineConfig` runs.

## Run

```bash
pnpm dev
# or from the project root:
nexora dev
```

`nexora dev` starts your bot **and** [Nexora Studio](studio.md) (Developer Center).

| Service | URL |
| --- | --- |
| Dashboard (if enabled) | http://localhost:3000 |
| **Nexora Studio** | http://localhost:3002 |
| Studio API | http://127.0.0.1:3920 |

Public docs (this site): [https://cjays-organization.gitbook.io/nexorajs/](https://cjays-organization.gitbook.io/nexorajs/)

## Your first command

```ts
// commands/ping.ts
import { command } from '@nexorajs/core';

export default command({
  name: 'ping',
  description: 'Check bot latency',
  async execute(ctx) {
    await ctx.reply('Pong!');
  },
});
```

## Your first event

```ts
// events/ready.ts
import { event } from '@nexorajs/core';

export default event('ready', (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});
```

Commands and events are **auto-discovered** — no manual registration. Prefer classes? See [Classes](classes.md).

## Next steps

- [Configuration](configuration.md)
- [Commands](commands.md)
- [Nexora Studio](studio.md)
- [Plugins](plugins.md)
- [Logging](logging.md)
