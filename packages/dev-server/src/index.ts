import type { NexoraConfig } from '@nexora.ts/config';
import { FrameworkEvents, TOKENS, type Nexora, type LifecyclePhase } from '@nexora.ts/core';
import type { LogEntry } from '@nexora.ts/logger';
import { subscribeLiveLogs } from '@nexora.ts/logger';
import { WebSocketHub, WsEvents } from '@nexora.ts/websocket';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import { applyLiveConfigPatch, buildLiveConfigGet } from './config-live.js';
import {
  listStudioTables,
  runSafeTableQuery,
  type StudioDbQueryFn,
} from './db-inspect.js';
import { collectDepsHealth } from './deps-health.js';
import { buildStudioGraph } from './graph.js';
import { readJsonBody } from './http-util.js';
import {
  getPluginInstallJob,
  publicInstallJob,
  queuePluginInstall,
} from './plugin-install.js';
import {
  emptyPerformanceFallback,
  resolveStudioTelemetry,
  telemetryFingerprint,
  telemetrySummary,
} from './telemetry.js';
import { getStudioHtml } from './ui-html.js';

export type {
  StudioEventTrace,
  StudioEventHandlerSpan,
  StudioPipelineTrace,
  StudioPipelineStep,
  StudioCommandMetrics,
  StudioPerformanceSnapshot,
  PipelineStepKind,
} from './telemetry.js';
export type { DepsHealthReport, DepHealthEntry } from './deps-health.js';
export type { StudioDependencyGraph, StudioGraphNode, StudioGraphEdge } from './graph.js';
export type {
  StudioDbTablesResponse,
  StudioDbQueryResponse,
  KnownDbTable,
} from './db-inspect.js';
export { KNOWN_DB_TABLES } from './db-inspect.js';
export type { LiveConfigGetResponse, LiveConfigPutResponse } from './config-live.js';
export { LIVE_CONFIG_ALLOWLIST } from './config-live.js';
export type { PluginInstallJob, InstallJobStatus } from './plugin-install.js';

/** Plugin snapshot for Studio */
export interface StudioPluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  commands: number;
  events: number;
}

/** Serialized command option for Studio (no handlers) */
export interface StudioCommandOption {
  name: string;
  description: string;
  type: string;
  required?: boolean;
  autocomplete?: boolean;
  choices?: number;
}

/** Command / group / context-menu entry for Studio */
export interface StudioCommandInfo {
  name: string;
  description: string;
  /** slash | group | context-user | context-message | message */
  type: 'slash' | 'group' | 'context-user' | 'context-message' | 'message';
  source?: string;
  guildOnly?: boolean;
  adminOnly?: boolean;
  cooldownMs?: number | null;
  optionsCount: number;
  options: StudioCommandOption[];
  guardsCount: number;
  /** Subcommand count (groups only) */
  subcommands?: number;
  aliases?: string[];
}

/** Options for the local Studio introspection server */
export interface DevServerOptions {
  /** Default 3920 — Studio UI proxies here */
  port?: number;
  /** Studio UI port (default 3002). Embedded UI binds here when enabled. */
  studioPort?: number;
  /**
   * Serve an embedded Studio UI on `studioPort` (default `true`).
   * Skipped automatically when `NEXORA_STUDIO=1` (CLI already starts Vite UI)
   * or when `ui: false`.
   */
  ui?: boolean;
  /** Optional plugin snapshots from PluginLoader */
  plugins?: StudioPluginInfo[];
  /** Optional DB connectivity probe */
  databaseStatus?: () => Promise<{ connected: boolean; provider?: string; message?: string }>;
  /**
   * Optional read-only table query for Studio DB preview.
   * Must only SELECT from allowlisted tables — never run client SQL.
   */
  databaseQuery?: StudioDbQueryFn;
  /**
   * Optional listing of the bot's internal API routes
   * (e.g. from `@nexora.ts/api` ApiRouter).
   */
  apiRoutes?: () => StudioApiRouteInfo[] | Promise<StudioApiRouteInfo[]>;
  /** Max log lines kept in memory */
  logBufferSize?: number;
}

/** Internal API route descriptor for Studio */
export interface StudioApiRouteInfo {
  method: string;
  path: string;
  auth?: boolean;
  source?: string;
}

export interface StudioSnapshot {
  bot: {
    phase: LifecyclePhase;
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
    apiVersion: '0.3';
    ports: { studio: number; api: number };
    ui: 'embedded' | 'external' | 'none';
    counts: {
      commands: number;
      slash: number;
      groups: number;
      contextMenus: number;
      messageCommands: number;
      events: number;
      plugins: number;
      eventTraces?: number;
      pipelineTraces?: number;
      commandMetrics?: number;
    };
    telemetry?: {
      available: boolean;
    };
  };
}

const SENSITIVE_KEYS = new Set([
  'token',
  'clientsecret',
  'secret',
  'password',
  'authorization',
  'apikey',
  'privatekey',
]);

/** Deep-clone config and redact secrets for Studio display */
export function sanitizeConfig(config: NexoraConfig): Record<string, unknown> {
  try {
    return redact(structuredClone(config) as unknown as Record<string, unknown>) as Record<
      string,
      unknown
    >;
  } catch {
    // Fall back to JSON round-trip (drops functions / BigInt)
    try {
      return redact(JSON.parse(JSON.stringify(config)) as Record<string, unknown>) as Record<
        string,
        unknown
      >;
    } catch {
      return { error: 'Config could not be serialized' };
    }
  }
}

function redact(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.toLowerCase().replace(/[_-]/g, '');
      if (SENSITIVE_KEYS.has(normalized)) {
        out[key] = typeof nested === 'string' && nested.length > 0 ? '••••••••' : nested;
      } else {
        out[key] = redact(nested);
      }
    }
    return out;
  }
  return value;
}

/**
 * Read config without relying on DI Symbol identity.
 * Duplicate @nexora.ts/core copies (pnpm nested) break Symbol('Config') Map keys;
 * `bot.config` is always the construction-time source of truth.
 */
function readBotConfig(bot: Nexora): NexoraConfig | undefined {
  const direct = (bot as Nexora & { config?: NexoraConfig }).config;
  if (direct && typeof direct === 'object') return direct;
  return undefined;
}

/** Ensure TOKENS.Config is registered under *this* package's Symbol (or Symbol.for). */
function ensureConfigRegistered(bot: Nexora): void {
  if (bot.container.has(TOKENS.Config)) return;
  const config = readBotConfig(bot);
  if (config) {
    bot.container.registerInstance(TOKENS.Config, config);
  }
}

/** Resolve config for Studio; never throws — soft-fails to null. */
function resolveStudioConfig(bot: Nexora): { config: NexoraConfig | null; error?: string } {
  try {
    ensureConfigRegistered(bot);
    if (bot.container.has(TOKENS.Config)) {
      return { config: bot.container.resolve(TOKENS.Config) as NexoraConfig };
    }
  } catch {
    // fall through to bot.config
  }

  const fallback = readBotConfig(bot);
  if (fallback) return { config: fallback };

  return {
    config: null,
    error: 'Config unavailable (not registered and bot.config missing)',
  };
}

function mapStudioOptions(
  options: { name: string; description: string; type: string; required?: boolean; autocomplete?: boolean; choices?: unknown[] }[] | undefined,
): StudioCommandOption[] {
  if (!options?.length) return [];
  return options.map((opt) => ({
    name: opt.name,
    description: opt.description,
    type: opt.type,
    required: opt.required,
    autocomplete: opt.autocomplete,
    choices: opt.choices?.length,
  }));
}

function collectStudioCommands(bot: Nexora): StudioCommandInfo[] {
  const registry = bot.commandRegistry;
  const out: StudioCommandInfo[] = [];

  for (const cmd of registry.getAll()) {
    const options = mapStudioOptions(cmd.options);
    out.push({
      name: cmd.name,
      description: cmd.description,
      type: 'slash',
      source: cmd.source,
      guildOnly: cmd.guildOnly,
      adminOnly: cmd.adminOnly,
      cooldownMs: cmd.cooldown ?? null,
      optionsCount: options.length,
      options,
      guardsCount: cmd.guards?.length ?? 0,
    });
  }

  for (const group of registry.getAllGroups()) {
    const subCount =
      group.commands.length +
      (group.groups?.reduce((n, g) => n + g.commands.length, 0) ?? 0);
    out.push({
      name: group.name,
      description: group.description,
      type: 'group',
      source: group.source,
      optionsCount: 0,
      options: [],
      guardsCount: 0,
      subcommands: subCount,
    });
  }

  for (const menu of registry.getAllContextMenus()) {
    out.push({
      name: menu.name,
      description: menu.type === 'user' ? 'User context menu' : 'Message context menu',
      type: menu.type === 'user' ? 'context-user' : 'context-message',
      source: menu.source,
      optionsCount: 0,
      options: [],
      guardsCount: menu.guards?.length ?? 0,
    });
  }

  for (const msg of registry.getAllMessage()) {
    out.push({
      name: msg.name,
      description: msg.description ?? '',
      type: 'message',
      optionsCount: 0,
      options: [],
      guardsCount: 0,
      aliases: msg.aliases,
    });
  }

  return out;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = status === 204 ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

function sendHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
}

/**
 * Local introspection API powering **Nexora Studio**.
 * Exposes project-specific runtime data that a public docs site can never know.
 *
 * By default also serves an embedded Studio UI on `studioPort` (3002) so
 * `pnpm dev` works without a second terminal.
 *
 * Live updates: WebSocket at `/ws` on the API (and UI) host — full snapshot pushes.
 */
export class DevServer {
  private server: Server | null = null;
  private uiServer: Server | null = null;
  private readonly logBuffer: LogEntry[] = [];
  private readonly logBufferSize: number;
  private readonly plugins: StudioPluginInfo[];
  private readonly databaseStatus?: DevServerOptions['databaseStatus'];
  private readonly databaseQuery?: StudioDbQueryFn;
  private readonly apiRoutesFn?: DevServerOptions['apiRoutes'];
  private readonly studioPort: number;
  private readonly uiEnabled: boolean;
  private uiMode: 'embedded' | 'external' | 'none' = 'none';
  private unsubscribeLogs: (() => void) | null = null;
  private startedAt: Date | null = null;
  private readonly wsHub = new WebSocketHub();
  private readonly unsubscribers: Array<() => void> = [];
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private watchTimer: ReturnType<typeof setInterval> | null = null;
  private uptimeTimer: ReturnType<typeof setInterval> | null = null;
  private lastFingerprint = '';
  private lastTelemetryFingerprint = '';
  readonly port: number;

  /** Public Studio UI URL once listening (or null if UI did not start). */
  studioUrl: string | null = null;

  constructor(
    private readonly bot: Nexora,
    options: DevServerOptions = {},
  ) {
    this.port = options.port ?? 3920;
    this.studioPort = options.studioPort ?? 3002;
    this.logBufferSize = options.logBufferSize ?? 200;
    this.plugins = [...(options.plugins ?? [])];
    this.databaseStatus = options.databaseStatus;
    this.databaseQuery = options.databaseQuery;
    this.apiRoutesFn = options.apiRoutes;
    // Align DI Config token with this package's @nexora.ts/core copy
    // (avoids Symbol identity mismatch across nested installs).
    ensureConfigRegistered(this.bot);
    // Subscribe ASAP so logs during bot.start() are not lost if start()
    // is called after createDevServer() but before studioApi.start().
    this.attachLiveLogBuffer();
    // CLI `nexora dev` sets NEXORA_STUDIO=1 and starts the Vite UI separately.
    const cliOwnsUi =
      process.env.NEXORA_STUDIO === '1' || process.env.NEXORA_STUDIO === 'true';
    this.uiEnabled = options.ui ?? !cliOwnsUi;
    if (cliOwnsUi) {
      this.uiMode = 'external';
      this.studioUrl = `http://localhost:${this.studioPort}`;
      process.env.NEXORA_STUDIO_URL ??= this.studioUrl;
    }
  }

  /** Update plugin list after PluginLoader finishes */
  setPlugins(plugins: StudioPluginInfo[]): void {
    this.plugins.length = 0;
    for (const plugin of plugins) {
      this.plugins.push(plugin);
    }
    this.schedulePush('plugins');
  }

  /**
   * Buffer live logger entries for Studio. Safe to call multiple times
   * (constructor + start) — only one subscription is kept.
   */
  private attachLiveLogBuffer(): void {
    if (this.unsubscribeLogs) return;
    this.unsubscribeLogs = subscribeLiveLogs((entry) => {
      this.logBuffer.push(entry);
      if (this.logBuffer.length > this.logBufferSize) {
        this.logBuffer.shift();
      }
      // Immediate log fan-out for open Studio clients (full state still debounced).
      if (this.wsHub.connectionCount > 0) {
        this.wsHub.sendStudioLogs([...this.logBuffer]);
      }
      this.schedulePush('logs');
    });
  }

  async start(): Promise<void> {
    if (this.server) return;

    this.startedAt = new Date();
    this.attachLiveLogBuffer();

    this.server = createServer((req, res) => {
      void this.handleApi(req, res);
    });

    this.wsHub.start({ noServer: true, path: '/ws', forwardLogs: false });
    this.wsHub.onConnect(async (client) => {
      try {
        const snapshot = await this.getSnapshot();
        this.wsHub.sendTo(client, WsEvents.STUDIO_STATE, {
          snapshot,
          logs: [...this.logBuffer],
        });
      } catch (error) {
        this.wsHub.sendTo(client, 'error', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    this.server.on('upgrade', (req, socket, head) => {
      this.handleWsUpgrade(req, socket, head);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.port, '127.0.0.1', () => {
        this.bot.logger.info(`Nexora Studio API → http://127.0.0.1:${this.port}`);
        this.bot.logger.info(`Nexora Studio WS  → ws://127.0.0.1:${this.port}/ws`);
        resolve();
      });
    });

    this.bindLiveHooks();
    this.startWatchLoop();

    if (this.uiEnabled) {
      await this.startEmbeddedUi();
    } else if (this.uiMode === 'external') {
      this.bot.logger.info(
        `Nexora Studio UI → ${this.studioUrl} (started by CLI / external Vite)`,
      );
    } else {
      this.bot.logger.info(
        `Nexora Studio UI disabled. API only: http://127.0.0.1:${this.port}/api/studio/health`,
      );
      this.bot.logger.info(
        `Start UI with: npx nexora studio  (or createDevServer(bot, { ui: true }))`,
      );
    }
  }

  private async startEmbeddedUi(): Promise<void> {
    this.uiServer = createServer((req, res) => {
      void this.handleUi(req, res);
    });

    this.uiServer.on('upgrade', (req, socket, head) => {
      this.handleWsUpgrade(req, socket, head);
    });

    try {
      await new Promise<void>((resolve, reject) => {
        this.uiServer!.once('error', reject);
        // Bind all interfaces so http://localhost:PORT works on Windows
        // (IPv6 ::1) as well as 127.0.0.1.
        this.uiServer!.listen(this.studioPort, () => resolve());
      });
    } catch (error) {
      this.uiServer = null;
      this.uiMode = 'none';
      this.studioUrl = null;
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      this.bot.logger.warn(
        `Nexora Studio UI could not bind :${this.studioPort}${code ? ` (${code})` : ''}.`,
      );
      this.bot.logger.warn(
        `API is still available at http://127.0.0.1:${this.port}/api/studio/health`,
      );
      this.bot.logger.warn(
        `Free the port or start UI separately: npx nexora studio`,
      );
      return;
    }

    this.uiMode = 'embedded';
    this.studioUrl = `http://localhost:${this.studioPort}`;
    process.env.NEXORA_STUDIO_URL = this.studioUrl;
    this.bot.logger.info(`Nexora Studio → ${this.studioUrl} (API :${this.port})`);
  }

  async stop(): Promise<void> {
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
    if (this.uptimeTimer) {
      clearInterval(this.uptimeTimer);
      this.uptimeTimer = null;
    }

    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers.length = 0;

    this.unsubscribeLogs?.();
    this.unsubscribeLogs = null;

    this.wsHub.stop();

    if (this.uiServer) {
      await new Promise<void>((resolve) => {
        this.uiServer!.close(() => resolve());
      });
      this.uiServer = null;
    }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }

    this.studioUrl = null;
    this.uiMode = 'none';
  }

  async getSnapshot(): Promise<StudioSnapshot> {
    const client = this.bot.client;
    const ready = this.bot.lifecycle === 'ready' && Boolean(client.user);

    const { config, error: configError } = resolveStudioConfig(this.bot);
    const sanitizedConfig = config
      ? sanitizeConfig(config)
      : { error: configError ?? 'Config unavailable' };

    let database: StudioSnapshot['database'];
    try {
      database = this.databaseStatus
        ? await this.databaseStatus()
        : {
            connected: false,
            provider: config?.database?.provider,
            message: 'No database probe configured',
          };
    } catch (error) {
      database = {
        connected: false,
        provider: config?.database?.provider,
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const commands = collectStudioCommands(this.bot);
    const events = this.bot.eventRegistry.getAll().map((evt) => ({
      name: String(evt.name),
      once: evt.once,
      source: evt.source,
    }));
    const plugins = [...this.plugins];

    const slash = commands.filter((c) => c.type === 'slash').length;
    const groups = commands.filter((c) => c.type === 'group').length;
    const contextMenus = commands.filter(
      (c) => c.type === 'context-user' || c.type === 'context-message',
    ).length;
    const messageCommands = commands.filter((c) => c.type === 'message').length;

    const tel = resolveStudioTelemetry();
    const telSummary = telemetrySummary(tel);

    return {
      bot: {
        phase: this.bot.lifecycle,
        online: ready,
        tag: client.user?.tag ?? null,
        id: client.user?.id ?? null,
        guilds: client.guilds?.cache?.size ?? 0,
        uptimeMs: client.uptime ?? null,
        startedAt: this.startedAt?.toISOString() ?? null,
      },
      commands,
      events,
      plugins,
      config: sanitizedConfig,
      database,
      meta: {
        studio: true,
        apiVersion: '0.3',
        ports: { studio: this.studioPort, api: this.port },
        ui: this.uiMode,
        counts: {
          commands: commands.length,
          slash,
          groups,
          contextMenus,
          messageCommands,
          events: events.length,
          plugins: plugins.length,
          eventTraces: telSummary.eventTraces,
          pipelineTraces: telSummary.pipelineTraces,
          commandMetrics: telSummary.commandMetrics,
        },
        telemetry: {
          available: telSummary.available,
        },
      },
    };
  }

  private handleWsUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
    if (!this.wsHub.handleUpgrade(req, socket, head)) {
      socket.destroy();
    }
  }

  private bindLiveHooks(): void {
    const bus = this.bot.eventBus;
    const push = () => this.schedulePush('event');

    this.unsubscribers.push(bus.on(FrameworkEvents.BOT_READY, push));
    this.unsubscribers.push(bus.on(FrameworkEvents.BOT_SHUTDOWN, push));
    this.unsubscribers.push(bus.on(FrameworkEvents.PLUGIN_LOADED, push));
    this.unsubscribers.push(bus.on(FrameworkEvents.PLUGIN_UNLOADED, push));
    this.unsubscribers.push(bus.on(FrameworkEvents.GUILD_JOINED, push));
    this.unsubscribers.push(bus.on(FrameworkEvents.GUILD_LEFT, push));

    const client = this.bot.client;
    const onClient = () => this.schedulePush('client');
    client.on('ready', onClient);
    client.on('guildCreate', onClient);
    client.on('guildDelete', onClient);
    this.unsubscribers.push(() => {
      client.off('ready', onClient);
      client.off('guildCreate', onClient);
      client.off('guildDelete', onClient);
    });
  }

  /** While clients are connected, detect registry / config fingerprint changes. */
  private startWatchLoop(): void {
    this.watchTimer = setInterval(() => {
      if (this.wsHub.connectionCount === 0) return;
      void this.checkFingerprint();
      this.pushTelemetryIfChanged();
    }, 2000);
    this.watchTimer.unref?.();

    // Uptime / guild cache refresh without waiting for events
    this.uptimeTimer = setInterval(() => {
      if (this.wsHub.connectionCount === 0) return;
      void this.pushSnapshotOnly();
    }, 10_000);
    this.uptimeTimer.unref?.();
  }

  private pushTelemetryIfChanged(): void {
    const tel = resolveStudioTelemetry();
    const fp = telemetryFingerprint(tel);
    if (fp === this.lastTelemetryFingerprint) return;
    this.lastTelemetryFingerprint = fp;
    if (!tel) return;
    try {
      this.wsHub.broadcast('studio:telemetry', {
        eventTraces: tel.getEventTraces(20),
        pipelines: tel.getPipelineTraces(20),
        commandMetrics: tel.getCommandMetrics(),
        performance: tel.getPerformance(),
      });
    } catch {
      /* ignore */
    }
  }

  private fingerprintOf(snapshot: StudioSnapshot): string {
    return [
      snapshot.bot.phase,
      snapshot.bot.online ? '1' : '0',
      snapshot.bot.tag ?? '',
      snapshot.bot.id ?? '',
      String(snapshot.bot.guilds),
      String(snapshot.meta.counts.commands),
      String(snapshot.meta.counts.events),
      String(snapshot.meta.counts.plugins),
      snapshot.database.connected ? '1' : '0',
      JSON.stringify(snapshot.config),
    ].join('|');
  }

  private async checkFingerprint(): Promise<void> {
    try {
      const snapshot = await this.getSnapshot();
      const fingerprint = this.fingerprintOf(snapshot);
      if (fingerprint === this.lastFingerprint) return;
      this.lastFingerprint = fingerprint;
      this.wsHub.sendStudioState({ snapshot, logs: [...this.logBuffer] });
    } catch {
      /* ignore transient probe errors */
    }
  }

  private schedulePush(_reason: string): void {
    if (this.wsHub.connectionCount === 0) return;
    if (this.pushTimer) return;
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.pushLiveState();
    }, 120);
  }

  private async pushSnapshotOnly(): Promise<void> {
    if (this.wsHub.connectionCount === 0) return;
    try {
      const snapshot = await this.getSnapshot();
      this.lastFingerprint = this.fingerprintOf(snapshot);
      this.wsHub.sendStudioSnapshot(snapshot);
    } catch {
      /* ignore */
    }
  }

  private async pushLiveState(): Promise<void> {
    if (this.wsHub.connectionCount === 0) return;
    try {
      const snapshot = await this.getSnapshot();
      this.lastFingerprint = this.fingerprintOf(snapshot);
      this.wsHub.sendStudioState({ snapshot, logs: [...this.logBuffer] });
    } catch (error) {
      this.bot.logger.warn(
        `Studio WS push failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleUi(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;

    if (pathname.startsWith('/api/')) {
      await this.handleApi(req, res);
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      sendHtml(res, getStudioHtml());
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  }

  private async handleApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = url.pathname;

    try {
      // --- mutations ---
      if (method === 'PUT' && pathname === '/api/studio/config/live') {
        await this.handleConfigLivePut(req, res);
        return;
      }
      if (method === 'POST' && pathname === '/api/studio/plugins/install') {
        await this.handlePluginInstall(req, res);
        return;
      }

      if (method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }

      // Install job status: /api/studio/plugins/install/:id
      const installMatch = pathname.match(/^\/api\/studio\/plugins\/install\/([^/]+)$/);
      if (installMatch) {
        const job = getPluginInstallJob(decodeURIComponent(installMatch[1]!));
        if (!job) {
          sendJson(res, 404, { error: 'Install job not found' });
          return;
        }
        sendJson(res, 200, publicInstallJob(job));
        return;
      }

      switch (pathname) {
        case '/api/studio/health':
          sendJson(res, 200, {
            ok: true,
            service: 'nexora-studio-api',
            apiVersion: '0.3',
            ui: this.uiMode,
            studioUrl: this.studioUrl,
            websocket: {
              path: '/ws',
              clients: this.wsHub.connectionCount,
            },
            telemetry: telemetrySummary(resolveStudioTelemetry()),
          });
          return;
        case '/api/studio/snapshot':
          sendJson(res, 200, await this.getSnapshot());
          return;
        case '/api/studio/status':
          sendJson(res, 200, (await this.getSnapshot()).bot);
          return;
        case '/api/studio/commands':
          sendJson(res, 200, (await this.getSnapshot()).commands);
          return;
        case '/api/studio/events':
          sendJson(res, 200, (await this.getSnapshot()).events);
          return;
        case '/api/studio/events/live': {
          const tel = resolveStudioTelemetry();
          if (!tel) {
            sendJson(res, 200, {
              available: false,
              traces: [],
              note: 'Studio telemetry not available from @nexora.ts/core yet',
            });
            return;
          }
          sendJson(res, 200, {
            available: true,
            traces: tel.getEventTraces(50),
          });
          return;
        }
        case '/api/studio/pipelines': {
          const tel = resolveStudioTelemetry();
          if (!tel) {
            sendJson(res, 200, {
              available: false,
              pipelines: [],
              note: 'Studio telemetry not available from @nexora.ts/core yet',
            });
            return;
          }
          sendJson(res, 200, {
            available: true,
            pipelines: tel.getPipelineTraces(50),
          });
          return;
        }
        case '/api/studio/commands/metrics': {
          const tel = resolveStudioTelemetry();
          if (!tel) {
            sendJson(res, 200, {
              available: false,
              metrics: [],
              note: 'Studio telemetry not available from @nexora.ts/core yet',
            });
            return;
          }
          sendJson(res, 200, {
            available: true,
            metrics: tel.getCommandMetrics(),
          });
          return;
        }
        case '/api/studio/performance': {
          const tel = resolveStudioTelemetry();
          if (!tel) {
            sendJson(res, 200, {
              available: false,
              ...emptyPerformanceFallback(),
              note: 'Telemetry unavailable — returning process memory only',
            });
            return;
          }
          sendJson(res, 200, {
            available: true,
            ...tel.getPerformance(),
          });
          return;
        }
        case '/api/studio/graph':
          sendJson(res, 200, buildStudioGraph(this.plugins));
          return;
        case '/api/studio/health/deps':
          sendJson(res, 200, await collectDepsHealth(process.cwd()));
          return;
        case '/api/studio/api-routes': {
          if (!this.apiRoutesFn) {
            sendJson(res, 200, {
              routes: [],
              note: 'Bot did not expose apiRoutes to createDevServer — empty list',
            });
            return;
          }
          const routes = await this.apiRoutesFn();
          sendJson(res, 200, {
            routes: Array.isArray(routes) ? routes : [],
          });
          return;
        }
        case '/api/studio/db/tables': {
          const snap = await this.getSnapshot();
          sendJson(
            res,
            200,
            listStudioTables({
              connected: snap.database.connected,
              provider: snap.database.provider,
              message: snap.database.message,
            }),
          );
          return;
        }
        case '/api/studio/db/query': {
          const snap = await this.getSnapshot();
          sendJson(
            res,
            200,
            await runSafeTableQuery(
              url.searchParams.get('table'),
              url.searchParams.get('limit'),
              this.databaseQuery,
              snap.database.connected,
            ),
          );
          return;
        }
        case '/api/studio/config/live': {
          const { config, error: configError } = resolveStudioConfig(this.bot);
          if (!config) {
            sendJson(res, 503, {
              error: configError ?? 'Config unavailable',
              allowlist: [],
              limitations: [],
            });
            return;
          }
          sendJson(res, 200, buildLiveConfigGet(sanitizeConfig(config)));
          return;
        }
        case '/api/studio/plugins':
          sendJson(res, 200, (await this.getSnapshot()).plugins);
          return;
        case '/api/studio/config':
          sendJson(res, 200, (await this.getSnapshot()).config);
          return;
        case '/api/studio/database':
          sendJson(res, 200, (await this.getSnapshot()).database);
          return;
        case '/api/studio/logs':
          sendJson(res, 200, this.logBuffer);
          return;
        case '/api/studio/logs/stream':
          this.streamLogs(res);
          return;
        default:
          sendJson(res, 404, { error: `Not found: ${pathname}` });
      }
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async handleConfigLivePut(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : 'Invalid JSON body',
      });
      return;
    }

    const { config, error: configError } = resolveStudioConfig(this.bot);
    if (!config) {
      sendJson(res, 503, { error: configError ?? 'Config unavailable' });
      return;
    }

    const result = applyLiveConfigPatch(config, body, sanitizeConfig);
    if (result.applied.length > 0) {
      this.schedulePush('config-live');
    }
    sendJson(res, result.ok ? 200 : 400, result);
  }

  private async handlePluginInstall(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : 'Invalid JSON body',
      });
      return;
    }

    const name =
      body && typeof body === 'object' && body !== null && 'name' in body
        ? (body as { name?: unknown }).name
        : undefined;

    if (typeof name !== 'string') {
      sendJson(res, 400, { error: 'Body must be `{ name: string }`' });
      return;
    }

    const result = await queuePluginInstall(name, process.cwd());
    if ('error' in result) {
      sendJson(res, 400, result);
      return;
    }

    sendJson(res, 202, {
      id: result.id,
      status: result.status,
      name: result.name,
      packageManager: result.packageManager,
      statusUrl: `/api/studio/plugins/install/${encodeURIComponent(result.id)}`,
      preferNexoraPrefix: name.startsWith('@nexora.ts/')
        ? true
        : 'Non-@nexora.ts packages are allowed but prefer scoped framework plugins',
    });
  }

  private streamLogs(res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    for (const entry of this.logBuffer) {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }

    const unsubscribe = subscribeLiveLogs((entry) => {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    res.on('close', () => {
      unsubscribe();
    });
  }
}

export function createDevServer(bot: Nexora, options?: DevServerOptions): DevServer {
  return new DevServer(bot, options);
}
