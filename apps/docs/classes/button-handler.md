# Interaction handlers

First-class handlers for buttons, selects, and modals — no giant `interactionCreate` switch. Put files under `interactions/` (default glob `./interactions/**/*.ts`).

**Package:** `@nexora.ts/core`

## Beginner — functional factories

```ts
import { button } from '@nexora.ts/core';

export default button('delete:confirm', async (ctx) => {
  await ctx.update('Deleted.');
});
```

```ts
import { select } from '@nexora.ts/core';

export default select('roles:pick', async (ctx) => {
  await ctx.update(`Selected: ${ctx.values.join(', ')}`);
});
```

```ts
import { modal } from '@nexora.ts/core';

export default modal('feedback:submit', async (ctx) => {
  await ctx.success(`Thanks! (${ctx.getField('body').length} chars)`);
});
```

## ButtonHandler (class)

```ts
import { ButtonHandler, type ComponentContext } from '@nexora.ts/core';

export default class DeleteConfirm extends ButtonHandler {
  customId = 'delete:confirm'; // or /delete:.+/

  async execute(ctx: ComponentContext) {
    await ctx.update('Deleted.');
  }
}
```

| Field | Description |
| --- | --- |
| `customId` | Exact string or `RegExp` |
| `execute(ctx)` | Runs when a matching button is clicked |

## StringSelectHandler

```ts
import { StringSelectHandler, type ComponentContext } from '@nexora.ts/core';

export default class RolePick extends StringSelectHandler {
  customId = 'roles:pick';

  async execute(ctx: ComponentContext) {
    const values = ctx.interaction.values;
    await ctx.update(`Selected: ${values.join(', ')}`);
  }
}
```

## ModalHandler

```ts
import { ModalHandler, type ModalContext } from '@nexora.ts/core';

export default class FeedbackModal extends ModalHandler {
  customId = 'feedback:submit';

  async execute(ctx: ModalContext) {
    const text = ctx.interaction.fields.getTextInputValue('body');
    await ctx.reply({ content: `Thanks! (${text.length} chars)`, ephemeral: true });
  }
}
```

## Context helpers

`ComponentContext` / `ModalContext` mirror command helpers:

| Helper | Description |
| --- | --- |
| `ctx.reply(…)` | Reply to the interaction |
| `ctx.success` / `error` / `warn` / `info` | Colored embeds (ephemeral by default) |
| `ctx.update(…)` | Update the message (components) |
| `ctx.defer()` / `ctx.deferUpdate()` | Defer reply or update |
| `ctx.editReply()` / `ctx.followUp()` | Deferred / follow-up flows |
| `ctx.interaction` | Raw discord.js interaction |
| `ctx.user` / `ctx.guild` / `ctx.member` | Shortcuts |

Builders with `toJSON()` work the same way as in commands.

## customId matching

| Style | Example |
| --- | --- |
| Exact | `customId = 'delete:confirm'` |
| RegExp | `customId = /^delete:.+/` |
| Prefix | Builders may use `nexora:` — matching can strip that namespace |

Wire buttons/selects/modals with the same `customId` you set on the handler (via [ButtonBuilder](button-builder.md) / [ModalBuilder](modal-builder.md)).

## Discovery

```ts
const bot = new Nexora({
  config,
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
  interactionsPath: './interactions/**/*.ts', // default
});
```

Export `default class` or `default button(…)` from each file. Nexora discovers handlers, registers them, and attaches a single interaction listener.

## Project layout

```
my-bot/
├── commands/
├── events/
├── interactions/          # Button / Select / Modal handlers
│   ├── delete-confirm.ts
│   ├── role-pick.ts
│   └── feedback-modal.ts
└── src/index.ts
```

## Related

- [ButtonBuilder](button-builder.md)
- [ModalBuilder](modal-builder.md)
- [Paginator / ConfirmDialog](paginator.md)
- [Commands](../guide/commands.md)
