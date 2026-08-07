# npm Publishing Guide (Nexora)

Du hast noch nie ein Framework veröffentlicht — hier ist der komplette Weg von 0 auf npm.

## Was landet auf npm?

| Package | npm-Name | Zweck |
| --- | --- | --- |
| `packages/config` | `@nexora.ts/config` | `defineConfig()` |
| `packages/logger` | `@nexora.ts/logger` | Logging |
| `packages/core` | `@nexora.ts/core` | Bot, commands, events |
| `packages/database` | `@nexora.ts/database` | Drizzle + repos |
| `packages/auth` | `@nexora.ts/auth` | OAuth |
| `packages/api` | `@nexora.ts/api` | REST API |
| `packages/plugin-system` | `@nexora.ts/plugin-system` | Plugins |
| `packages/websocket` | `@nexora.ts/websocket` | Live events |
| `packages/ui` | `@nexora.ts/ui` | Dashboard-Komponenten |
| `packages/dev-server` | `@nexora.ts/dev-server` | Studio-API |
| `packages/cli` | `create-nexora.ts` | `npx create-nexora.ts` / `nexora` |

**Nicht** auf npm: `apps/*` (Dashboard, Docs, Studio, Playground).

---

## Schritt 1 — npm-Account

1. https://www.npmjs.com/signup  
2. E-Mail bestätigen  
3. **2FA aktivieren** (Account → Two-Factor Authentication) — npm verlangt das oft beim Publish  

---

## Schritt 2 — Scope `@nexora.ts` (Organisation)

Unsere Packages heißen `@nexora.ts/...`. Dafür:

1. https://www.npmjs.com/org/create  
2. Organisation **`nexora.ts`** anlegen (kostenlos für **öffentliche** Packages)  

Prüfen, ob schon etwas existiert:

```powershell
npm view @nexora.ts/core
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

`release:dry` lädt **nichts** hoch. Du solltest eine Liste der Packages sehen (`@nexora.ts/core`, `create-nexora.ts`, …).

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
npm view @nexora.ts/core version
npm view create-nexora.ts version
```

Browser: https://www.npmjs.com/package/@nexora.ts/core

---

## Schritt 6 — Als „fremder User“ testen

```powershell
cd C:\Users\Raphael\Documents
npx create-nexora.ts@0.1.0 my-bot-test
```

Oder minimal:

```powershell
mkdir nexora-smoke && cd nexora-smoke
npm init -y
npm install @nexora.ts/core@0.1.0 @nexora.ts/config@0.1.0
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
| `403` / scope | Org `@nexora.ts` anlegen, Rechte prüfen |
| `OTP required` | 2FA-Code eingeben |
| `You cannot publish over existing version` | Version erhöhen (`pnpm changeset`) |
| `No files` / leeres Package | `pnpm build:packages` — `dist/` muss existieren |
| Package-Name taken | Scope/Name ändern |
| `spawn UNKNOWN` (turbo) | Bekannt unter Windows/Node 24 — Scripts nutzen `pnpm -r`, nicht Turbo |

---

## Checkliste

- [ ] `npm whoami` funktioniert  
- [ ] Org/Scope `@nexora.ts` ist deiner  
- [ ] `pnpm build:packages` ok  
- [ ] `pnpm release:dry` sieht gut aus  
- [ ] Keine `.env` / Secrets in `packages/*/dist`  
- [ ] Danach: `npx create-nexora.ts` testen  

Ausführliche Repo-Hinweise: [PUBLISHING.md](./PUBLISHING.md) (GitHub). Dieses File = **nur npm**.
