export interface StudioPluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  commands: number;
  events: number;
}

export interface StudioCommandOption {
  name: string;
  description: string;
  type: string;
  required?: boolean;
  autocomplete?: boolean;
  choices?: number;
}

export interface StudioCommandInfo {
  name: string;
  description: string;
  type: 'slash' | 'group' | 'context-user' | 'context-message' | 'message';
  source?: string;
  guildOnly?: boolean;
  adminOnly?: boolean;
  cooldownMs?: number | null;
  optionsCount: number;
  options: StudioCommandOption[];
  guardsCount: number;
  subcommands?: number;
  aliases?: string[];
}

export interface StudioSnapshot {
  bot: {
    phase: string;
    online: boolean;
    tag: string | null;
    id: string | null;
    guilds: number;
    uptimeMs: number | null;
    startedAt: string | null;
  };
  commands: StudioCommandInfo[];
  events: { name: string; once?: boolean; source?: string }[];
  plugins: StudioPluginInfo[];
  config: Record<string, unknown>;
  database: { connected: boolean; provider?: string; message?: string };
  meta: {
    studio: true;
    apiVersion: string;
    ports: { studio: number; api: number };
    ui?: 'embedded' | 'external' | 'none';
    counts?: {
      commands: number;
      slash: number;
      groups: number;
      contextMenus: number;
      messageCommands: number;
      events: number;
      plugins: number;
    };
  };
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
}

export type LiveConnectionState = 'live' | 'reconnecting' | 'offline';

export interface StudioWsMessage {
  type: string;
  payload?: unknown;
  timestamp?: string;
}

export async function fetchSnapshot(): Promise<StudioSnapshot> {
  const res = await fetch('/api/studio/snapshot');
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = `: ${body.error}`;
    } catch {
      /* ignore */
    }
    throw new Error(`Studio API unavailable (${res.status})${detail}. Start the bot with the DevServer.`);
  }
  return res.json() as Promise<StudioSnapshot>;
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const res = await fetch('/api/studio/logs');
  if (!res.ok) return [];
  return res.json() as Promise<LogEntry[]>;
}

/** Resolve Studio WebSocket URL (same origin `/ws`, proxied to API). */
export function studioWebSocketUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

export type StudioLiveHandlers = {
  onState?: (state: LiveConnectionState) => void;
  onSnapshot?: (snapshot: StudioSnapshot) => void;
  onLogs?: (logs: LogEntry[]) => void;
  onError?: (message: string) => void;
};

/**
 * Connect to Studio live WebSocket with exponential backoff reconnect.
 * Returns a dispose function.
 */
export function connectStudioLive(handlers: StudioLiveHandlers): () => void {
  let ws: WebSocket | null = null;
  let disposed = false;
  let attempt = 0;
  let reconnectTimer: number | null = null;

  const setState = (state: LiveConnectionState) => {
    handlers.onState?.(state);
  };

  const clearReconnect = () => {
    if (reconnectTimer != null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (disposed) return;
    clearReconnect();
    setState('reconnecting');
    const delay = Math.min(10_000, 600 * 1.7 ** attempt);
    attempt += 1;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      open();
    }, delay);
  };

  const open = () => {
    if (disposed) return;
    clearReconnect();
    try {
      ws = new WebSocket(studioWebSocketUrl());
    } catch {
      scheduleReconnect();
      return;
    }

    if (attempt > 0) setState('reconnecting');

    ws.onopen = () => {
      attempt = 0;
      setState('live');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as StudioWsMessage;
        if (msg.type === 'studio:state' && msg.payload && typeof msg.payload === 'object') {
          const payload = msg.payload as { snapshot?: StudioSnapshot; logs?: LogEntry[] };
          if (payload.snapshot) handlers.onSnapshot?.(payload.snapshot);
          if (payload.logs) handlers.onLogs?.(payload.logs);
        } else if (msg.type === 'studio:snapshot' && msg.payload) {
          handlers.onSnapshot?.(msg.payload as StudioSnapshot);
        } else if (msg.type === 'studio:logs' && msg.payload) {
          handlers.onLogs?.(msg.payload as LogEntry[]);
        } else if (msg.type === 'error' && msg.payload && typeof msg.payload === 'object') {
          const message = (msg.payload as { message?: string }).message;
          if (message) handlers.onError?.(message);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onclose = () => {
      ws = null;
      if (!disposed) scheduleReconnect();
    };

    ws.onerror = () => {
      /* close handler reconnects */
    };
  };

  open();

  return () => {
    disposed = true;
    clearReconnect();
    if (ws) {
      ws.onclose = null;
      ws.close();
      ws = null;
    }
    setState('offline');
  };
}

export function formatUptime(ms: number | null): string {
  if (ms == null) return '—';
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export function formatCooldown(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${ms / 1000}s`;
}

export function commandKey(cmd: StudioCommandInfo): string {
  return `${cmd.type}:${cmd.name}`;
}

export function typeLabel(type: StudioCommandInfo['type']): string {
  switch (type) {
    case 'slash':
      return 'slash';
    case 'group':
      return 'group';
    case 'context-user':
      return 'user ctx';
    case 'context-message':
      return 'msg ctx';
    case 'message':
      return 'message';
    default:
      return type;
  }
}
