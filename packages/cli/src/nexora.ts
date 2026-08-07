#!/usr/bin/env node

/**
 * Nexora CLI — project tooling
 *
 * `nexora dev` starts the local development stack for the current project:
 * - Bot process (tsx watch / npm run dev)
 * - Nexora Studio UI (localhost:3002)
 *
 * The Studio API is started by the bot via @nexora.ts/dev-server.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DOCS_PLUGINS = 'https://cjays-organization.gitbook.io/nexora.ts/guide/plugins';
const STUDIO_URL = 'http://localhost:3002';
const STUDIO_API = 'http://127.0.0.1:3920';

const command = process.argv[2];
const arg = process.argv[3];
const cwd = process.cwd();

switch (command) {
  case 'add':
    handleAdd(arg);
    break;

  case 'remove':
    handleRemove(arg);
    break;

  case 'list':
    handleList();
    break;

  case 'dev':
    await runDev();
    break;

  case 'studio':
    await runStudioOnly();
    break;

  default:
    printHelp();
}

function handleAdd(pluginName: string | undefined): void {
  if (!pluginName) {
    console.error('Usage: nexora add <plugin-name>');
    process.exit(1);
  }

  console.log(`
  nexora add ${pluginName}

  Remote plugin install is not available yet.
  For now, place a local plugin under ./plugins/${pluginName}/
  and load it with @nexora.ts/plugin-system.

  Docs: ${DOCS_PLUGINS}
`);
}

function handleRemove(pluginName: string | undefined): void {
  if (!pluginName) {
    console.error('Usage: nexora remove <plugin-name>');
    process.exit(1);
  }

  console.log(`
  nexora remove ${pluginName}

  Remote plugin uninstall is not available yet.
  Remove the folder ./plugins/${pluginName}/ manually if it is a local plugin.

  Docs: ${DOCS_PLUGINS}
`);
}

function handleList(): void {
  const pluginsDir = resolve(cwd, 'plugins');

  console.log('\n  Local plugins (./plugins)\n');

  if (!existsSync(pluginsDir)) {
    console.log('  (no plugins/ folder — create one or scaffold a new project)\n');
    console.log(`  Docs: ${DOCS_PLUGINS}\n`);
    return;
  }

  const entries = readdirSync(pluginsDir).filter((name) => {
    if (name.startsWith('.')) return false;
    try {
      return statSync(join(pluginsDir, name)).isDirectory();
    } catch {
      return false;
    }
  });

  if (entries.length === 0) {
    console.log('  (empty — add folders under ./plugins)\n');
  } else {
    for (const name of entries) {
      console.log(`  • ${name}`);
    }
    console.log('');
  }

  console.log(`  Registry install via \`nexora add\` coming later.`);
  console.log(`  Docs: ${DOCS_PLUGINS}\n`);
}

function printHelp(): void {
  console.log(`
  Nexora CLI

  Usage:
    nexora dev              Start bot + Nexora Studio (Developer Center)
    nexora studio           Start only Nexora Studio UI (expects API on :3920)
    nexora add <plugin>     Install a plugin (coming soon — see docs)
    nexora remove <plugin>  Remove a plugin (coming soon)
    nexora list             List local ./plugins folders

  Local ports (typical):
    Nexora Studio    ${STUDIO_URL}   (auto with nexora dev / createDevServer)
    Studio API       ${STUDIO_API}
    Dashboard        experimental / unreleased — coming soon

  Studio = local Developer Center for THIS project (commands, plugins, logs…).
  Dashboard = upcoming public admin UI (not published yet).
  Public docs: https://cjays-organization.gitbook.io/nexora.ts
`);
}

async function runDev(): Promise<void> {
  const pkgPath = resolve(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('\n  ❌ No package.json in the current directory.');
    console.error('     Run this from your bot project root (after create-nexora-ts).\n');
    process.exit(1);
  }

  const envPath = resolve(cwd, '.env');
  if (!existsSync(envPath)) {
    console.warn('  ⚠️  No .env found. Copy .env.example → .env and set DISCORD_TOKEN.\n');
  }

  const studio = spawnStudio({ quiet: true });
  // When Vite UI is available, CLI owns :3002. Otherwise the bot's createDevServer
  // serves an embedded UI automatically (do not set NEXORA_STUDIO).
  const cliOwnsUi = Boolean(studio);

  console.log(`
  🚀 Nexora Dev

  Starting:
    • Bot + Studio API   (pnpm run dev / createDevServer on :3920)
    • Nexora Studio UI   ${cliOwnsUi ? STUDIO_URL + ' (Vite)' : STUDIO_URL + ' (embedded via createDevServer)'}

  Open Studio once ready:
    ${STUDIO_URL}
`);

  const children: ChildProcess[] = [];

  children.push(
    spawn(pnpmOrNpm(), ['run', 'dev'], {
      cwd,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ...(cliOwnsUi ? { NEXORA_STUDIO: '1', NEXORA_STUDIO_URL: STUDIO_URL } : {}),
      },
    }),
  );

  if (studio) {
    children.push(studio);
    console.log(`  ✓ Studio UI process started → ${STUDIO_URL}\n`);
  } else {
    console.log(
      `  ✓ Studio UI will be served by @nexora.ts/dev-server on ${STUDIO_URL}\n` +
        `    (install @nexora.ts/studio or run from the monorepo for the Vite UI)\n`,
    );
  }

  const shutdown = () => {
    console.log('\n  Shutting down Nexora Dev…\n');
    for (const child of children) {
      child.kill('SIGINT');
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function runStudioOnly(): Promise<void> {
  console.log(`
  Starting Nexora Studio UI → ${STUDIO_URL}
  Expects Studio API at ${STUDIO_API} (start your bot with createDevServer).
`);
  const child = spawnStudio({ quiet: false });
  if (!child) {
    console.error(
      '  ❌ Could not locate @nexora.ts/studio.\n' +
        '     Tip: with recent @nexora.ts/dev-server, `pnpm dev` already serves\n' +
        '     an embedded Studio UI at ' +
        STUDIO_URL +
        ' — no separate UI process needed.\n' +
        '     From the monorepo: pnpm --filter @nexora.ts/studio dev\n',
    );
    process.exit(1);
  }
  child.on('exit', (code) => process.exit(code ?? 0));
}

function spawnStudio(options: { quiet?: boolean } = {}): ChildProcess | null {
  // Prefer monorepo studio app when developing Nexora itself
  const monorepoStudio = resolve(cwd, 'apps/studio/package.json');
  const nestedStudio = resolve(cwd, 'node_modules/@nexora.ts/studio/package.json');

  if (existsSync(monorepoStudio)) {
    return spawn(pnpmOrNpm(), ['--filter', '@nexora.ts/studio', 'dev'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
  }

  if (existsSync(nestedStudio)) {
    return spawn(pnpmOrNpm(), ['exec', 'vite', '--port', '3002'], {
      cwd: resolve(cwd, 'node_modules/@nexora.ts/studio'),
      stdio: 'inherit',
      shell: true,
    });
  }

  if (!options.quiet) {
    console.warn(
      '  ⚠️  @nexora.ts/studio not found next to this project.\n' +
        '     With @nexora.ts/dev-server ≥0.1.3, createDevServer serves an embedded UI.\n',
    );
  }
  return null;
}

function pnpmOrNpm(): string {
  return 'pnpm';
}
