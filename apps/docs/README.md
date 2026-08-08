# Nexora

**The platform that revolutionizes how Discord bots are built** — open-source TypeScript, production-ready from minute one.

Nexora isn’t another bot template — **it’s the platform Discord developers have been missing.** CLI, Studio, plugins, auto-discovery, auth, and more so you can focus on features instead of scaffolding.

| | |
| --- | --- |
| **GitHub** | [ogcjay/nexorats](https://github.com/ogcjay/nexorats) |
| **Discord** | [Join the server](https://discord.gg/fHbCrdHnms) (maintainer: **ogcjay**) |
| **npm** | [`@nexora.ts/core`](https://www.npmjs.com/package/@nexora.ts/core) |
| **Status** | Early preview (`0.1.x`) |

![Nexora Studio](images/studio-overview.png)

## Quick start

```bash
npx @nexora.ts/create my-bot
cd my-bot
pnpm install
cp .env.example .env   # add your Discord token
pnpm dev
```

Open **http://localhost:3002** for Nexora Studio. Continue with **[Quick start](guide/quick-start.md)**, **[Nexora Studio](guide/studio.md)**, **[Classes](classes/index.md)**, or **[Introduction](guide/introduction.md)**.

## Nexora vs a typical DIY bot stack

| Feature | From-scratch Discord project | Nexora |
| --- | :---: | :---: |
| Discord API compatibility | ✅ (you wire it) | ✅ |
| Project CLI / scaffold | ❌ / copy-paste | ✅ |
| Local Developer Center (Studio) | ❌ | ✅ |
| Plugin system | DIY | ✅ |
| Auto-discovery | DIY | ✅ |
| Typed config + structured logging | DIY | ✅ |

## What you get

| Building block | What you get |
| --- | --- |
| **CLI** | `@nexora.ts/create` scaffolds a full project |
| **Studio** | Local Developer Center (`localhost:3002`) |
| **Classes** | `Nexora`, `SlashCommand`, `EmbedBuilder`, Components V2 — see [Classes](classes/index.md) |
| **Commands & events** | `command()` / `event()` or class-based commands |
| **Plugin system** | Commands, events, API, migrations |
| **Auth** | Discord OAuth, sessions, permissions |
| **Database** | Drizzle + repository layer (PostgreSQL / SQLite) |
| **API + WebSocket** | Internal REST API and live events |
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
