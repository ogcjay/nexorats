#!/usr/bin/env node
/**
 * Fail fast when someone runs npm/yarn in this pnpm monorepo.
 */
const ua = process.env.npm_config_user_agent ?? '';
const execPath = process.env.npm_execpath ?? '';

const isPnpm =
  ua.includes('pnpm') || /pnpm/i.test(execPath) || process.env.PNPM_SCRIPT_SRC_DIR !== undefined;

if (!isPnpm) {
  console.error(`
  ┌──────────────────────────────────────────────┐
  │  Nexora uses pnpm. Do not use npm or yarn.   │
  │                                              │
  │  Install:  npm install -g pnpm@9.15.0        │
  │  Then:     pnpm install                      │
  └──────────────────────────────────────────────┘
`);
  process.exit(1);
}
