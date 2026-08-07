# ModalBuilder

Build modals and text inputs for forms (reports, tickets, settings).

**Package:** `@nexora.ts/core`

## Example

```ts
import {
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  type CommandContext,
} from '@nexora.ts/core';

// Show modal from a command or button handler
export async function openReportModal(ctx: CommandContext) {
  const modal = new ModalBuilder()
    .customId('report', { prefix: true })
    .title('Report user')
    .add(
      new TextInputBuilder()
        .customId('target')
        .label('User ID or tag')
        .short()
        .required(),
      new TextInputBuilder()
        .customId('details')
        .label('Details')
        .paragraph()
        .required()
        .maxLength(1000),
    );

  await ctx.interaction.showModal(modal.toJSON());
}
```

## TextInputBuilder

| Method | Description |
| --- | --- |
| `.short()` / `.paragraph()` | Input style |
| `.label()` / `.placeholder()` | UI text |
| `.required()` / `.minLength()` / `.maxLength()` | Validation |
| `.value()` | Prefill |
| `.customId()` | Submit payload id |

## Handle submit

Listen for `interactionCreate` / modal submit in an event file (or plugin) and read `interaction.fields.getTextInputValue('details')`.

## Related

- [ButtonBuilder](button-builder.md)
- [Builders guide](../guide/builders.md)
