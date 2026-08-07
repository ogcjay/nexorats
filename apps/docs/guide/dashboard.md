# Dashboard (internal)

This page is for monorepo contributors. The **public** Developer Center is **[Nexora Studio](studio.md)** (`localhost:3002`).

`apps/dashboard` holds experimental admin UI work. It is **not** part of the published `0.1.x` docs surface and should not be promised in quick starts.

| | Nexora Studio (shipped) | `apps/dashboard` (internal) |
| --- | --- | --- |
| Role | Local Developer Center | Experimental admin UI |
| Typical URL | `http://localhost:3002` | Local only when developing the monorepo |
| With bot start? | Yes (`createDevServer` / scaffold) | No |

Scaffolding may still reserve `dashboard` / `auth` config keys for future work. That does **not** ship a ready-to-open public UI.

**All data flows through the internal API.** The browser never opens a database connection.

See [CONTRIBUTING](https://github.com/ogcjay/nexorajs/blob/main/CONTRIBUTING.md).
