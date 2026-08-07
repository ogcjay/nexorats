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
npx create-nexora.ts@latest my-bot
cd my-bot
pnpm install
cp .env.example .env
```

Edit `.env` and set at least:

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

Scripts use Node’s `--env-file=.env`, and `@nexora.ts/config` also loads `.env` via `loadEnv()` so `process.env` is ready when `defineConfig` runs.

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

Public docs (this site): [https://cjays-organization.gitbook.io/nexora.ts/](https://cjays-organization.gitbook.io/nexora.ts/)

## Your first command

```ts
// commands/ping.ts
import { command } from '@nexora.ts/core';

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
import { event } from '@nexora.ts/core';

export default event('ready', (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});
```

Commands and events are **auto-discovered** — no manual registration. Prefer classes? See [Classes](../classes/index.md).

## Updating Nexora packages

Keep your bot on the latest framework releases:

```bash
# Update core (recommended)
pnpm add @nexora.ts/core@latest

# Or update every @nexora.ts package in the project
pnpm update "@nexora.ts/*"
```

When you start the bot, Nexora checks npm for a newer `@nexora.ts/core`. If an update exists, the console shows something like:

```text
WARN  Update available: @nexora.ts/core@0.1.3 → 0.1.4
INFO  Update with:  pnpm add @nexora.ts/core@latest
INFO  Or all pkgs:  pnpm update "@nexora.ts/*"
```

Disable the check with `updateCheck: false` in `defineConfig`, or set `NEXORA_UPDATE_CHECK=0`.

## Next steps

- [Configuration](configuration.md)
- [Commands](commands.md)
- [Nexora Studio](studio.md)
- [Plugins](plugins.md)
- [Logging](logging.md)
