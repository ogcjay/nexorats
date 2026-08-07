# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source readiness: LICENSE, SECURITY, CoC, CI, issue/PR templates
- Community docs inviting plugins and ecosystem contributions
- Package READMEs for all framework packages

### Dashboard (unreleased)

- Next.js Dashboard app (`apps/dashboard`, `@nexora.ts/dashboard`) — **private / not published**
- Shared UI kit (`@nexora.ts/ui`) — **private / not published** until Dashboard ships
- Experimental `dashboard.enabled` config reserved for upcoming wiring (banner soft-teases only)

## [0.1.3] - 2026-08-07 — Studio UI + create

### Changed (`@nexora.ts/dev-server@0.1.3`)

- Redesigned embedded Studio UI (layout, command detail, richer API `0.2` payload)
- Studio DX: `createDevServer` serves UI on `:3002` so `pnpm dev` needs no second terminal
- Banner treats Studio and Dashboard as separate concerns (Dashboard remains unreleased)

### Changed (`@nexora.ts/create@0.1.9`)

- Scaffold pins `@nexora.ts/dev-server` to `^0.1.3` so new bots get the redesigned Studio

## [0.1.6] - 2026-08-07

### Added (`@nexora.ts/core`)

- Typed slash option helpers (`stringOpt`, `integerOpt`, …)
- Nested command groups / subgroups
- Command guards and middleware composition
- Autocomplete helpers and handler support

## [0.1.0] - 2026-08-06

### Added

- Initial monorepo scaffold (pnpm workspaces + Turborepo)
- Framework packages: core, config, logger, database, auth, api, plugin-system, websocket, cli
- Apps: docs, playground (Dashboard app exists in-repo but is unreleased)
- First public preview release
