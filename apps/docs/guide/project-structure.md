# Project structure

A typical Nexora bot project looks like this:

```
my-bot/
├── commands/           # Slash commands (auto-discovered)
├── events/             # Discord events (auto-discovered)
├── interactions/       # Button / select / modal handlers
├── plugins/            # Optional local plugins
├── src/
│   └── index.ts        # Bootstraps Nexora
├── nexora.config.ts    # defineConfig()
├── .env
└── package.json
```

## Monorepo (this repository)

When contributing to Nexora itself:

```
apps/
  dashboard/      Bot management UI
  docs/           This VitePress site (GitHub Pages)
  playground/     Demo bot
packages/
  core/           Client, commands, events, DI, …
  config/         defineConfig()
  logger/
  database/
  auth/
  api/
  plugin-system/
  websocket/
  ui/
  cli/            create-nexora-ts
```

## Entry point

```ts
import config from '../nexora.config.js';
import { Nexora } from '@nexora.ts/core';

const bot = new Nexora({
  config,
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
  interactionsPath: './interactions/**/*.ts',
});

await bot.start();
```
