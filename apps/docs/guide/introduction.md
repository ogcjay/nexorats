# Introduction

**Nexora** is a modern open-source TypeScript framework for Discord bots.

It gives you a **complete foundation** — CLI, command system, plugin system, authentication, database, API, logging, and Studio — so you can focus on your bot’s actual features instead of wiring libraries together. A public **Dashboard** is planned (unreleased).

## Why Nexora exists

Most Discord projects stitch together Discord.js, an ORM, an OAuth flow, a dashboard, and custom glue. That works — until every bot reinvents the same stack.

Nexora aims to be the shared platform:

| Building block | What you get |
| --- | --- |
| **CLI** | `create-nexora-ts@latest` scaffolds a project with Studio + `.env` |
| **Commands & events** | Typed helpers or classes + auto-discovery + guards |
| **Plugins** | Manifest or `NexoraPlugin` class — extend without forking core |
| **Studio** | Local Developer Center (`localhost:3002`) |
| **Dashboard** | *Coming soon* — guild settings, modules, logs (unreleased) |
| **Auth** | Discord OAuth, sessions, permissions |
| **Database** | Drizzle + repositories |
| **API + WebSocket** | Internal API and live updates |
| **Logging** | Pretty / compact / json console, banner, command traces |

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
