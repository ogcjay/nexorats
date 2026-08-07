# Introduction

**Nexora** is a modern open-source TypeScript **application framework** for Discord bots — built on [Discord.js](https://discord.js.org).

Nexora isn’t just a framework — **it ships with its own local Developer Operating System**. After `pnpm dev`, open **Nexora Studio** at `http://localhost:3002` and inspect *your* commands, plugins, logs, and config. Handlers work through a shared `ctx` (reply helpers today; logger/services rolling out) so you spend less time wiring services by hand.

Think of the relationship like **Next.js → React**: Discord.js is the library; Nexora is the opinionated platform on top so you never wire the same stack from scratch again.

![Nexora Studio — Overview](../images/studio-overview.png)

## Why Nexora exists

Most Discord projects stitch together Discord.js, an ORM, an OAuth flow, and custom glue. That works — until every bot reinvents the same stack.

Nexora aims to be the shared platform: scaffold once, ship features.

## Nexora vs Discord.js

Discord.js is the foundation. Nexora does **not** replace it — it packages the application layer developers rebuild on every project.

| Feature | Discord.js | Nexora |
| --- | :---: | :---: |
| Discord API client | ✅ | ✅ (via Discord.js) |
| Project CLI / scaffold | ❌ | ✅ |
| Local Developer OS (Studio) | ❌ | ✅ |
| Plugin system | ❌ | ✅ |
| Auto-discovery (commands / events) | ❌ | ✅ |
| Typed `defineConfig()` | ❌ | ✅ |
| Structured logging + startup banner | ❌ | ✅ |
| Auth / database / internal API | DIY | ✅ (optional packages) |

The memorable outcome after install:

> *I never have to set up a Discord bot project from scratch again.*

## What you get today

| Building block | What you get |
| --- | --- |
| **CLI** | `create-nexora-ts@latest` scaffolds a project with Studio + `.env` |
| **Studio** | Local Developer OS (`localhost:3002`) — commands, events, plugins, logs, status |
| **Commands & events** | Typed helpers or classes + auto-discovery + guards |
| **Plugins** | Manifest or `NexoraPlugin` class — extend without forking core |
| **Auth** | Discord OAuth, sessions, permissions |
| **Database** | Drizzle + repositories |
| **API + WebSocket** | Internal API and live updates |
| **Logging** | Pretty / compact / json console, banner, command traces |

![CLI scaffold](../images/cli-scaffold.png)

## Open source & community

Nexora is **MIT licensed** and hosted on GitHub so developers can:

1. **Use** it for free
2. **Extend** it with plugins
3. **Improve** core, docs, and DX
4. **Share** plugins and grow a common ecosystem

This documentation is published for everyone via **GitBook** (and optionally GitHub Pages) — you do not need to run a docs server to read it.

## Status

Early preview (`0.1.x`). APIs may change before `1.0.0`. Feedback and contributions are welcome.

On bot start, Nexora can notify you when a newer `@nexora.ts/core` is on npm — see [Updating packages](quick-start.md#updating-nexora-packages).
