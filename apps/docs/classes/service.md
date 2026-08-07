# Service

Base class for injectable helpers with a child logger. Use for tickets, moderation, economy, etc.

**Package:** `@nexorajs/core`

## Example

```ts
import { Service, registerService, type ServiceContext } from '@nexorajs/core';
import type { Nexora } from '@nexorajs/core';

export class TicketService extends Service {
  constructor(ctx: ServiceContext) {
    super(ctx);
  }

  async open(userId: string, reason: string) {
    this.logger.info('Opening ticket', { userId, reason });
    // DB / channel logic…
    return { id: 'ticket_1' };
  }
}

// After bot is constructed:
export function registerTicketService(bot: Nexora) {
  registerService(bot.container, 'TicketService', () =>
    new TicketService({ logger: bot.logger, container: bot.container }),
  );
}
```

## Resolve in a command

```ts
import { SlashCommand, type CommandContext } from '@nexorajs/core';
import type { TicketService } from '../services/tickets.js';

export default class TicketCommand extends SlashCommand {
  name = 'ticket';
  description = 'Open a support ticket';

  async execute(ctx: CommandContext) {
    const tickets = ctx.client /* or pass container via closure */;
    // Prefer resolving from bot.container in your app wiring:
    // const tickets = bot.container.resolve<TicketService>('TicketService');
    await ctx.reply('Ticket opened.');
  }
}
```

Typical pattern — register services at startup, resolve in command modules that receive `bot` or use a shared container export:

```ts
// src/index.ts
const bot = new Nexora({ config, commandsPath: './commands/**/*.ts', eventsPath: './events/**/*.ts' });
registerTicketService(bot);
await bot.start();
```

```ts
// commands/ticket.ts
import { bot } from '../bot.js'; // your shared instance
import type { TicketService } from '../services/tickets.js';

export default class TicketCommand extends SlashCommand {
  name = 'ticket';
  description = 'Open a ticket';

  async execute(ctx: CommandContext) {
    const tickets = bot.container.resolve<TicketService>('TicketService');
    await tickets.open(ctx.user.id, 'help');
    await ctx.reply('Ticket created.');
  }
}
```

## Related

- [Dependency injection](../guide/dependency-injection.md)
- [SlashCommand](slash-command.md)
