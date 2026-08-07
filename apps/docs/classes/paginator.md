# Paginator & prompts

One-shot UI helpers that cut Discord collector boilerplate — paginated embeds, yes/no confirms, and select prompts.

**Package:** `@nexora.ts/core`  
**Exports:** `Paginator` (alias of `EmbedPaginator`), `ConfirmDialog`, `ChoicePrompt`

---

## Paginator

### What it solves

Long help text, leaderboards, or item lists don’t fit in one Discord message. Without a helper you’d wire:

1. reply with embed + buttons  
2. `createMessageComponentCollector`  
3. prev/next index logic  
4. disable buttons on first/last page  
5. ignore other users’ clicks  
6. clear components on timeout  

`Paginator` does that in a few lines.

### How it works

```text
await paginator.send(ctx)
        │
        ▼
  Reply with page 0 + [Previous] [Next] [Stop]
        │
        ▼
  Collector listens for button clicks (author only)
        │
   ┌────┼────┐
   ▼    ▼    ▼
 Prev  Next  Stop / timeout
   │    │         │
   └────┴──► edit message to new page
              Stop/timeout → remove buttons
```

- **Previous / Next** — move between pages; disabled on first / last page  
- **Stop** — ends early and removes the buttons  
- **Timeout** (default 60s idle) — collector ends; buttons are cleared  
- **Author-only** — other users get an ephemeral “Only the command author…” reply  
- **Unique `customId`s** — each instance uses `nexora:pag:…` + a random suffix so two paginators don’t clash  

`send(ctx)` returns the `Message` when the collector finishes (stop, timeout, or error).

### Basic example (embeds)

```ts
import { Paginator, EmbedBuilder, command } from '@nexora.ts/core';

export default command({
  name: 'help',
  description: 'Show help pages',
  async execute(ctx) {
    const paginator = new Paginator({
      pages: [
        EmbedBuilder.info('Help · Getting started', 'Create a project with `npx @nexora.ts/create`…'),
        EmbedBuilder.info('Help · Commands', 'Put files in `commands/` — they auto-discover…'),
        EmbedBuilder.info('Help · Studio', 'Open http://localhost:3002 while `pnpm dev` runs…'),
      ],
    });

    await paginator.send(ctx);
  },
});
```

By default each embed footer gets `Page 1/3` (or `Your footer · Page 1/3` if a footer already exists). Turn that off with `pageFooter: false`.

### String pages

Pages can be plain strings instead of embeds:

```ts
const paginator = new Paginator({
  pages: [
    '**Page 1**\nWelcome to the bot.',
    '**Page 2**\nList of commands…',
    '**Page 3**\nSupport links…',
  ],
  ephemeral: true,
});

await paginator.send(ctx);
```

Mix types in one `pages` array only within one kind: all `string`, or all embeds (`EmbedBuilder` / `APIEmbed`) — not mixed.

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `pages` | `string[]` \| `EmbedBuilder[]` \| `APIEmbed[]` | — | **Required.** At least one page |
| `timeout` | `number` | `60_000` | Collector idle time in ms |
| `ephemeral` | `boolean` | `true` | Prefer ephemeral reply when sending via interaction |
| `prevLabel` | `string` | `'Previous'` | Previous button label |
| `nextLabel` | `string` | `'Next'` | Next button label |
| `stopLabel` | `string` | `'Stop'` | Stop button label |
| `userId` | `string` | command author | Who may click the buttons |
| `pageFooter` | `boolean` | `true` | Append `Page X/Y` to embed footers (embed pages only) |

### API surface

```ts
import { Paginator, EmbedPaginator } from '@nexora.ts/core';

const paginator = new Paginator({ pages: […] });
// same class:
const same = new EmbedPaginator({ pages: […] });

paginator.size;           // number of pages
await paginator.send(ctx); // Promise<Message>
```

`ctx` is any **prompt context**: a normal `CommandContext` works (`interaction` + `reply` / `followUp`). Same pattern as ConfirmDialog / ChoicePrompt.

### Tips

- Keep pages short — Discord embed limits still apply (description ~4096 chars, etc.)  
- For **persistent** panels that stay in a channel for everyone, use [ButtonHandler](button-handler.md) instead of a one-shot collector  
- Call `send` once per command invocation; don’t reuse the same instance across concurrent users (each `send` creates its own ids/collector)

---

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

  await ctx.followUp({ content: 'Deleted.', ephemeral: true });
}
```

Ephemeral by default. Uses buttons + a message collector; cleans up on end/timeout.

---

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

---

## When to use what

| Helper | Use when |
| --- | --- |
| `Paginator` | Long lists / multi-page embeds or text |
| `ConfirmDialog.ask` | Destructive or irreversible actions |
| `ChoicePrompt.ask` | Single pick from a short option list |

For persistent UI (panels that stay in a channel), prefer [interaction handlers](button-handler.md) instead of one-shot collectors.

## Related

- [EmbedBuilder](embed-builder.md)
- [ButtonBuilder](button-builder.md)
- [Interaction handlers](button-handler.md)
- [SlashCommand](slash-command.md)
