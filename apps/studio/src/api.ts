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
  meta?: Record<string, unknown>;
}

export type LiveConnectionState = 'live' | 'reconnecting' | 'offline';

export interface StudioWsMessage {
  type: string;
  payload?: unknown;
  timestamp?: string;
}

/* ─── Developer OS telemetry types ─── */

export interface StudioEventHandlerSpan {
  id: string;
  plugin?: string;
  source?: string;
  durationMs: number;
  error?: string;
}

export interface StudioEventTrace {
  id: string;
  event: string;
  timestamp: string;
  totalMs: number;
  handlers: StudioEventHandlerSpan[];
  error?: string;
}

export type PipelineStepKind =
  | 'rateLimit'
  | 'permission'
  | 'validation'
  | 'guard'
  | 'middleware'
  | 'command'
  | 'logger'
  | 'reply'
  | 'other';

export interface StudioPipelineStep {
  name: string;
  kind: PipelineStepKind;
  status: 'ok' | 'deny' | 'error' | 'skipped';
  durationMs: number;
  detail?: string;
}

export interface StudioPipelineTrace {
  id: string;
  command: string;
  userId?: string;
  guildId?: string | null;
  timestamp: string;
  totalMs: number;
  steps: StudioPipelineStep[];
  outcome: 'ok' | 'denied' | 'error';
  error?: string;
}

export interface StudioCommandMetrics {
  name: string;
  executions: number;
  errors: number;
  denies: number;
  totalMs: number;
  lastMs?: number;
  lastError?: string;
  lastExecutedAt?: string;
  avgMs: number;
}

export interface StudioPerformanceSnapshot {
  startedAt: string;
  uptimeMs: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  slowCommands: Array<{ name: string; avgMs: number; lastMs: number; executions: number }>;
  slowPlugins: Array<{ name: string; avgMs: number; events: number }>;
  topErrors: Array<{ message: string; count: number }>;
}

export interface StudioGraphNode {
  id: string;
  label: string;
  kind?: string;
}

export interface StudioGraphEdge {
  from: string;
  to: string;
  label?: string;
}

export interface StudioGraphPayload {
  nodes: StudioGraphNode[];
  edges: StudioGraphEdge[];
  note?: string;
}

export interface StudioDepHealthItem {
  name: string;
  current?: string;
  latest?: string;
  status: 'ok' | 'outdated' | 'missing' | 'unknown';
  note?: string;
}

export interface StudioDepsHealth {
  items: StudioDepHealthItem[];
  checkedAt?: string;
  note?: string;
}

export interface StudioApiRoute {
  method: string;
  path: string;
  description?: string;
}

export interface StudioApiRoutesPayload {
  routes: StudioApiRoute[];
  note?: string;
}

export interface StudioDbTablesPayload {
  available: boolean;
  tables?: string[];
  message?: string;
}

export interface StudioDbQueryPayload {
  available: boolean;
  table?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
  message?: string;
}

export interface StudioLiveConfigPayload {
  config: Record<string, unknown>;
  allowlist: string[];
  note?: string;
}

export interface StudioPluginInstallJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'success' | 'error';
  message?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface StudioTelemetryPayload {
  events?: StudioEventTrace[];
  pipelines?: StudioPipelineTrace[];
  commands?: StudioCommandMetrics[];
  performance?: StudioPerformanceSnapshot;
}

const EMPTY_MESSAGE = 'Endpoint not available yet.';

/** Soft fetch — returns fallback on network/404/empty; never throws. */
export async function softFetchJson<T>(url: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return fallback;
    const text = await res.text();
    if (!text.trim()) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
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

export async function fetchEventTraces(limit = 50): Promise<StudioEventTrace[]> {
  const data = await softFetchJson<{ traces?: StudioEventTrace[] } | StudioEventTrace[]>(
    `/api/studio/events/live?limit=${limit}`,
    [],
  );
  if (Array.isArray(data)) return data;
  return data.traces ?? [];
}

export async function fetchPipelines(limit = 50): Promise<StudioPipelineTrace[]> {
  const data = await softFetchJson<{ pipelines?: StudioPipelineTrace[] } | StudioPipelineTrace[]>(
    `/api/studio/pipelines?limit=${limit}`,
    [],
  );
  if (Array.isArray(data)) return data;
  return data.pipelines ?? [];
}

export async function fetchCommandMetrics(): Promise<StudioCommandMetrics[]> {
  const data = await softFetchJson<{ metrics?: StudioCommandMetrics[] } | StudioCommandMetrics[]>(
    '/api/studio/commands/metrics',
    [],
  );
  if (Array.isArray(data)) return data;
  return data.metrics ?? [];
}

export async function fetchPerformance(): Promise<StudioPerformanceSnapshot | null> {
  return softFetchJson<StudioPerformanceSnapshot | null>('/api/studio/performance', null);
}

export async function fetchGraph(): Promise<StudioGraphPayload> {
  return softFetchJson<StudioGraphPayload>('/api/studio/graph', {
    nodes: [],
    edges: [],
    note: EMPTY_MESSAGE,
  });
}

export async function fetchDepsHealth(): Promise<StudioDepsHealth> {
  return softFetchJson<StudioDepsHealth>('/api/studio/health/deps', {
    items: [],
    note: EMPTY_MESSAGE,
  });
}

export async function fetchApiRoutes(): Promise<StudioApiRoutesPayload> {
  return softFetchJson<StudioApiRoutesPayload>('/api/studio/api-routes', {
    routes: [],
    note: EMPTY_MESSAGE,
  });
}

export async function fetchDbTables(): Promise<StudioDbTablesPayload> {
  return softFetchJson<StudioDbTablesPayload>('/api/studio/db/tables', {
    available: false,
    message: EMPTY_MESSAGE,
  });
}

export async function fetchDbQuery(table: string, limit = 25): Promise<StudioDbQueryPayload> {
  const q = new URLSearchParams({ table, limit: String(limit) });
  return softFetchJson<StudioDbQueryPayload>(`/api/studio/db/query?${q}`, {
    available: false,
    message: EMPTY_MESSAGE,
  });
}

export async function fetchLiveConfig(): Promise<StudioLiveConfigPayload> {
  return softFetchJson<StudioLiveConfigPayload>('/api/studio/config/live', {
    config: {},
    allowlist: [],
    note: EMPTY_MESSAGE,
  });
}

export async function putLiveConfig(
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; config?: Record<string, unknown> }> {
  try {
    const res = await fetch('/api/studio/config/live', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      config?: Record<string, unknown>;
    };
    if (!res.ok) {
      return { ok: false, error: body.error ?? `Save failed (${res.status})` };
    }
    return { ok: body.ok !== false, error: body.error, config: body.config };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function installPlugin(name: string): Promise<StudioPluginInstallJob | null> {
  try {
    const res = await fetch('/api/studio/plugins/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return null;
    return (await res.json()) as StudioPluginInstallJob;
  } catch {
    return null;
  }
}

export async function fetchPluginInstallJob(id: string): Promise<StudioPluginInstallJob | null> {
  return softFetchJson<StudioPluginInstallJob | null>(`/api/studio/plugins/install/${id}`, null);
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
  onTelemetry?: (payload: StudioTelemetryPayload) => void;
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
          const payload = msg.payload as {
            snapshot?: StudioSnapshot;
            logs?: LogEntry[];
            telemetry?: StudioTelemetryPayload;
          };
          if (payload.snapshot) handlers.onSnapshot?.(payload.snapshot);
          if (payload.logs) handlers.onLogs?.(payload.logs);
          if (payload.telemetry) handlers.onTelemetry?.(payload.telemetry);
        } else if (msg.type === 'studio:snapshot' && msg.payload) {
          handlers.onSnapshot?.(msg.payload as StudioSnapshot);
        } else if (msg.type === 'studio:logs' && msg.payload) {
          handlers.onLogs?.(msg.payload as LogEntry[]);
        } else if (msg.type === 'studio:telemetry' && msg.payload) {
          handlers.onTelemetry?.(msg.payload as StudioTelemetryPayload);
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

export function formatBytes(bytes: number | undefined | null): string {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMs(ms: number | undefined | null): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
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

const SECRET_KEY_RE =
  /token|secret|password|passwd|api[_-]?key|private|credential|webhook|auth|bearer|cookie/i;

export function isSecretConfigKey(key: string): boolean {
  return SECRET_KEY_RE.test(key);
}

/** Flatten nested config to dotted paths for allowlisted editing. */
export function flattenConfig(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value == null) {
      out[path] = null;
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[path] = value;
    } else if (Array.isArray(value)) {
      out[path] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      Object.assign(out, flattenConfig(value as Record<string, unknown>, path));
    }
  }
  return out;
}

export function setNestedValue(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split('.');
  const clone: Record<string, unknown> = { ...root };
  let cursor: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const next = cursor[part];
    const child =
      next && typeof next === 'object' && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    cursor[part] = child;
    cursor = child;
  }
  cursor[parts[parts.length - 1]!] = value;
  return clone;
}

export function isLocalhostOrigin(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}
