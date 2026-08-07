# LayoutContainerBuilder

Components V2 layout container — groups text, media, sections, and interactive components. Prefer this over classic embeds for new UIs.

**Package:** `@nexora.ts/core`  
**Factories:** `container()`, alias `MessageContainerBuilder`  
**Flag:** replies must use `IsComponentsV2` (`ctx.componentsV2` / `v2Message` set it for you)

> Named `LayoutContainerBuilder` so it does not clash with the DI `Container`.

## Quick example

```ts
import { container, text, separator, type CommandContext } from '@nexora.ts/core';

export async function welcome(ctx: CommandContext) {
  await ctx.componentsV2(
    container()
      .accent(0x5865f2)
      .add(
        text(`# Welcome, ${ctx.user.username}`),
        separator(),
        text('Thanks for joining the server.'),
      ),
  );
}
```

## Card preset

```ts
import { ComponentsV2, type CommandContext } from '@nexora.ts/core';

await ctx.reply(
  ComponentsV2.card({
    title: 'Ticket created',
    body: 'A moderator will reply soon.',
    accent: '#57F287',
  }).toJSON(),
);
```

## Richer layout

```ts
import {
  container,
  text,
  separator,
  section,
  thumbnail,
  gallery,
  ButtonBuilder,
  ActionRowBuilder,
  type CommandContext,
} from '@nexora.ts/core';

await ctx.componentsV2(
  container()
    .accent('#5865F2')
    .add(
      text('# Server status'),
      section('All systems operational').accessory(thumbnail(ctx.guild!.iconURL()!)),
      separator(),
      gallery('https://example.com/banner.png'),
      new ActionRowBuilder().add(
        new ButtonBuilder().customId('refresh').label('Refresh').primary(),
      ),
    ),
);
```

## Helpers

| Helper | Type | Role |
| --- | --- | --- |
| `text(md)` | 10 | Markdown text display |
| `section(…)` | 9 | Text + accessory (button/thumbnail) |
| `thumbnail(url)` | 11 | Small image accessory |
| `gallery(…)` | 12 | Media gallery |
| `file(name)` | 13 | Attachment reference |
| `separator()` | 14 | Spacing / divider |
| `container(…)` | 17 | Visual group + accent color |
| `v2Message(…)` | — | `{ components, flags }` payload |

**Limits:** Discord allows up to **40** components per message — builders can warn via `validate()`.

## Related

- [Components V2 guide](../guide/components-v2.md)
- [EmbedBuilder](embed-builder.md) (classic alternative)
- [SlashCommand](slash-command.md)
