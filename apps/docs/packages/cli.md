# create-nexora.ts

CLI to scaffold a new Nexora bot project (Studio + `.env` ready).

```bash
npx create-nexora.ts@latest my-bot
cd my-bot
pnpm install
cp .env.example .env
pnpm dev
```

## What you get

- `dev` / `start` scripts with `--env-file=.env`
- `@nexora.ts/config` (auto `loadEnv`), core, logger, and **dev-server** for Studio
- Optional dashboard packages, Docker, linting, examples
- Example commands/events when selected

Prompts for bot name, database, dashboard, Docker, linting, GitHub Actions, and examples.

## `nexora` CLI

Installed alongside the scaffold tooling:

| Command | Description |
| --- | --- |
| `nexora dev` | Start bot + Nexora Studio (http://localhost:3002) |
| `nexora studio` | Studio UI only (API expected on `:3920`) |
| `nexora add` / `remove` / `list` | Plugin management (WIP) |

See [Quick start](../guide/quick-start.md) and [Nexora Studio](../guide/studio.md).
