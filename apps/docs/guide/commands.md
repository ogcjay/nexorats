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
| `reply(…)` | Reply to the interaction (strings, discord.js options, or builders) |
| `embed(…)` | Reply with a single embed builder / `APIEmbed` |
| `componentsV2(…)` | Reply with Components V2 (sets `IS_COMPONENTS_V2` automatically) |
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

### Embeds & Components V2

`reply` accepts builder-friendly options: `embed` / `embeds`, `components`, and `v2` (auto flag). See [Builders](builders.md) and [Components V2](components-v2.md).

```ts
import { command, EmbedBuilder } from '@nexorajs/core';

export default command({
  name: 'status',
  description: 'Show status',
  async execute(ctx) {
    await ctx.embed(EmbedBuilder.success('Online', 'Bot is ready.'));
  },
});
```

```ts
import { command, text, container } from '@nexorajs/core';

export default command({
  name: 'panel',
  description: 'V2 status panel',
  async execute(ctx) {
    await ctx.componentsV2(
      container(text('# Online'), text('Bot is ready.')).accent(0x57f287),
    );
  },
});
```


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

See [Classes](../classes/index.md) for `SlashCommand`, `Service`, builders, and plugins with full examples.

## Options

Supported option types: `string`, `integer`, `boolean`, `user`, `channel`, `role`, `mentionable`, `number`.

## Deployment

On startup, Nexora deploys registered commands to configured guilds (or globally if no `guildIds` are set).
