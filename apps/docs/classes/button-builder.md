# ButtonBuilder & ActionRowBuilder

Interactive buttons and action rows as plain API objects (`toJSON()`).

**Package:** `@nexora.ts/core`

## Beginner (shortest path)

```ts
import { btn, row, EmbedBuilder, type CommandContext } from '@nexora.ts/core';

export async function confirmDelete(ctx: CommandContext) {
  await ctx.reply({
    embed: EmbedBuilder.warn('Confirm', 'This cannot be undone.'),
    components: [
      row(
        btn.danger('delete:confirm', 'Delete'),
        btn.secondary('delete:cancel', 'Cancel'),
      ),
    ],
  });
}
```

Same with class statics: `ButtonBuilder.primary('id', 'Label')`, `row(...)`.

## Full fluent API

```ts
import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  type CommandContext,
} from '@nexora.ts/core';

export async function confirmDelete(ctx: CommandContext) {
  const row = new ActionRowBuilder().add(
    new ButtonBuilder()
      .customId('delete:confirm', { prefix: true }) // → nexora:delete:confirm
      .label('Delete')
      .danger(),
    new ButtonBuilder().customId('delete:cancel').label('Cancel').secondary(),
    new ButtonBuilder().label('Docs').link('https://cjays-organization.gitbook.io/nexorajs'),
  );

  await ctx.reply({
    embeds: [EmbedBuilder.warn('Confirm', 'This cannot be undone.').toJSON()],
    components: [row.toJSON()],
  });
}
```

## Button styles

| Helper | Style |
| --- | --- |
| `btn.primary(id, label)` / `.primary()` | Blurple |
| `btn.secondary(id, label)` / `.secondary()` | Grey |
| `btn.success(id, label)` / `.success()` | Green |
| `btn.danger(id, label)` / `.danger()` | Red |
| `btn.link(url, label)` / `.link(url)` | URL button (no customId) |

Also: `.label()`, `.emoji()`, `.disabled()`, `.customId(id, { prefix?: true })`.

## Selects (same rows)

```ts
import { ActionRowBuilder, StringSelectBuilder } from '@nexora.ts/core';

const row = new ActionRowBuilder().add(
  new StringSelectBuilder()
    .customId('role-pick', { prefix: true })
    .placeholder('Choose a role')
    .option('Admin', 'admin')
    .option({ label: 'Moderator', value: 'mod', emoji: '🛡️' }),
);
```

Also available: `UserSelectBuilder`, `RoleSelectBuilder`, `ChannelSelectBuilder`, `MentionableSelectBuilder`.

## Related

- [ModalBuilder](modal-builder.md)
- [EmbedBuilder](embed-builder.md)
- [Builders guide](../guide/builders.md)
