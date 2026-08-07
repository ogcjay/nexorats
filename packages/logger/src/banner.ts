import type { StartupBannerOptions } from './types.js';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GREEN = '\x1b[32m';

/**
 * Prints a compact, colorful startup banner to stdout.
 * Optional for Core — call after login / discovery when ready.
 */
export function printStartupBanner(options: StartupBannerOptions): void {
  const { name, version, userTag, commands, events, studioUrl, dashboardUrl } = options;

  const rows: Array<[string, string]> = [];
  rows.push(['name', name]);
  rows.push(['version', `v${version.replace(/^v/, '')}`]);
  if (userTag) rows.push(['user', userTag]);
  if (commands !== undefined) rows.push(['commands', String(commands)]);
  if (events !== undefined) rows.push(['events', String(events)]);
  if (studioUrl) rows.push(['studio', studioUrl]);
  // Dashboard is a separate Next.js app — never imply the bot started it.
  if (dashboardUrl) rows.push(['dashboard', `${dashboardUrl} (start separately)`]);

  const labelWidth = Math.max(...rows.map(([k]) => k.length));
  const contentWidths = rows.map(([k, v]) => 2 + labelWidth + 2 + v.length);
  const headerVisible = 2 + 'Nexora'.length + 2 + 'discord framework'.length;
  const width = Math.max(42, headerVisible, ...contentWidths);
  const line = '─'.repeat(width);

  console.log('');
  console.log(`${CYAN}${BOLD}  ┌${line}┐${RESET}`);
  console.log(
    `${CYAN}${BOLD}  │${RESET}  ${MAGENTA}${BOLD}Nexora${RESET}  ${DIM}discord framework${RESET}${' '.repeat(Math.max(0, width - headerVisible))}${CYAN}${BOLD}│${RESET}`,
  );
  console.log(`${CYAN}${BOLD}  ├${line}┤${RESET}`);

  for (const [label, value] of rows) {
    const paddedLabel = label.padEnd(labelWidth);
    const content = `  ${DIM}${paddedLabel}${RESET}  ${GREEN}${value}${RESET}`;
    const visibleLen = 2 + labelWidth + 2 + value.length;
    const pad = Math.max(0, width - visibleLen);
    console.log(`${CYAN}${BOLD}  │${RESET}${content}${' '.repeat(pad)}${CYAN}${BOLD}│${RESET}`);
  }

  console.log(`${CYAN}${BOLD}  └${line}┘${RESET}`);
  console.log('');
}
