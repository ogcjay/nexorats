# Builders

Nexora ships fluent builders for embeds, buttons, selects, modals, and action rows — designed for shorter chains than discord.js while still emitting plain Discord API payloads (`toJSON()`).

They work with [`ctx.reply`](commands.md), `ctx.embed`, and raw `interaction.reply({ embeds, components })`.

For Discord’s newer layout system (Containers, Text Display, …), see [Components V2](components-v2.md).

## Why Nexora builders?

| Advantage | What you get |
| --- | --- |
| **Presets** | `EmbedBuilder.success` / `error` / `warn` / `info` with Discord brand colors |
| **Shorter API** | `title()`, `field()`, `.success()` instead of long `set*` chains |
| **Unified replies** | `ctx.reply({ embed })`, `ctx.embed(…)`, `components` accept builders |
| **customId helpers** | Optional `nexora:` (or custom) namespace via `{ prefix: true }` |
| **No lock-in** | `toJSON()` is API-compatible — mix with discord.js anytime |

## vs discord.js

```ts
// discord.js
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const embed = new EmbedBuilder()
  .setColor(0x57f287)
  .setTitle('Done')
  .setDescription('User banned.')
  .addFields({ name: 'Moderator', value: user.tag, inline: true })
  .setTimestamp();

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('confirm')
    .setLabel('Confirm')
    .setStyle(ButtonStyle.Success),
);

await interaction.reply({ embeds: [embed], components: [row] });
```

```ts
// Nexora
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  command,
} from '@nexora.ts/core';

export default command({
  name: 'ban',
  description: 'Ban a member',
  async execute(ctx) {
    const embed = EmbedBuilder.success('Done', 'User banned.')
      .field('Moderator', ctx.user.tag, true)
      .timestamp();

    const row = new ActionRowBuilder().add(
      new ButtonBuilder().customId('confirm', { prefix: true }).label('Confirm').success(),
    );

    await ctx.reply({ embed, components: [row] });
    // or: await ctx.embed(embed);
  },
});
```

## EmbedBuilder

```ts
import { EmbedBuilder, EmbedColor } from '@nexora.ts/core';

EmbedBuilder.success('OK', 'Saved.');
EmbedBuilder.error('Failed', 'Missing permission.');
EmbedBuilder.warn('Careful', 'This cannot be undone.');
EmbedBuilder.info('Tip', 'Use /help for more.');

new EmbedBuilder()
  .title('Custom')
  .description('Body text')
  .color(EmbedColor.Default) // or '#5865F2' / 0x5865f2
  .author('Nexora', { iconURL: 'https://…' })
  .footer('Docs', 'https://…')
  .thumbnail('https://…')
  .image('https://…')
  .field('Key', 'Value', true)
  .timestamp();
```

| Preset | Color |
| --- | --- |
| `success` | `0x57F287` (green) |
| `error` | `0xED4245` (red) |
| `warn` | `0xFEE75C` (yellow) |
| `info` | `0x5865F2` (blurple) |

Pass builders (or plain `APIEmbed` objects) via:

```ts
await ctx.reply({ embed });           // single
await ctx.reply({ embeds: [a, b] });  // multiple
await ctx.embed(embed);               // shortcut
```

## ButtonBuilder

```ts
import { ButtonBuilder } from '@nexora.ts/core';

new ButtonBuilder()
  .customId('ok', { prefix: true }) // → nexora:ok
  .label('Confirm')
  .emoji('✅')
  .success();

new ButtonBuilder().label('Docs').link('https://cjays-organization.gitbook.io/nexora.ts');
```

Style shortcuts: `.primary()`, `.secondary()`, `.success()`, `.danger()`, `.link(url)` / `.url(url)`.

Non-link buttons require a `customId`. Link buttons require a URL and clear `custom_id`.

## ActionRowBuilder

Holds up to **5** message components (buttons / selects), or a single text input when used in a modal.

```ts
import { ActionRowBuilder, ButtonBuilder } from '@nexora.ts/core';

const row = new ActionRowBuilder().add(
  new ButtonBuilder().customId('yes').label('Yes').success(),
  new ButtonBuilder().customId('no').label('No').danger(),
);

await ctx.reply({ content: 'Sure?', components: [row] });
```

`.add()` / `.addComponents()` accept builders or raw API objects. `.set()` replaces the row.

## Selects

```ts
import {
  StringSelectBuilder,
  UserSelectBuilder,
  RoleSelectBuilder,
  ChannelSelectBuilder,
  ActionRowBuilder,
} from '@nexora.ts/core';

const menu = new StringSelectBuilder()
  .customId('plan', { prefix: true })
  .placeholder('Pick a plan')
  .option({ label: 'Free', value: 'free' })
  .option({ label: 'Pro', value: 'pro', description: 'All features' });

await ctx.reply({
  content: 'Choose:',
  components: [new ActionRowBuilder().add(menu)],
});
```

Also available: `UserSelectBuilder`, `RoleSelectBuilder`, `MentionableSelectBuilder`, `ChannelSelectBuilder`. Shared helpers: `.placeholder()`, `.values(n)` / `.values(min, max)`, `.disabled()`.

## ModalBuilder & TextInputBuilder

Modals auto-wrap each text input in an action row.

```ts
import { ModalBuilder, TextInputBuilder } from '@nexora.ts/core';

const modal = new ModalBuilder()
  .customId('report', { prefix: true })
  .title('Report user')
  .add(
    new TextInputBuilder()
      .customId('details')
      .label('Details')
      .paragraph()
      .required()
      .placeholder('What happened?'),
  );

await ctx.interaction.showModal(modal.toJSON());
```

Text input shortcuts: `.short()`, `.paragraph()`, plus `.minLength()` / `.maxLength()` / `.value()`.

## customId

```ts
import { customId } from '@nexora.ts/core';

customId('confirm');                       // confirm
customId('confirm', { prefix: true });     // nexora:confirm
customId('ban', { prefix: 'mod' });        // mod:ban
```

Builders that take `customId(id, options?)` use the same rules.

## Next

- [Components V2](components-v2.md) — Containers, Text Display, auto `IS_COMPONENTS_V2`
- [Commands](commands.md) — `ctx.reply` / `ctx.embed` / `ctx.componentsV2`
- Official Discord overview: [Components](https://docs.discord.com/developers/components/overview)
