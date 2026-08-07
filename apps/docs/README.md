# Nexora

**Modern open-source TypeScript framework for Discord bots.**

Nexora is a complete foundation — CLI, command system, plugin system, dashboard, authentication, and more — so you can focus on your bot’s features instead of wiring libraries together.

| | |
| --- | --- |
| **GitHub** | [ogcjay/nexorajs](https://github.com/ogcjay/nexorajs) |
| **npm** | [`@nexorajs/core`](https://www.npmjs.com/package/@nexorajs/core) |
| **Status** | Early preview (`0.1.x`) |

## Quick start

```bash
npx create-nexorajs my-bot
cd my-bot
pnpm install
cp .env.example .env   # add your Discord token
pnpm dev
```

Continue with **[Quick start](guide/quick-start.md)** or **[Introduction](guide/introduction.md)**.

## What you get

| Building block | What you get |
| --- | --- |
| **CLI** | `create-nexorajs` scaffolds a full project |
| **Commands & events** | `command()` / `event()` with auto-discovery |
| **Plugin system** | Commands, events, dashboard, API, migrations |
| **Dashboard** | Next.js UI for guild settings, modules, logs |
| **Auth** | Discord OAuth, sessions, permissions |
| **Database** | Drizzle + repository layer (PostgreSQL / SQLite) |
| **API + WebSocket** | Internal REST API and live dashboard events |
| **Config & logging** | Type-safe `defineConfig()`, structured logs |

## Open source

MIT licensed. Use it, extend it with plugins, improve core and docs — community-driven.

```ts
import { command } from '@nexorajs/core';
import { defineConfig } from '@nexorajs/config';

export default defineConfig({
  bot: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
});

export const ping = command({
  name: 'ping',
  description: 'Check bot latency',
  async execute(ctx) {
    await ctx.interaction.reply('Pong!');
  },
});
```
