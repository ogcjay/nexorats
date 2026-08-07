# Classes

Nexora’s builders (`command()`, `event()`, `plugin()`) stay fully supported. Classes are an **additive** style for larger bots — same discovery, clearer structure.

## Slash commands

```ts
import { SlashCommand, type CommandContext } from '@nexorajs/core';

export default class BanCommand extends SlashCommand {
  name = 'ban';
  description = 'Ban a member';
  guildOnly = true;
  adminOnly = true;
  cooldown = 10_000;

  async execute(ctx: CommandContext) {
    await ctx.reply('Banned.');
  }
}
```

`SlashCommand` / `BaseCommand` share the same fields as `command({…})`: `name`, `description`, `options`, guards (`guildOnly`, `adminOnly`, `permissions`, `cooldown`), and `execute`.

See [Commands](commands.md) for context helpers and guards.

## Events

```ts
import { EventHandler } from '@nexorajs/core';

export default class GuildMemberAdd extends EventHandler {
  name = 'guildMemberAdd' as const;

  async execute(member: import('discord.js').GuildMember) {
    // welcome logic
  }
}
```

## Services

Use `Service` for injectable helpers with a child logger:

```ts
import { Service } from '@nexorajs/core';

export class TicketService extends Service {
  async create(userId: string) {
    this.logger.info('Creating ticket', { userId });
    // …
  }
}

// register once
bot.container.registerSingleton('TicketService', () => new TicketService(bot.logger));
```

See [Dependency injection](dependency-injection.md).

## Plugins

```ts
import { NexoraPlugin, type PluginContext } from '@nexorajs/plugin-system';

export default class ModerationPlugin extends NexoraPlugin {
  manifest = {
    name: 'moderation',
    version: '1.0.0',
  };

  async onLoad(ctx: PluginContext) {
    ctx.logger.info('Moderation ready');
  }
}
```

See [Plugins](plugins.md).

## When to use which

| Style | Prefer when |
| --- | --- |
| `command()` / `event()` / `plugin()` | Small handlers, quick scripts, examples |
| Classes | Shared guards, DI, lifecycle (`onLoad` / `onUnload`), multi-file features |

Discovery loads **both** from the same glob paths — mix freely in one project.
