# Documentation

Public docs are a **VitePress** site in `apps/docs`, deployed automatically to **GitHub Pages**.

Readers use the hosted site — they do **not** need to run a docs server.

| | |
| --- | --- |
| **Live URL** | https://nexorajs.github.io/nexora/ |
| **Source** | `apps/docs/**/*.md` |
| **Workflow** | `.github/workflows/docs.yml` |

## Enable GitHub Pages (once)

After the first push to GitHub:

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions
3. Merge/push to `main` (or run the “Deploy Docs” workflow manually)

If your GitHub user/org is not `nexorajs`, update:

- `DOCS_BASE` in `.github/workflows/docs.yml` (usually `/<repo-name>/`)
- `base` / links in `apps/docs/.vitepress/config.ts`
- Badge + URL in the root `README.md`

## Local preview (contributors only)

```bash
pnpm docs:dev
```

Opens a local VitePress preview. Production still comes from GitHub Pages.
