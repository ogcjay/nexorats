# Components V2

Discord’s **Components V2** layout system replaces classic `content` + `embeds` with structured components (Text Display, Container, Section, Media Gallery, Separator, …).

Official overview: [Discord Components](https://docs.discord.com/developers/components/overview).

Nexora wraps the API with short factories, a card preset, and **automatic** `IS_COMPONENTS_V2` flags through `ctx.reply` / `ctx.componentsV2` / `ComponentsV2Message`.

Classic embeds & action rows remain fully supported — see [Builders](builders.md). Use V2 when you want layout control beyond embeds.

## Flag: `IS_COMPONENTS_V2`

Messages must send the flag `1 << 15` (`IS_COMPONENTS_V2`). In discord.js that is `MessageFlags.IsComponentsV2`.

| Constraint | Detail |
| --- | --- |
| No classic body | `content`, `embeds`, `poll`, and `stickers` are disabled |
| Irreversible | Once a message is sent with the flag, it cannot be removed on edit |
| Limit | Up to **40** total components (nested count) |
| Attachments | Must be referenced from components (Thumbnail / Media Gallery / File) |

Nexora applies the flag for you when you use:

- `ctx.componentsV2(…)`
- `ctx.reply({ v2: true, components: […] })` or `ctx.reply({ v2: […] })`
- `ComponentsV2Message` / `v2Message(…)` / `ComponentsV2.card(…)` via `.toJSON()`

## Naming: `MessageContainerBuilder`

Discord’s type **17** is a **Container**. discord.js calls it `ContainerBuilder`.

Nexora uses **`LayoutContainerBuilder`** (alias **`MessageContainerBuilder`**) so it never clashes with the DI [`Container`](dependency-injection.md). Factory: `container(…)`.

```ts
import { MessageContainerBuilder, text } from '@nexora.ts/core';
// same class:
import { LayoutContainerBuilder, container } from '@nexora.ts/core';
```

## Component builders

| Builder / factory | Type | Role |
| --- | --- | --- |
| `TextDisplayBuilder` / `text()` | 10 | Markdown text (replaces `content`) |
| `SectionBuilder` / `section()` | 9 | 1–3 text displays + accessory (thumbnail or button) |
| `ThumbnailBuilder` / `thumbnail()` | 11 | Section accessory image |
| `MediaGalleryBuilder` / `gallery()` | 12 | 1–10 media items |
| `FileBuilder` / `file()` | 13 | Show an uploaded `attachment://…` file |
| `SeparatorBuilder` / `separator()` | 14 | Spacing / optional divider |
| `LayoutContainerBuilder` / `container()` | 17 | Visual group + optional accent color |
| `LabelBuilder` / `label()` | 18 | Modal label + nested control |

Interactive children (buttons, selects) still use the classic [Builders](builders.md) and sit inside action rows (or as a Section accessory).

## vs discord.js

```ts
// discord.js
import {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} from 'discord.js';

const container = new ContainerBuilder()
  .setAccentColor(0x5865f2)
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('# Hello\nWelcome to the server.'),
  );

await interaction.reply({
  components: [container],
  flags: MessageFlags.IsComponentsV2,
});
```

```ts
// Nexora — flag set automatically
import { command, container, text } from '@nexora.ts/core';

export default command({
  name: 'welcome',
  description: 'V2 welcome card',
  async execute(ctx) {
    await ctx.componentsV2(
      container(text('# Hello\nWelcome to the server.')).accent(0x5865f2),
    );
  },
});
```

## Reply helpers

```ts
import { command, text, separator } from '@nexora.ts/core';

export default command({
  name: 'panel',
  description: 'Components V2 panel',
  async execute(ctx) {
    await ctx.componentsV2(
      text('# Status'),
      separator().large(),
      text('All systems operational.'),
    );
  },
});
```

Other patterns:

```ts
// reply + v2 flag
await ctx.reply({
  v2: true,
  components: [text('Hello from V2')],
});

// components passed via v2
await ctx.reply({
  v2: [container(text('Grouped')).accent('#5865F2')],
});

// Card preset → payload with flags already set
const payload = ComponentsV2.card({
  title: 'Welcome',
  body: 'Thanks for joining.',
  accent: 0x5865f2,
  thumbnail: ctx.user.displayAvatarURL(),
  buttons: [
    new ButtonBuilder().customId('ok', { prefix: true }).label('Got it').primary(),
  ],
}).toJSON();

await ctx.reply({ ...payload });
```

Imports for the snippets above: `container`, `ComponentsV2`, `ButtonBuilder` from `@nexora.ts/core`.


## Layout examples

### Text + separator

```ts
await ctx.componentsV2(
  text('# Rules'),
  separator({ divider: true }).small(),
  text('1. Be respectful\n2. No spam'),
);
```

### Section with thumbnail

```ts
import { section, text, thumbnail } from '@nexora.ts/core';

await ctx.componentsV2(
  section('# Profile', ctx.user.tag).accessory(
    thumbnail(ctx.user.displayAvatarURL()),
  ),
);
```

### Media gallery

```ts
import { gallery } from '@nexora.ts/core';

await ctx.componentsV2(
  text('Screenshots'),
  gallery(
    'https://example.com/a.png',
    { url: 'https://example.com/b.png', description: 'Alt text', spoiler: true },
  ),
);
```

### MessageContainerBuilder

```ts
import {
  MessageContainerBuilder,
  text,
  separator,
  ActionRowBuilder,
  ButtonBuilder,
} from '@nexora.ts/core';

const panel = new MessageContainerBuilder()
  .accent(0x5865f2)
  .add(
    text('## Moderation'),
    separator().divider(),
    text('Choose an action.'),
    new ActionRowBuilder().add(
      new ButtonBuilder().customId('warn', { prefix: 'mod' }).label('Warn').secondary(),
      new ButtonBuilder().customId('kick', { prefix: 'mod' }).label('Kick').danger(),
    ),
  );

await ctx.componentsV2(panel);
```

### `ComponentsV2Message`

```ts
import { v2Message, text, container } from '@nexora.ts/core';

const msg = v2Message(
  container(text('# Alert'), text('Deploy finished.')).accent(0x57f287),
).flags(64); // optional: OR Ephemeral onto IsComponentsV2

await ctx.interaction.reply(msg.toJSON());
```

## Constants

```ts
import { IsComponentsV2, MAX_V2_COMPONENTS, SeparatorSpacing, V2ComponentType } from '@nexora.ts/core';

IsComponentsV2;      // 1 << 15
MAX_V2_COMPONENTS;   // 40
SeparatorSpacing.Small;
SeparatorSpacing.Large;
```

Builders call `validate()` / warn when nested trees exceed the 40-component limit.

## When to use which

| Use | Prefer |
| --- | --- |
| Simple status / logs | [EmbedBuilder](builders.md) presets |
| Buttons under an embed | Classic ActionRow + [ButtonBuilder](builders.md) |
| Rich layout, cards, galleries | **Components V2** |
| Modals | [ModalBuilder](builders.md) (+ optional `LabelBuilder` for V2 modal labels) |

## Further reading

- [Builders](builders.md) — embeds, buttons, modals
- [Commands](commands.md) — context helpers
- [Discord: Using message components](https://docs.discord.com/developers/components/using-message-components)
- [Discord: Component reference](https://docs.discord.com/developers/components/reference)
