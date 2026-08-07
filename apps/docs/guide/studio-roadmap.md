# Studio roadmap

Nexora Studio is the local **Developer Operating System** for your bot. This page maps the P0–P3 phases to Studio OS capabilities and what you can rely on today.

For day-to-day usage (ports, `createDevServer`, CLI), see [Nexora Studio](studio.md).

## Studio OS capabilities

| Area | Intent |
| --- | --- |
| Live Events | Inspect listeners and middleware as they run |
| Commands | Live command explorer for this process |
| API | Explore internal HTTP routes |
| Database | Connection status and data viewer |
| Config | Runtime config with redaction + hot reload |
| Performance | Latency / hot-path analyzer |
| Plugin Graph | Loaded plugins, deps, health |
| Errors & Metrics | Logs, failures, uptime |

## P0 — Foundations (Available in Studio)

**Goal:** Inspect the live bot without leaving the terminal + browser.

| Capability | Status |
| --- | --- |
| Event Inspector (live handler tree + timing) | Available in Studio |
| Middleware Pipeline Viewer | Available in Studio |
| Command Explorer (live metrics) | Available in Studio |

Also available: Overview metrics, plugin list, sanitized config, log buffer, embedded UI via `@nexora.ts/dev-server`.

## P1 — Runtime depth (Available)

**Goal:** Understand *how* work moves through the process.

| Capability | Status |
| --- | --- |
| Performance Analyzer | Available in Studio |
| Context system (`ctx.logger`, `ctx.cache`, `ctx.container`, `ctx.services`) | Available in `@nexora.ts/core` |

See [Commands](commands.md) and [Dependency injection](dependency-injection.md).

## P2 — Live platform tools (Available)

**Goal:** Operate config, API, and database from Studio.

| Capability | Status |
| --- | --- |
| Live Config (allowlisted hot patch) | Available in Studio |
| API Explorer | Available in Studio |
| DB Viewer (read-only / opt-in adapter) | Available in Studio |

## P3 — Plugin marketplace & graph (Available)

**Goal:** Treat plugins as first-class packages in the Developer OS.

| Capability | Status |
| --- | --- |
| Plugin marketplace (local npm install) | Available via CLI + Studio Plugins tab |
| Dependency graph / health in Studio | Available in Studio |

Install from the project root:

```bash
nexora add <package>      # pnpm add or npm install
nexora remove <package>
nexora list               # ./plugins + plugin-like deps
```

After install, load with `@nexora.ts/plugin-system` — see [Plugins](plugins.md).

## Honest snapshot

| Layer | What ships now |
| --- | --- |
| Studio UI | Overview, Commands, Events (Inspector), Pipelines, Plugins (Install / Deps), Performance, Graph, API, Database, Config, Logs, Docs |
| Studio API | Snapshot + logs + telemetry routes (`apiVersion` `0.3`) |
| Core | Command/event instrumentation + `studioTelemetry` + richer `CommandContext` |
| CLI | `nexora dev` / `studio` + npm plugin `add` / `remove` / `list` |

Studio stays local (`localhost:3002`). Secrets stay redacted; DB queries never accept client SQL; config PUT is allowlisted only.
