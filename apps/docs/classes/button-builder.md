# ButtonBuilder & ActionRowBuilder

Interactive buttons and action rows as plain API objects (`toJSON()`).

**Package:** `@nexora.ts/core`

## Buttons in a row

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
    new ButtonBuilder().label('Docs').link('https://cjays-organization.gitbook.io/nexora.ts/'),
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
| `.primary()` | Blurple |
| `.secondary()` | Grey |
| `.success()` | Green |
| `.danger()` | Red |
| `.link(url)` | URL button (no customId) |

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
