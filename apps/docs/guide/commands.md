# Commands

Define slash commands with the typed `command()` helper. Files under your commands path are loaded automatically.

```ts
import { command } from '@nexorajs/core';

export default command({
  name: 'ping',
  description: 'Ping the bot',
  options: [
    {
      name: 'echo',
      description: 'Optional text to echo',
      type: 'string',
      required: false,
    },
  ],
  async execute(ctx) {
    const echo = ctx.interaction.options.getString('echo');
    await ctx.interaction.reply(echo ?? 'Pong!');
  },
});
```

## Context

`execute` receives a `CommandContext`:

| Field | Description |
| --- | --- |
| `interaction` | Discord.js chat input interaction |
| `client` | Discord client |
| `user` | Invoking user |
| `guildId` | Guild id or `null` |

## Options

Supported option types: `string`, `integer`, `boolean`, `user`, `channel`, `role`, `mentionable`, `number`.

## Deployment

On startup, Nexora deploys registered commands to configured guilds (or globally if no `guildIds` are set).
