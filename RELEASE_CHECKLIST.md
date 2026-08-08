# Release-Checkliste — Nexora erster öffentlicher Release

Kurz und praktisch. Ausführliche npm-Schritte: [NPM_PUBLISH.md](./NPM_PUBLISH.md). GitHub-Repo: [PUBLISHING.md](./PUBLISHING.md).  
Release-Text zum Einfügen: [`.github/RELEASE_v0.1.9.md`](./.github/RELEASE_v0.1.9.md)

**Vorschlag Tag / Title**

- Tag: `v0.1.9`
- Title: `Nexora v0.1.9 — The platform that revolutionizes Discord bot development`

---

## 1. Commit + Push

- [ ] Änderungen reviewen (keine `.env`, keine Tokens, keine Secrets)
- [ ] Release-Assets + Draft committen, z. B. `.github/RELEASE_v0.1.9.md`, `.github/release-assets/`
- [ ] `git push origin main` (oder Feature-Branch → PR → merge)

> Git war in der Agent-Umgebung nicht im PATH — lokal im normalen Terminal / Git Bash ausführen.

## 2. npm Login / Publish (nur wenn du wirklich publishen willst)

Packages **`@nexora.ts/core@0.1.9`** und **`@nexora.ts/create@0.1.9`** sind auf npm bereits sichtbar.  
`npm whoami` schlug in der Prep-Umgebung mit **401** fehl → vor erneutem Publish lokal einloggen.

```powershell
npm login
npm whoami
pnpm release:dry    # nichts hochladen — nur prüfen
pnpm release        # ECHTER Publish — nur wenn Versionen neu/erhöht sind
```

- [ ] `pnpm release:dry` sieht gut aus
- [ ] **Nicht** `pnpm release` ausführen, wenn die Versionen schon auf npm liegen (sonst `cannot publish over existing version`) — erst `changeset` / Version bumpen
- [ ] Optional smoke: `npx @nexora.ts/create@latest my-bot-smoke`

## 3. GitHub Release anlegen

- [ ] GitHub → **Releases** → **Draft a new release**
- [ ] Tag `v0.1.9` erstellen (Target: `main`)
- [ ] Title + Body aus `.github/RELEASE_v0.1.9.md` einfügen
- [ ] Bilder aus `.github/release-assets/` als Assets anhängen
- [ ] Image-URLs im Body ggf. auf Release-Download- oder `raw.githubusercontent.com`-Links umstellen
- [ ] Optional: Discord `/ping` → Pong Screenshot anhängen (`discord-ping-pong.png`)
- [ ] **Publish release** (Latest release)

## 4. Social Preview

- [ ] Repo → **Settings** → **General** → **Social preview**
- [ ] `.github/social-preview.png` / `.github/release-assets/social-preview.png` hochladen (falls noch nicht gesetzt)

## 5. Announce

- [ ] Discord / Twitter / LinkedIn / Freunde — Link zum GitHub Release + Docs
- [ ] Docs-Link: https://cjays-organization.gitbook.io/nexora.ts
- [ ] Quick Start betonen: `npx @nexora.ts/create@latest`

---

## Was der Agent nicht automatisieren konnte

| Item | Status |
| --- | --- |
| Studio Screenshots (Overview / Commands / Logs / Events) | ✅ Live + Docs-Assets unter `.github/release-assets/` |
| Pipelines-Screenshot | ❌ In der aktuell laufenden embedded Studio-UI nicht in der Nav |
| Discord Ping/Pong Chat-Screenshot | ❌ Kein Discord-Client / keine Message-Automation — bitte manuell |
| `pnpm release` (echter Publish) | ❌ Bewusst nicht ausgeführt; npm Auth lokal 401 |
| `git` commit/push/tag | ❌ `git` nicht im Agent-PATH — lokal machen |
