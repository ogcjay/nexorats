# Nexora

**Modern open-source TypeScript framework for Discord bots.**

Nexora is a complete foundation — CLI, command system, plugin system, dashboard, authentication, and more — so you can focus on your bot’s features instead of wiring libraries together.

| | |
| --- | --- |
| **GitHub** | [ogcjay/nexorajs](https://github.com/ogcjay/nexorajs) |
| **npm** | [`@nexora.ts/core`](https://www.npmjs.com/package/@nexora.ts/core) |
| **Status** | Early preview (`0.1.x`) |

## Quick start

```bash
npx create-nexora.ts my-bot
cd my-bot
pnpm install
cp .env.example .env   # add your Discord token
pnpm dev
```

Continue with **[Quick start](guide/quick-start.md)**, **[Classes](classes/index.md)** (API reference with examples), or **[Introduction](guide/introduction.md)**.

## What you get

| Building block | What you get |
| --- | --- |
| **CLI** | `create-nexora.ts` scaffolds a full project |
| **Classes** | `Nexora`, `SlashCommand`, `EmbedBuilder`, Components V2 — see [Classes](classes/index.md) |
| **Commands & events** | `command()` / `event()` or class-based commands |
| **Plugin system** | Commands, events, dashboard, API, migrations |
| **Dashboard** | Next.js UI for guild settings, modules, logs |
| **Auth** | Discord OAuth, sessions, permissions |
| **Database** | Drizzle + repository layer (PostgreSQL / SQLite) |
| **API + WebSocket** | Internal REST API and live dashboard events |
| **Config & logging** | Type-safe `defineConfig()`, structured logs |

## Open source

MIT licensed. Use it, extend it with plugins, improve core and docs — community-driven.

```ts
import { command } from '@nexora.ts/core';
import { defineConfig } from '@nexora.ts/config';

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
