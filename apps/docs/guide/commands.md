# Commands

Define slash commands with the typed `command()` helper — or as a class. Files under your commands path are loaded automatically.

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
    await ctx.reply(echo ?? 'Pong!');
  },
});
```

## Context helpers

`execute` receives a `CommandContext` with Discord.js access **and** short helpers:

| Field / method | Description |
| --- | --- |
| `interaction` | Discord.js chat input interaction |
| `client` | Discord client |
| `user` | Invoking user |
| `guild` | Guild or `null` (DM) |
| `member` | Guild member or `null` |
| `channel` | Channel where the command ran |
| `guildId` | Guild id or `null` |
| `reply(…)` | Reply to the interaction |
| `defer(…)` | Defer the reply (for longer work) |
| `editReply(…)` | Edit a deferred / previous reply |
| `followUp(…)` | Send a follow-up message |

```ts
async execute(ctx) {
  await ctx.defer();
  // … work …
  await ctx.editReply(`Done for ${ctx.user.username}`);
}
```

You can still use `ctx.interaction.reply(…)` when you need the full Discord.js API.

## Guards

Guards run **before** `execute`. Failed checks reply with an ephemeral error.

| Option | Behavior |
| --- | --- |
| `guildOnly: true` | Rejects DMs |
| `adminOnly: true` | Requires Administrator permission |
| `permissions: […]` | Requires the listed Discord permissions |
| `cooldown: number` | Per-user cooldown in **milliseconds** |

```ts
export default command({
  name: 'purge',
  description: 'Delete messages',
  guildOnly: true,
  adminOnly: true,
  permissions: ['ManageMessages'],
  cooldown: 5_000,
  async execute(ctx) {
    await ctx.reply('Purging…');
  },
});
```

## Class style

Prefer classes when you want shared structure, reuse, or DI-friendly services. Discovery accepts both styles.

```ts
import { SlashCommand, type CommandContext } from '@nexorajs/core';

export default class PingCommand extends SlashCommand {
  name = 'ping';
  description = 'Check bot latency';
  guildOnly = true;
  cooldown = 3_000;

  async execute(ctx: CommandContext) {
    await ctx.reply('Pong!');
  }
}
```

See [Classes](classes.md) for `SlashCommand`, `Service`, and plugins.

## Options

Supported option types: `string`, `integer`, `boolean`, `user`, `channel`, `role`, `mentionable`, `number`.

## Deployment

On startup, Nexora deploys registered commands to configured guilds (or globally if no `guildIds` are set).
