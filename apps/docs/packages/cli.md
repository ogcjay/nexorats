# @nexora.ts/create

CLI to scaffold a new Nexora bot project (Studio + `.env` ready).

```bash
npx @nexora.ts/create@latest my-bot
cd my-bot
pnpm install
cp .env.example .env
pnpm dev
```

## What you get

- `dev` / `start` scripts with `--env-file=.env`
- `@nexora.ts/config` (auto `loadEnv`), core, logger, and **dev-server** for Studio
- Optional Docker, linting, examples
- Example commands/events when selected

![CLI scaffold](../images/cli-scaffold.png)

Prompts for bot name, database, Docker, linting, GitHub Actions, and examples.

## `nexora` CLI (optional)

The same package (`@nexora.ts/create`) also ships the `nexora` binary. Scaffolding a bot does **not** install that binary into the new project — after `create`, day-to-day development uses **`pnpm dev`**.

Use `nexora` only if you want the helper CLI (`dev`, `studio`, plugin commands).

### Make `nexora` available

| Method | Commands |
| --- | --- |
| One-off via npx | `npx -p @nexora.ts/create nexora dev` |
| Global | `npm install -g @nexora.ts/create` → then `nexora …` |
| Project devDependency | `pnpm add -D @nexora.ts/create` → `pnpm exec nexora …` |

Always run from the **bot project root** (directory with `package.json`).

### Commands

| Command | Description |
| --- | --- |
| `nexora dev` | Runs `pnpm run dev` / `npm run dev` (bot + Studio API). Starts Vite Studio UI when `@nexora.ts/studio` is available; otherwise relies on the embedded UI from `@nexora.ts/dev-server` on `:3002`. |
| `nexora studio` | Studio UI only (API expected on `:3920`) |
| `nexora add` / `remove` / `list` | Plugin management (WIP) |

See [Quick start](../guide/quick-start.md) and [Nexora Studio](../guide/studio.md).
