# Introduction

**Nexora** is the open-source TypeScript **platform** that revolutionizes how Discord bots are built — CLI, Studio, plugins, and auto-discovery in one coherent stack.

Nexora isn’t another bot template — **it’s the platform Discord developers have been missing.** After `pnpm dev`, open **Nexora Studio** at `http://localhost:3002` and inspect *your* commands, plugins, logs, and config. Handlers work through a shared `ctx` (reply helpers today; logger/services rolling out) so you spend less time wiring services by hand.

Production-ready from minute one — so you never wire the same Discord bot stack from scratch again.

![Nexora Studio — Overview](../images/studio-overview.png)

## Why Nexora exists

Most Discord projects stitch together an API client, an ORM, an OAuth flow, and custom glue. That works — until every bot reinvents the same stack.

Nexora is the shared platform the Discord bot scene has been missing: scaffold once, ship features, grow together.

## Nexora vs a typical DIY bot stack

From-scratch Discord projects spend weeks on scaffolding. Nexora ships the application platform developers rebuild on every project.

| Feature | From-scratch Discord project | Nexora |
| --- | :---: | :---: |
| Discord API compatibility | ✅ (you wire it) | ✅ |
| Project CLI / scaffold | ❌ / copy-paste | ✅ |
| Local Developer OS (Studio) | ❌ | ✅ |
| Plugin system | DIY | ✅ |
| Auto-discovery (commands / events) | DIY | ✅ |
| Typed `defineConfig()` | DIY | ✅ |
| Structured logging + startup banner | DIY | ✅ |
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

Community chat, FAQs, and support: [Discord](https://discord.gg/fHbCrdHnms) (maintainer: **ogcjay**).

This documentation is published for everyone via **GitBook** (and optionally GitHub Pages) — you do not need to run a docs server to read it.

## Status

Early preview (`0.1.x`). APIs may change before `1.0.0`. Feedback and contributions are welcome.

On bot start, Nexora can notify you when a newer `@nexora.ts/core` is on npm — see [Updating packages](quick-start.md#updating-nexora-packages).
