# SlashCommand

Abstract base class for slash commands. Same discovery as `command({…})` — export `default class` from a file under `commands/`.

**Package:** `@nexorajs/core`  
**Alias:** `BaseCommand` (extends `SlashCommand`)

## Minimal example

```ts
import { SlashCommand, type CommandContext } from '@nexorajs/core';

export default class PingCommand extends SlashCommand {
  name = 'ping';
  description = 'Check bot latency';

  async execute(ctx: CommandContext) {
    await ctx.reply('Pong!');
  }
}
```

## With options & guards

```ts
import { SlashCommand, EmbedBuilder, type CommandContext } from '@nexorajs/core';

export default class BanCommand extends SlashCommand {
  name = 'ban';
  description = 'Ban a member';
  guildOnly = true;
  adminOnly = true;
  cooldown = 5_000; // ms per user

  options = [
    { name: 'user', description: 'Member to ban', type: 'user' as const, required: true },
    { name: 'reason', description: 'Reason', type: 'string' as const, required: false },
  ];

  async execute(ctx: CommandContext) {
    const user = ctx.interaction.options.getUser('user', true);
    const reason = ctx.interaction.options.getString('reason') ?? 'No reason';

    await ctx.reply(
      EmbedBuilder.success('Banned', `${user.tag} — ${reason}`).field(
        'Moderator',
        ctx.user.tag,
        true,
      ),
    );
  }
}
```

## Context helpers

Inside `execute(ctx)`:

| Helper | Description |
| --- | --- |
| `ctx.reply(…)` | string, embed builder, or options (`v2`, `ephemeral`, …) |
| `ctx.defer()` / `ctx.editReply()` / `ctx.followUp()` | deferred flows |
| `ctx.embed(builder)` | reply with one embed |
| `ctx.componentsV2(…)` | Components V2 + `IsComponentsV2` flag |
| `ctx.user` / `ctx.guild` / `ctx.member` / `ctx.channel` | shortcuts |
| `ctx.interaction` | raw discord.js interaction |

## Fields you can set

`name`, `description`, `options`, `guildOnly`, `adminOnly`, `permissions`, `cooldown`, `autocomplete?`, `execute`

## vs `command()`

```ts
// Still valid — same runtime
export default command({
  name: 'ping',
  description: 'Check latency',
  async execute(ctx) {
    await ctx.reply('Pong!');
  },
});
```

Prefer `SlashCommand` when you want inheritance, shared base classes, or clearer structure in large codebases.

## Related

- [Commands guide](../guide/commands.md)
- [EmbedBuilder](embed-builder.md)
- [Nexora](nexora.md)
