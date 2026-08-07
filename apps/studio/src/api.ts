export interface StudioPluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  commands: number;
  events: number;
}

export interface StudioSnapshot {
  bot: {
    phase: string;
    online: boolean;
    tag: string | null;
    guilds: number;
    uptimeMs: number | null;
    startedAt: string | null;
  };
  commands: { name: string; description: string; source?: string; guildOnly?: boolean }[];
  events: { name: string; once?: boolean; source?: string }[];
  plugins: StudioPluginInfo[];
  config: Record<string, unknown>;
  database: { connected: boolean; provider?: string; message?: string };
  meta: {
    studio: true;
    apiVersion: string;
    ports: { studio: number; api: number };
  };
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
}

export async function fetchSnapshot(): Promise<StudioSnapshot> {
  const res = await fetch('/api/studio/snapshot');
  if (!res.ok) {
    throw new Error(`Studio API unavailable (${res.status}). Start the bot with the DevServer.`);
  }
  return res.json() as Promise<StudioSnapshot>;
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const res = await fetch('/api/studio/logs');
  if (!res.ok) return [];
  return res.json() as Promise<LogEntry[]>;
}

export function formatUptime(ms: number | null): string {
  if (ms == null) return '—';
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}
