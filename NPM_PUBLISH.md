# npm Publishing Guide (Nexora)

Du hast noch nie ein Framework veröffentlicht — hier ist der komplette Weg von 0 auf npm.

## Was landet auf npm?

| Package | npm-Name | Zweck |
| --- | --- | --- |
| `packages/config` | `@nexorajs/config` | `defineConfig()` |
| `packages/logger` | `@nexorajs/logger` | Logging |
| `packages/core` | `@nexorajs/core` | Bot, commands, events |
| `packages/database` | `@nexorajs/database` | Drizzle + repos |
| `packages/auth` | `@nexorajs/auth` | OAuth |
| `packages/api` | `@nexorajs/api` | REST API |
| `packages/plugin-system` | `@nexorajs/plugin-system` | Plugins |
| `packages/websocket` | `@nexorajs/websocket` | Live events |
| `packages/ui` | `@nexorajs/ui` | Dashboard-Komponenten |
| `packages/dev-server` | `@nexorajs/dev-server` | Studio-API |
| `packages/cli` | `create-nexorajs` | `npx create-nexorajs` / `nexora` |

**Nicht** auf npm: `apps/*` (Dashboard, Docs, Studio, Playground).

---

## Schritt 1 — npm-Account

1. https://www.npmjs.com/signup  
2. E-Mail bestätigen  
3. **2FA aktivieren** (Account → Two-Factor Authentication) — npm verlangt das oft beim Publish  

---

## Schritt 2 — Scope `@nexorajs` (Organisation)

Unsere Packages heißen `@nexorajs/...`. Dafür:

1. https://www.npmjs.com/org/create  
2. Organisation **`nexorajs`** anlegen (kostenlos für **öffentliche** Packages)  

Prüfen, ob schon etwas existiert:

```powershell
npm view @nexorajs/core
```

- **404 Not Found** → gut, Name ist frei  
- **Daten kommen** → Scope/Name schon belegt → anderen Org-Namen wählen und Package-Namen anpassen  

---

## Schritt 3 — Einloggen

```powershell
npm login
npm whoami
```

---

## Schritt 4 — Bauen & Dry-Run

```powershell
cd C:\Users\Raphael\Documents\Nexora
pnpm install
pnpm build
pnpm release:dry
```

`release:dry` lädt **nichts** hoch. Du solltest eine Liste der Packages sehen (`@nexorajs/core`, `create-nexorajs`, …).

---

## Schritt 5 — Erste echte Veröffentlichung (`0.1.0`)

```powershell
pnpm release
```

Das macht:

1. `pnpm build`  
2. `pnpm publish` für jedes Package unter `packages/` (Version `0.1.0`, access public)

Wenn 2FA an ist: **OTP** aus der Authenticator-App eingeben.

### Erfolg prüfen

```powershell
npm view @nexorajs/core version
npm view create-nexorajs version
```

Browser: https://www.npmjs.com/package/@nexorajs/core

---

## Schritt 6 — Als „fremder User“ testen

```powershell
cd C:\Users\Raphael\Documents
npx create-nexorajs@0.1.0 my-bot-test
```

Oder minimal:

```powershell
mkdir nexora-smoke && cd nexora-smoke
npm init -y
npm install @nexorajs/core@0.1.0 @nexorajs/config@0.1.0
```

---

## Spätere Releases (nach Features)

```powershell
pnpm changeset            # welche Packages? major/minor/patch + Text
pnpm version-packages     # Versionen in package.json schreiben
git add . && git commit -m "chore: release"
pnpm release              # build + publish
```

---

## Typische Fehler

| Meldung | Fix |
| --- | --- |
| `ENEEDAUTH` | `npm login` |
| `403` / scope | Org `@nexorajs` anlegen, Rechte prüfen |
| `OTP required` | 2FA-Code eingeben |
| `You cannot publish over existing version` | Version erhöhen (`pnpm changeset`) |
| `No files` / leeres Package | `pnpm build:packages` — `dist/` muss existieren |
| Package-Name taken | Scope/Name ändern |
| `spawn UNKNOWN` (turbo) | Bekannt unter Windows/Node 24 — Scripts nutzen `pnpm -r`, nicht Turbo |

---

## Checkliste

- [ ] `npm whoami` funktioniert  
- [ ] Org/Scope `@nexorajs` ist deiner  
- [ ] `pnpm build:packages` ok  
- [ ] `pnpm release:dry` sieht gut aus  
- [ ] Keine `.env` / Secrets in `packages/*/dist`  
- [ ] Danach: `npx create-nexorajs` testen  

Ausführliche Repo-Hinweise: [PUBLISHING.md](./PUBLISHING.md) (GitHub). Dieses File = **nur npm**.
