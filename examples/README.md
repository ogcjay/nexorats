# Examples

Runnable examples for Nexora.

| Example               | Description                       |
| --------------------- | --------------------------------- |
| See `apps/playground` | Full demo bot inside the monorepo |

Standalone example packages will be added under this folder.

## Running the playground

```bash
# from repo root
cp .env.example apps/playground/.env
# set DISCORD_TOKEN + DISCORD_CLIENT_ID
pnpm --filter @nexora.ts/playground dev
```
