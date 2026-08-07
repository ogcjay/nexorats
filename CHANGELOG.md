# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source readiness: LICENSE, SECURITY, CoC, CI, issue/PR templates
- Community docs inviting plugins and ecosystem contributions
- Package READMEs for all framework packages

## [0.1.6] - 2026-08-07

### Added (`@nexora.ts/core`)

- Typed slash option helpers (`stringOpt`, `integerOpt`, …)
- Nested command groups / subgroups
- Command guards and middleware composition
- Autocomplete helpers and handler support

## [0.1.0] - 2026-08-06

### Added

- Initial monorepo scaffold (pnpm workspaces + Turborepo)
- Framework packages: core, config, logger, database, auth, api, plugin-system, websocket, ui, cli
- Apps: dashboard, docs, playground
- First public preview release
