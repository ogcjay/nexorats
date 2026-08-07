# Docs hosting (contributors)

Public docs live in `apps/docs/**/*.md` and can be published two ways from the **same source**:

| Host | How |
| --- | --- |
| **GitBook** | Git Sync → directory `apps/docs` (see [GITBOOK.md](../../GITBOOK.md)) |
| **GitHub Pages** | VitePress + `.github/workflows/docs.yml` |

## GitHub Pages

Live URL (after Pages is enabled): https://ogcjay.github.io/nexorajs/

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions
3. Push to `main` (or run “Deploy Docs” manually)

If the repo name changes, update:

- `DOCS_BASE` in `.github/workflows/docs.yml`
- `base` in `apps/docs/.vitepress/config.ts`
- Badge + URL in the root `README.md`

## Local VitePress preview

```bash
pnpm docs:dev
```
