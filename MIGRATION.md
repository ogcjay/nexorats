# Migration: `@nexorajs` / `@nexorats` → `@nexora.ts`

Nexora’s npm scope is **`@nexora.ts`** (TypeScript branding). The product name **Nexora** is unchanged.

## What changed

| Old | New |
| --- | --- |
| `@nexorajs/*` / `@nexorats/*` | `@nexora.ts/*` |
| `create-nexorajs` / `create-nexorats` | `@nexora.ts/create` |
| GitHub | `ogcjay/nexorajs` (repo name; npm org is separate) |
| GitBook | Space slug as you configure (e.g. `nexora.ts`) |

Framework-internal `nexora:` customId prefixes are unchanged.

## Update an existing project

```bash
pnpm remove @nexorajs/core @nexorats/core # …any old scopes you used
pnpm add @nexora.ts/core @nexora.ts/config @nexora.ts/logger

# Or after editing package.json:
pnpm update "@nexora.ts/*"
```

Replace imports:

```ts
// before
import { Nexora, command } from '@nexorajs/core';

// after
import { Nexora, command } from '@nexora.ts/core';
```

Scaffold CLI:

```bash
npx @nexora.ts/create@latest my-bot
```

> **Note:** Unscoped names like `create-nexora.ts` / `create-nexora-ts` are blocked by npm (file extension / name similarity). The official CLI is the scoped package **`@nexora.ts/create`** (bins: `create-nexora-ts`, `nexora`).

## First publish under `@nexora.ts`

1. Ensure you are logged in: `npm whoami`
2. Org **`nexora.ts`** exists on npm
3. From the monorepo:

```bash
pnpm build:packages
pnpm release
```

## Deprecation of old scopes

Optionally deprecate previous packages:

```bash
npm deprecate "@nexorajs/core" "Moved to @nexora.ts/core — see MIGRATION.md"
npm deprecate "@nexorats/core" "Moved to @nexora.ts/core — see MIGRATION.md"
# …repeat for other packages / create-* CLIs
```
