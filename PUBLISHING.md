# Publishing Nexora to GitHub

This repository is prepared as a **public open-source TypeScript framework** for Discord bots (CLI, commands, plugins, dashboard, auth, and more). Follow these steps to put it on GitHub.

## 1. Install Git (Windows)

Git is required. If `git` is not found in your terminal:

```powershell
winget install --id Git.Git -e --source winget
```

Close and reopen the terminal, then verify:

```powershell
git --version
```

Optional but recommended:

```powershell
winget install --id GitHub.cli -e --source winget
gh auth login
```

## 2. Choose your GitHub identity

Default URLs in this repo use the placeholder org **`nexorajs/nexora`**.

If your user/org is different, update:

| File                                | Fields                                   |
| ----------------------------------- | ---------------------------------------- |
| `package.json`                      | `homepage`, `repository.url`, `bugs.url` |
| `README.md`                         | CI badge URLs                            |
| `.github/ISSUE_TEMPLATE/config.yml` | Security / Discussions links             |
| `SECURITY.md`                       | Contact email                            |

## 3. Create the GitHub repository

1. Create a new **public** repository named `nexora` (or your preferred name)
2. **Do not** initialize with README / LICENSE / .gitignore on GitHub (this repo already has them)
3. Leave it empty for the first push

## 4. First commit & push

```powershell
cd C:\Users\Raphael\Documents\Nexora

git init
git add .
git status   # confirm: no .env, no node_modules, no secrets
git commit -m "chore: initial public preview of the Nexora framework"

git branch -M main
git remote add origin https://github.com/<YOUR_USER_OR_ORG>/nexora.git
git push -u origin main
```

With GitHub CLI (creates + pushes):

```powershell
gh repo create nexora --public --source=. --remote=origin --push
```

## 5. After the first push

- Enable **Issues**, **Discussions**, and **Security advisories**
- Protect `main` (require CI to pass)
- Confirm [.github/workflows/ci.yml](./.github/workflows/ci.yml) runs green
- **Docs (GitHub Pages):** Settings → Pages → Source = **GitHub Actions**
  - Workflow: `.github/workflows/docs.yml`
  - Live URL: `https://<user-or-org>.github.io/nexora/`
  - If your repo/org name differs from `nexorajs/nexora`, update `DOCS_BASE` and README badge links
- Invite contributors via [CONTRIBUTING.md](./CONTRIBUTING.md) — plugins especially welcome
- Confirm [apps/docs](./apps/docs) deploys via Pages (readers never need a local docs server)

## Pre-push checklist

- [ ] `pnpm install` works
- [ ] `pnpm build` succeeds
- [ ] `pnpm format:check` succeeds (optional locally, required in CI)
- [ ] No secrets (`.env` is gitignored; use `.env.example`)
- [ ] `LICENSE` (MIT), README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT present
- [ ] Repository URLs match your GitHub user/org

## What this project is (for the GitHub About blurb)

Suggested short description:

> Open-source TypeScript framework for Discord bots — CLI, commands, plugins, dashboard, and auth so developers can focus on features.
