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
npx @nexora.ts/create@latest my-bot
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

`pnpm dev` starts your bot, the Studio API (`:3920`), and an **embedded Studio UI** on **http://localhost:3002** — no second terminal needed.

`nexora dev` does the same and, when `@nexora.ts/studio` is available, prefers the Vite UI.

| Service | URL |
| --- | --- |
| **Nexora Studio** | http://localhost:3002 |
| Studio API | http://127.0.0.1:3920 |

> Open **:3002** for the Developer Center. A public OAuth **Dashboard** is planned but unreleased — see [Dashboard](dashboard.md).

Public docs (this site): [https://cjays-organization.gitbook.io/nexorajs](https://cjays-organization.gitbook.io/nexorajs)

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
