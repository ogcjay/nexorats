#!/usr/bin/env node

/**
 * Nexora CLI — project tooling
 *
 * `nexora dev` starts the local development stack for the current project:
 * - Bot process (tsx watch / npm run dev)
 * - Nexora Studio UI (localhost:3002)
 *
 * The Studio API is started by the bot via @nexorajs/dev-server.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const command = process.argv[2];
const arg = process.argv[3];
const cwd = process.cwd();

switch (command) {
  case 'add':
    if (!arg) {
      console.error('Usage: nexora add <plugin-name>');
      process.exit(1);
    }
    console.log(`Adding plugin: ${arg}`);
    console.log('Plugin installation will be available in a future release.');
    break;

  case 'remove':
    if (!arg) {
      console.error('Usage: nexora remove <plugin-name>');
      process.exit(1);
    }
    console.log(`Removing plugin: ${arg}`);
    break;

  case 'list':
    console.log('Installed plugins: (none)');
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

function printHelp(): void {
  console.log(`
  Nexora CLI

  Usage:
    nexora dev              Start bot + Nexora Studio (Developer Center)
    nexora studio           Start only Nexora Studio UI (expects API on :3920)
    nexora add <plugin>     Install a plugin (coming soon)
    nexora remove <plugin>  Remove a plugin
    nexora list             List installed plugins

  Local ports (typical):
    Dashboard        http://localhost:3000
    Nexora Studio    http://localhost:3002
    Studio API       http://127.0.0.1:3920

  Studio is a local Developer Center for THIS project (commands, plugins, logs…).
  Public docs are hosted on GitHub Pages — not the same thing.
`);
}

async function runDev(): Promise<void> {
  console.log(`
  🚀 Nexora Dev

  Bot + Studio API  (from your project)
  Nexora Studio UI  http://localhost:3002
`);

  const children: ChildProcess[] = [];

  const botScript = resolve(cwd, 'package.json');
  if (!existsSync(botScript)) {
    console.error('No package.json in current directory. Run from your bot project root.');
    process.exit(1);
  }

  children.push(
    spawn(pnpmOrNpm(), ['run', 'dev'], {
      cwd,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NEXORA_STUDIO: '1' },
    }),
  );

  const studio = spawnStudio();
  if (studio) children.push(studio);

  const shutdown = () => {
    for (const child of children) {
      child.kill('SIGINT');
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function runStudioOnly(): Promise<void> {
  console.log('Starting Nexora Studio UI on http://localhost:3002 …');
  const child = spawnStudio();
  if (!child) {
    console.error('Could not locate @nexorajs/studio. From the monorepo run: pnpm --filter @nexorajs/studio dev');
    process.exit(1);
  }
  child.on('exit', (code) => process.exit(code ?? 0));
}

function spawnStudio(): ChildProcess | null {
  // Prefer monorepo studio app when developing Nexora itself
  const monorepoStudio = resolve(cwd, 'apps/studio/package.json');
  const nestedStudio = resolve(cwd, 'node_modules/@nexorajs/studio/package.json');

  if (existsSync(monorepoStudio)) {
    return spawn(pnpmOrNpm(), ['--filter', '@nexorajs/studio', 'dev'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
  }

  if (existsSync(nestedStudio)) {
    return spawn(pnpmOrNpm(), ['exec', 'vite', '--port', '3002'], {
      cwd: resolve(cwd, 'node_modules/@nexorajs/studio'),
      stdio: 'inherit',
      shell: true,
    });
  }

  console.warn(
    '⚠️  @nexorajs/studio not found next to this project. Start it manually:\n   pnpm --filter @nexorajs/studio dev\n',
  );
  return null;
}

function pnpmOrNpm(): string {
  return 'pnpm';
}
