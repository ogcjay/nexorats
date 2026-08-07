# EmbedBuilder

Fluent embed builder with presets — shorter than discord.js for common cases.

**Package:** `@nexora.ts/core`  
**Alias:** `Embed` (same class)

## Beginner

```ts
import { EmbedBuilder } from '@nexora.ts/core';
// or: import { Embed } from '@nexora.ts/core';

await ctx.reply(EmbedBuilder.success('Done', 'User was banned.'));
// even shorter:
await ctx.success('User was banned.');
```

Presets: `EmbedBuilder.success` / `error` / `warn` / `info`.

## Full example

```ts
import { EmbedBuilder, type CommandContext } from '@nexora.ts/core';

async function showProfile(ctx: CommandContext) {
  const embed = EmbedBuilder.info('Profile', `Stats for ${ctx.user.tag}`)
    .thumbnail(ctx.user.displayAvatarURL())
    .field('ID', ctx.user.id, true)
    .field('Joined', ctx.member?.joinedAt?.toDateString() ?? '—', true)
    .footer('Nexora', ctx.client.user?.displayAvatarURL())
    .timestamp();

  await ctx.reply(embed);
  // or: await ctx.embed(embed);
}
```

## Common methods

| Method | Description |
| --- | --- |
| `title` / `description` / `url` | Basics |
| `color` / `timestamp` | Style |
| `field(name, value, inline?)` | Add field |
| `fields(…)` | Add many |
| `author` / `footer` / `thumbnail` / `image` | Media |
| `toJSON()` | Plain API embed |
| `static from(data)` | Clone |

Colors: number (`0x5865f2`), `#5865f2`, or `EmbedColor.Success` etc.

## With classic components

```ts
import { EmbedBuilder, btn, row } from '@nexora.ts/core';

await ctx.reply({
  embed: EmbedBuilder.success('Confirm', 'Delete this item?'),
  components: [row(btn.success('yes', 'Yes'), btn.danger('no', 'No'))],
});
```

## Related

- [ButtonBuilder](button-builder.md)
- [Builders guide](../guide/builders.md)
- [SlashCommand](slash-command.md)
