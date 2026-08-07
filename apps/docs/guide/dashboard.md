# Dashboard

> **Coming soon / Unreleased** — the public admin Dashboard is not part of the published `0.1.x` surface yet.

Nexora’s planned Dashboard is a Next.js admin UI for guild settings, modules, and logs. It is separate from **Nexora Studio** (the local Developer Center on `:3002`).

| | Nexora Studio (shipped) | Dashboard (unreleased) |
| --- | --- | --- |
| Role | Local Developer Center | Public admin UI |
| Typical URL | `http://localhost:3002` | TBD |
| With bot start? | Yes (`createDevServer` / scaffold) | Not yet |

Scaffolding with “Include experimental dashboard config?” only reserves `dashboard` / `auth` config and related backend packages. It does **not** ship a ready-to-open UI.

When `dashboard.enabled` is set, the startup banner shows a soft teaser (`experimental / unreleased — coming soon`) — not a promise that something is listening on `:3000`.

## Architecture (preview)

**All data will flow through the internal API.** The browser never opens a database connection. That rule already guides `@nexora.ts/api`, auth, and plugins.

Monorepo contributors: local UI work lives under `apps/dashboard` — see [CONTRIBUTING](https://github.com/ogcjay/nexorajs/blob/main/CONTRIBUTING.md). Public quick-starts should not treat Dashboard as production-ready.
