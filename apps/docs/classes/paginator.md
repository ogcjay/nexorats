# Paginator & prompts

UI helpers that cut collector boilerplate — paginated embeds, yes/no confirms, and select prompts.

**Package:** `@nexora.ts/core`

## Paginator

Send multi-page content with prev / next / stop buttons. Works with a `CommandContext`-like object (`interaction`, `reply`, `followUp`, optional `channel`).

```ts
import { Paginator, EmbedBuilder, type CommandContext } from '@nexora.ts/core';

async function showHelp(ctx: CommandContext) {
  const paginator = new Paginator({
    pages: [
      EmbedBuilder.info('Help · 1/3', 'Getting started…'),
      EmbedBuilder.info('Help · 2/3', 'Commands…'),
      EmbedBuilder.info('Help · 3/3', 'Plugins…'),
    ],
    // pages can also be string[] or APIEmbed[]
  });

  await paginator.send(ctx);
}
```

| Option | Description |
| --- | --- |
| `pages` | `string[]` \| `EmbedBuilder[]` \| `APIEmbed[]` |
| ephemeral | Prefer ephemeral collectors when replying to interactions |

Buttons use unique `nexora:` customIds per instance so multiple paginators don’t collide. Components are cleared on stop or timeout.

## ConfirmDialog

Ask for a yes/no confirmation. Returns `boolean`.

```ts
import { ConfirmDialog, type CommandContext } from '@nexora.ts/core';

async function deleteThing(ctx: CommandContext) {
  const ok = await ConfirmDialog.ask(ctx, {
    title: 'Delete?',
    description: 'Cannot undo',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    timeout: 30_000,
  });

  if (!ok) {
    await ctx.followUp({ content: 'Cancelled.', ephemeral: true });
    return;
  }

  // … delete …
  await ctx.followUp({ content: 'Deleted.', ephemeral: true });
}
```

Ephemeral by default. Uses buttons + a message collector; cleans up on end/timeout.

## ChoicePrompt

Ask the user to pick one value from a string select. Returns `string | null` (null on timeout/cancel).

```ts
import { ChoicePrompt, type CommandContext } from '@nexora.ts/core';

async function pickRole(ctx: CommandContext) {
  const value = await ChoicePrompt.ask(ctx, {
    placeholder: 'Pick a role',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'Mod', value: 'mod' },
      { label: 'Member', value: 'member' },
    ],
    timeout: 60_000,
  });

  if (value == null) {
    await ctx.followUp({ content: 'No choice made.', ephemeral: true });
    return;
  }

  await ctx.followUp({ content: `You picked \`${value}\``, ephemeral: true });
}
```

## When to use what

| Helper | Use when |
| --- | --- |
| `Paginator` | Long lists / multi-page embeds |
| `ConfirmDialog.ask` | Destructive or irreversible actions |
| `ChoicePrompt.ask` | Single pick from a short option list |

For persistent UI (panels that stay in a channel), prefer [interaction handlers](button-handler.md) instead of one-shot collectors.

## Related

- [EmbedBuilder](embed-builder.md)
- [ButtonBuilder](button-builder.md)
- [Interaction handlers](button-handler.md)
- [SlashCommand](slash-command.md)
