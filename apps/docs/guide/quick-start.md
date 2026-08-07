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
npx create-nexorajs my-bot
cd my-bot
pnpm install
cp .env.example .env
```

Edit `.env` and set at least:

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

## Run

```bash
pnpm dev
```

## Your first command

```ts
// commands/ping.ts
import { command } from '@nexorajs/core';

export default command({
  name: 'ping',
  description: 'Check bot latency',
  async execute(ctx) {
    await ctx.interaction.reply('Pong!');
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

Commands and events are **auto-discovered** — no manual registration.

## Next steps

- [Configuration](configuration.md)
- [Commands](commands.md)
- [Plugins](plugins.md)
- [Dashboard](dashboard.md)
