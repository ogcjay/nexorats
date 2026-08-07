# SlashCommandGroup & ContextMenuCommand

Group slash subcommands under one top-level command, and define user/message context menus.

**Package:** `@nexora.ts/core`

## Beginner — `group()` factory

```ts
import { SlashCommand, group, type CommandContext } from '@nexora.ts/core';

class CreateSub extends SlashCommand {
  name = 'create';
  description = 'Open a ticket';
  async execute(ctx: CommandContext) {
    await ctx.success('Ticket created.');
  }
}

class CloseSub extends SlashCommand {
  name = 'close';
  description = 'Close your ticket';
  async execute(ctx: CommandContext) {
    await ctx.reply('Ticket closed.');
  }
}

// Pass class constructors — group() instantiates them
export default group('ticket', 'Ticket system', [CreateSub, CloseSub], {
  guildOnly: true,
});
```

Users run `/ticket create` and `/ticket close`.

## Class style

```ts
import { SlashCommand, SlashCommandGroup, type CommandContext } from '@nexora.ts/core';

class CreateSub extends SlashCommand {
  name = 'create';
  description = 'Open a ticket';

  async execute(ctx: CommandContext) {
    await ctx.reply('Ticket created.');
  }
}

class CloseSub extends SlashCommand {
  name = 'close';
  description = 'Close your ticket';
  guildOnly = true;

  async execute(ctx: CommandContext) {
    await ctx.reply('Ticket closed.');
  }
}

export default class TicketGroup extends SlashCommandGroup {
  name = 'ticket';
  description = 'Ticket system';
  commands = [new CreateSub(), new CloseSub()];
}
```

### Fields

| Field | Description |
| --- | --- |
| `name` | Top-level slash command name |
| `description` | Top-level description |
| `commands` | Array of `SlashCommand` instances (subcommand name = `command.name`) |

Also: `subcommands(CreateCmd, CloseCmd)` to instantiate class constructors.

Discovery registers the group as one chat-input command with subcommand options. Runtime routing calls the matching child’s `execute`.

## ContextMenuCommand

Right-click / Apps menu commands for users or messages.

```ts
import { ContextMenuCommand, type ContextMenuContext } from '@nexora.ts/core';

export default class UserInfoMenu extends ContextMenuCommand {
  name = 'User info';
  type = 'user' as const;

  async execute(ctx: ContextMenuContext) {
    const user = ctx.targetUser;
    await ctx.success(`${user?.tag} · \`${user?.id}\``);
  }
}
```

```ts
export default class ReportMessage extends ContextMenuCommand {
  name = 'Report message';
  type = 'message' as const;

  async execute(ctx: ContextMenuContext) {
    const msg = ctx.targetMessage;
    await ctx.reply({
      content: `Reported message ${msg.id}`,
      ephemeral: true,
    });
  }
}
```

### Fields & context

| Field / helper | Description |
| --- | --- |
| `name` | Menu label (shown in Discord) |
| `type` | `'user'` or `'message'` |
| `execute(ctx)` | Handler |
| `ctx.targetUser` | Target user (`type: 'user'`) |
| `ctx.targetMessage` | Target message (`type: 'message'`) |
| `ctx.reply` / `success` / `defer` / … | Same style as slash `CommandContext` |

Deployed as Application Command type User / Message alongside slash commands.

## Related

- [SlashCommand](slash-command.md)
- [Commands guide](../guide/commands.md)
- [Nexora](nexora.md)
