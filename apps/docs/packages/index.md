# Packages

Monorepo packages that make up Nexora. Start with **`@nexora.ts/core`** for bots; pull in the others as you need Studio, API, auth, or plugins.

| Package | Role |
| --- | --- |
| [@nexora.ts/core](core.md) | Bot client, commands, events, builders, DI, cache |
| [@nexora.ts/config](config.md) | `defineConfig()`, typed env / bot settings |
| [@nexora.ts/logger](logger.md) | Pretty / compact / JSON console + traces |
| [@nexora.ts/database](database.md) | Drizzle + repositories |
| [@nexora.ts/auth](auth.md) | Discord OAuth, sessions, permissions |
| [@nexora.ts/api](api.md) | Internal REST API |
| [@nexora.ts/plugin-system](plugin-system.md) | Plugin lifecycle & discovery |
| [@nexora.ts/websocket](websocket.md) | Live updates |
| [@nexora.ts/ui](ui.md) | Dashboard React components (**unreleased**) |
| [create-nexora-ts](cli.md) | Project scaffold CLI |

Guides: [Configuration](../guide/configuration.md) · [Plugins](../guide/plugins.md) · [Classes](../classes/index.md)
