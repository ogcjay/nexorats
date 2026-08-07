# GitBook — Sidebar / alle Seiten anzeigen

**Öffentliche Docs:** [https://cjays-organization.gitbook.io/nexora.ts](https://cjays-organization.gitbook.io/nexora.ts)

GitBook zeigt **nur Seiten, die in `SUMMARY.md` stehen**. Die Datei ist das Inhaltsverzeichnis (linke Sidebar).

## Warum du nur die README siehst

Meist einer dieser Gründe:

1. **Project directory zeigt auf den Repo-Root** → GitBook nimmt die große Monorepo-`README.md`, nicht `apps/docs`
2. **`SUMMARY.md` ist nicht auf GitHub** (lokal ja, aber nicht gepusht)
3. Sync war eingerichtet, **bevor** `SUMMARY.md` existierte → alter Stand

## Fix (wichtig in dieser Reihenfolge)

### 1. Auf GitHub prüfen

Öffne im Browser:

https://github.com/ogcjay/nexorajs/blob/main/apps/docs/SUMMARY.md

- **404 / fehlt** → zuerst pushen (siehe unten)
- **Datei da** → weiter mit Schritt 2

### 2. Git Sync Project directory setzen

In GitBook:

1. Space → **Settings** (Zahnrad) → **Git Sync** / **Integrations**
2. **Project directory** / Content directory:  
   ```text
   apps/docs
   ```
   (nicht leer, nicht `.`, nicht `docs`)
3. Speichern
4. **Sync now** / neu synchronisieren (oder einen neuen Commit pushen)

### 3. Ergebnis

In der linken Sidebar solltest du Gruppen sehen:

- Home  
- Getting started → Introduction, Quick start, …  
- Core concepts  
- Platform  
- Packages  
- Community  

## Was steuert die Sidebar?

| Datei | Rolle |
| --- | --- |
| `apps/docs/SUMMARY.md` | **Alle** sichtbaren Seiten + Reihenfolge |
| `apps/docs/README.md` | Startseite („Home“) |
| `apps/docs/.gitbook.yaml` | Sagt GitBook: README + SUMMARY hier |

Neue Seite anlegen:

1. Markdown-Datei unter `apps/docs/guide/` oder `packages/` schreiben  
2. In `SUMMARY.md` verlinken, z. B. `* [Meine Seite](guide/meine-seite.md)`  
3. Commit + Push → GitBook Sync  

Ohne Eintrag in `SUMMARY.md` erscheint die Seite **nicht** in der Sidebar.

## Push (falls SUMMARY auf GitHub fehlt)

```powershell
cd C:\Users\Raphael\Documents\Nexora
git add apps/docs .gitbook.yaml GITBOOK.md
git commit -m "docs: GitBook SUMMARY and sync config"
git push
```

Dann in GitBook noch einmal **Sync**.

## Nicht im GitBook-Editor die Struktur kaputt machen

Solange Git Sync aktiv ist: Sidebar-Reihenfolge in **`SUMMARY.md` im Repo** ändern, nicht nur per Drag&Drop in GitBook (sonst überschreibt Sync sich gegenseitig).
