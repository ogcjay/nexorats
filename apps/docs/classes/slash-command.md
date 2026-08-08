# SlashCommand

Abstract base class for slash commands. Same discovery as `command({…})` / `slash(…)` — export `default` from a file under `commands/`.

**Package:** `@nexora.ts/core`  
**Alias:** `BaseCommand` (extends `SlashCommand`)

## Beginner (shortest path)

```ts
import { slash } from '@nexora.ts/core';

export default slash('ping', 'Check latency', async (ctx) => {
  await ctx.reply('Pong!');
});
```

Private admin reply in one line:

```ts
import { slash } from '@nexora.ts/core';

export default slash('ban', 'Ban a member', async (ctx) => {
  const user = ctx.options.user('user', true);
  await ctx.success(`${user.tag} was banned.`);
}, {
  guildOnly: true,
  adminOnly: true,
  ephemeral: true, // all ctx.reply / embed default to ephemeral
  options: [
    { name: 'user', description: 'Member', type: 'user', required: true },
  ],
});
```

### Typed option getters

Prefer `ctx.options.*` over `ctx.interaction.options.get*`:

```ts
import { slash } from '@nexora.ts/core';

export default slash('echo', 'Echo text', async (ctx) => {
  const text = ctx.options.string('text', true);
  const times = ctx.options.integer('times') ?? 1;
  await ctx.reply(text.repeat(times));
}, {
  options: [
    { name: 'text', description: 'Text', type: 'string', required: true },
    { name: 'times', description: 'Repeat count', type: 'integer' },
  ],
});
```

Available: `string`, `integer`, `number`, `boolean`, `user`, `channel`, `role`, `mentionable`, `attachment`. Pass `true` as second arg when the option is required (narrows away `null`).

## Class style

```ts
import { SlashCommand, type CommandContext } from '@nexora.ts/core';

export default class PingCommand extends SlashCommand {
  name = 'ping';
  description = 'Check bot latency';

  async execute(ctx: CommandContext) {
    await ctx.reply('Pong!');
  }
}
```

## Full example (options & embeds)

```ts
import { SlashCommand, EmbedBuilder, type CommandContext } from '@nexora.ts/core';

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
    const user = ctx.options.user('user', true);
    const reason = ctx.options.string('reason') ?? 'No reason';

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
| `ctx.success` / `error` / `warn` / `info` | colored embeds, **ephemeral by default** |
| `ctx.defer()` / `ctx.editReply()` / `ctx.followUp()` | deferred flows |
| `ctx.embed(builder)` | reply with one embed |
| `ctx.componentsV2(…)` | Components V2 + `IsComponentsV2` flag |
| `ctx.user` / `ctx.guild` / `ctx.member` / `ctx.channel` | shortcuts |
| `ctx.options.string/user/…` | typed option getters |
| `ctx.interaction` | raw discord.js interaction |

## Fields you can set

`name`, `description`, `options`, `guildOnly`, `adminOnly`, `permissions`, `cooldown`, `ephemeral`, `defaultMemberPermissions`, `dmPermission`, `guards`, `autocomplete?`, `execute`

## vs `command()` / `slash()`

```ts
// Object form — still valid
export default command({
  name: 'ping',
  description: 'Check latency',
  async execute(ctx) {
    await ctx.reply('Pong!');
  },
});
```

Prefer `slash()` for the shortest beginner path, `SlashCommand` when you want inheritance or shared base classes.

## Related

- [Commands guide](../guide/commands.md)
- [EmbedBuilder](embed-builder.md)
- [Nexora](nexora.md)
