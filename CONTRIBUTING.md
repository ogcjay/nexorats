# Contributing to Nexora

Thanks for helping grow the Nexora ecosystem!

Nexora is an open-source TypeScript framework for Discord bots. We welcome contributions to **core**, **docs**, **dashboard**, and especially **plugins** — that is how the community ecosystem grows.

## Code of Conduct

By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

| Area                | Examples                                      |
| ------------------- | --------------------------------------------- |
| **Core / packages** | Bug fixes, APIs, DX improvements              |
| **Plugins**         | Tickets, moderation, leveling, custom modules |
| **Dashboard / UI**  | Internal admin experiments (`apps/dashboard`) |
| **Docs & examples** | Guides, recipes, playground demos             |
| **CLI / tooling**   | Scaffolding, `nexora add`, templates          |

Ideas and questions: open a [Feature request](../../issues/new/choose) or start a Discussion after the repo is public.

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** 9.15+ (`npm install -g pnpm@9.15.0`)
- **Git**

> This monorepo is **pnpm-only**. Do not use `npm` or `yarn` in the project root.

## Development Setup

```bash
git clone https://github.com/ogcjay/nexorajs.git
cd nexora
pnpm install
pnpm build
pnpm dev
```

| App       | URL                   |
| --------- | --------------------- |
| Studio    | http://localhost:3002 |
| Docs      | http://localhost:3001 |
| Dashboard | http://localhost:3000 (monorepo / internal only) |

> Public docs highlight **Nexora Studio**. Internal dashboard work: `pnpm --filter @nexora.ts/dashboard dev` (contributors only).

## Project Structure

| Path         | Purpose                                                 |
| ------------ | ------------------------------------------------------- |
| `packages/`  | Framework packages (`core`, `plugin-system`, `auth`, …) |
| `apps/`      | Studio, docs, playground (+ internal dashboard)         |
| `examples/`  | Example projects                                        |
| `templates/` | CLI templates                                           |

## Workflow

1. Fork the repo and create a branch: `feat/…`, `fix/…`, `plugin/…`, or `docs/…`
2. Keep PRs focused (one concern)
3. Run checks:

```bash
pnpm build
pnpm typecheck
pnpm format:check
```

4. Open a pull request using the PR template

## Building a plugin

Plugins extend Nexora without changing core. Typical layout:

```
my-plugin/
  plugin.json
  commands/
  events/
  dashboard/
  api/
  migrations/
  config/
```

A plugin can:

- Register commands and events
- Add dashboard pages
- Expose API routes
- Ship migrations and config
- Register services via DI

Document your plugin’s options and permissions so others can reuse it.

## Code Standards

- TypeScript **strict** mode
- SOLID + Clean Architecture
- Dependency Injection via `Container` (no global singletons)
- Repository pattern for database access
- Dashboard talks **only** to the internal API (never to the DB directly)
- Prefer event-driven design over polling
- No magic strings — use shared constants / enums
- Keep public APIs typed; avoid `any`

## Adding a Package

1. Create `packages/<name>/` with `package.json`, `src/`, `tsconfig.json`, `tsconfig.build.json`
2. Export the public API from `src/index.ts`
3. Use workspace protocol: `"@nexora.ts/foo": "workspace:*"`
4. Add a package `README.md` with examples

## Reporting Bugs / Features

Use the GitHub issue templates. For security issues, see [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
