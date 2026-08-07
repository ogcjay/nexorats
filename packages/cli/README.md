# @nexora.ts/create

CLI entry point for the Nexora ecosystem. Scaffold a production-ready Discord bot (optional dashboard, Docker, CI, examples) in minutes.

```bash
npx @nexora.ts/create my-bot
```

Prompts for bot name, database, dashboard, Docker, linting, GitHub Actions, and examples.

Also ships the `nexora` binary (`nexora dev`, `nexora studio`, plugin commands — WIP).

Scaffolding a bot does **not** install `nexora` into the new project. Day-to-day: `pnpm dev`.

To use the CLI:

```bash
# One-off
npx -p @nexora.ts/create nexora dev

# Global
npm install -g @nexora.ts/create
nexora dev

# Or in the bot project
pnpm add -D @nexora.ts/create
pnpm exec nexora dev
```

## License

MIT
