# EventHandler

Abstract base class for Discord.js client events. Same discovery as `event()` / `on()` / `onReady()` — export `default` from a file under `events/`.

**Package:** `@nexora.ts/core`

## Beginner (shortest path)

```ts
import { onReady } from '@nexora.ts/core';

export default onReady((client) => {
  console.log(`Logged in as ${client.user.tag}`);
});
```

```ts
import { on } from '@nexora.ts/core';

export default on('messageCreate', async (message) => {
  if (message.content === 'ping') await message.reply('pong');
});
```

## Class style

```ts
import { EventHandler } from '@nexora.ts/core';
import type { Client } from 'discord.js';

export default class ReadyHandler extends EventHandler<'ready'> {
  name = 'ready' as const;
  once = true;

  execute(client: Client) {
    client.user?.setActivity('Nexora', { type: 3 });
  }
}
```

## Typed event args

`name` is a Discord.js `ClientEvents` key. `execute` receives the matching argument list — full autocomplete in the IDE.

```ts
import { EventHandler } from '@nexora.ts/core';
import type { GuildMember } from 'discord.js';

export default class WelcomeHandler extends EventHandler<'guildMemberAdd'> {
  name = 'guildMemberAdd' as const;

  async execute(member: GuildMember) {
    const channel = member.guild.systemChannel;
    if (!channel) return;
    await channel.send(`Welcome, ${member}!`);
  }
}
```

## Fields

| Field | Description |
| --- | --- |
| `name` | Discord.js event name (`'ready'`, `'messageCreate'`, …) |
| `once` | If `true`, listen with `client.once` (default: `false`) |
| `execute(…)` | Handler — args match `ClientEvents[name]` |

## vs `event()` / `on()` / `onReady()`

```ts
// Still valid — same runtime
export default event('ready', (client) => {
  client.user?.setActivity('Nexora', { type: 3 });
}, true);
```

Prefer `onReady` / `on` for the shortest beginner path, `EventHandler` when you want typed args or shared base classes.

## Related

- [Events guide](../guide/events.md)
- [SlashCommand](slash-command.md)
- [Nexora](nexora.md)
