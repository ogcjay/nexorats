#!/usr/bin/env node

/**
 * Nexora CLI — project tooling
 *
 * `nexora dev` starts the local development stack for the current project:
 * - Bot process (tsx watch / npm run dev)
 * - Nexora Studio UI (localhost:3002)
 *
 * The Studio API is started by the bot via @nexora.ts/dev-server.
 *
 * Plugin marketplace (local npm):
 * - `nexora add <package>`    → pnpm add / npm install
 * - `nexora remove <package>`  → pnpm remove / npm uninstall
 * - `nexora list`              → ./plugins + matching dependencies
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DOCS_PLUGINS = 'https://cjays-organization.gitbook.io/nexora.ts/guide/plugins';
const DOCS_STUDIO = 'https://cjays-organization.gitbook.io/nexora.ts/guide/studio';
const STUDIO_URL = 'http://localhost:3002';
const STUDIO_API = 'http://127.0.0.1:3920';

/** npm package name: optional @scope/, then package id (npm naming rules) */
const NPM_PACKAGE_RE =
  /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/** Heuristic for deps that look like Nexora plugins (excludes @nexora.ts/plugin-system) */
function isPluginLikeDependency(name: string): boolean {
  if (name === '@nexora.ts/plugin-system') return false;
  if (/(?:^|\/)nexora[-.]?plugin[-.]/i.test(name)) return true;
  if (/^@nexora\.ts\/plugin-/i.test(name)) return true;
  return false;
}

const command = process.argv[2];
const arg = process.argv[3];
const cwd = process.cwd();

switch (command) {
  case 'add':
    await handleAdd(arg);
    break;

  case 'remove':
    await handleRemove(arg);
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

function isValidNpmPackageName(name: string): boolean {
  if (!name || name.length > 214) return false;
  if (name.startsWith('.') || name.startsWith('_')) return false;
  return NPM_PACKAGE_RE.test(name);
}

function ensureBotProject(): void {
  if (!existsSync(resolve(cwd, 'package.json'))) {
    console.error('\n  ❌ No package.json in the current directory.');
    console.error('     Run this from your bot project root (after create-nexora-ts).\n');
    process.exit(1);
  }
}

function detectPackageManager(): 'pnpm' | 'npm' {
  if (existsSync(resolve(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
}

/**
 * Run pnpm/npm with streaming stdio. Returns exit code.
 */
function runInstallCommand(
  action: 'add' | 'remove',
  packageName: string,
): Promise<number> {
  const pm = detectPackageManager();
  const args =
    pm === 'pnpm'
      ? [action === 'add' ? 'add' : 'remove', packageName]
      : [action === 'add' ? 'install' : 'uninstall', packageName];

  console.log(`\n  → ${pm} ${args.join(' ')}\n`);

  return new Promise((resolveExit) => {
    const child = spawn(pm, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
    child.on('error', (err) => {
      console.error(`\n  ❌ Failed to run ${pm}: ${err.message}\n`);
      resolveExit(1);
    });
    child.on('exit', (code) => resolveExit(code ?? 1));
  });
}

function printRegisterHint(packageName: string): void {
  console.log(`
  Next steps — register the plugin with @nexora.ts/plugin-system:

    1. Ensure the package is listed in your bot config \`plugins\` (if used)
    2. Load it via PluginLoader (local ./plugins or node_modules)

    Example:

      import { PluginLoader } from '@nexora.ts/plugin-system';

      const loader = new PluginLoader(bot, bot.logger);
      await loader.loadAll({
        pluginsPath: './plugins',
        enabledPlugins: config.plugins,
      });

  Package installed: ${packageName}
  Docs: ${DOCS_PLUGINS}
`);
}

async function handleAdd(pluginName: string | undefined): Promise<void> {
  if (!pluginName) {
    console.error('Usage: nexora add <package>');
    console.error('  Example: nexora add @scope/nexora-plugin-tickets');
    process.exit(1);
  }

  if (!isValidNpmPackageName(pluginName)) {
    console.error(`\n  ❌ Invalid npm package name: ${pluginName}`);
    console.error('     Use a valid name, e.g. my-plugin or @scope/my-plugin\n');
    process.exit(1);
  }

  ensureBotProject();

  console.log(`
  nexora add ${pluginName}

  Installing from the npm registry into this bot project…
`);

  const code = await runInstallCommand('add', pluginName);
  if (code !== 0) {
    console.error(`\n  ❌ Install failed (exit ${code}).\n`);
    process.exit(code);
  }

  console.log(`\n  ✓ Installed ${pluginName}`);
  printRegisterHint(pluginName);
}

async function handleRemove(pluginName: string | undefined): Promise<void> {
  if (!pluginName) {
    console.error('Usage: nexora remove <package>');
    process.exit(1);
  }

  if (!isValidNpmPackageName(pluginName)) {
    console.error(`\n  ❌ Invalid npm package name: ${pluginName}\n`);
    process.exit(1);
  }

  ensureBotProject();

  console.log(`
  nexora remove ${pluginName}

  Uninstalling from this bot project…
`);

  const code = await runInstallCommand('remove', pluginName);
  if (code !== 0) {
    console.error(`\n  ❌ Uninstall failed (exit ${code}).\n`);
    process.exit(code);
  }

  console.log(`
  ✓ Removed ${pluginName}

  If you still reference it in config.plugins or PluginLoader, remove that entry.
  Local folders under ./plugins/ are not deleted — remove them manually if needed.

  Docs: ${DOCS_PLUGINS}
`);
}

function readPackageDeps(): string[] {
  const pkgPath = resolve(cwd, 'package.json');
  if (!existsSync(pkgPath)) return [];

  try {
    const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = new Set<string>();
    for (const key of Object.keys(raw.dependencies ?? {})) names.add(key);
    for (const key of Object.keys(raw.devDependencies ?? {})) names.add(key);
    return [...names].sort();
  } catch {
    return [];
  }
}

function listLocalPluginDirs(): string[] {
  const pluginsDir = resolve(cwd, 'plugins');
  if (!existsSync(pluginsDir)) return [];

  return readdirSync(pluginsDir)
    .filter((name) => {
      if (name.startsWith('.')) return false;
      try {
        return statSync(join(pluginsDir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function handleList(): void {
  const local = listLocalPluginDirs();
  const deps = readPackageDeps().filter(isPluginLikeDependency);

  console.log('\n  Nexora plugins\n');

  console.log('  Local (./plugins)');
  if (local.length === 0) {
    console.log('    (none)');
  } else {
    for (const name of local) {
      console.log(`    • ${name}`);
    }
  }

  console.log('\n  npm dependencies (plugin-like names)');
  if (deps.length === 0) {
    console.log('    (none matching nexora-plugin- / @nexora.ts/plugin-*)');
  } else {
    for (const name of deps) {
      console.log(`    • ${name}`);
    }
  }

  console.log(`
  Install:   nexora add <package>
  Uninstall: nexora remove <package>
  Docs:      ${DOCS_PLUGINS}
`);
}

function printHelp(): void {
  console.log(`
  Nexora CLI

  Usage:
    nexora dev              Start bot + Nexora Studio (Developer Center)
    nexora studio           Start only Nexora Studio UI (expects API on :3920)
    nexora add <package>    Install a plugin package from npm
    nexora remove <package> Uninstall a plugin package
    nexora list             List ./plugins and matching npm deps

  Local ports (typical):
    Nexora Studio    ${STUDIO_URL}   (auto with nexora dev / createDevServer)
    Studio API       ${STUDIO_API}

  Studio = local Developer OS for THIS project
  (events, commands, API, database, config, performance, plugins…).
  Docs: ${DOCS_STUDIO}
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
  const pm = detectPackageManager();

  children.push(
    spawn(pm, ['run', 'dev'], {
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
  const pm = detectPackageManager();

  if (existsSync(monorepoStudio)) {
    return spawn(pm, ['--filter', '@nexora.ts/studio', 'dev'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
  }

  if (existsSync(nestedStudio)) {
    return spawn(pm, ['exec', 'vite', '--port', '3002'], {
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
