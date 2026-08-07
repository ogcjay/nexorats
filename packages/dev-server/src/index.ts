import type { NexoraConfig } from '@nexora.ts/config';
import { TOKENS, type Nexora, type LifecyclePhase } from '@nexora.ts/core';
import type { LogEntry } from '@nexora.ts/logger';
import { subscribeLiveLogs } from '@nexora.ts/logger';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

/** Plugin snapshot for Studio */
export interface StudioPluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  commands: number;
  events: number;
}

/** Options for the local Studio introspection server */
export interface DevServerOptions {
  /** Default 3920 — Studio UI proxies here */
  port?: number;
  /** Optional plugin snapshots from PluginLoader */
  plugins?: StudioPluginInfo[];
  /** Optional DB connectivity probe */
  databaseStatus?: () => Promise<{ connected: boolean; provider?: string; message?: string }>;
  /** Max log lines kept in memory */
  logBufferSize?: number;
  /** Advertised Studio UI port (for meta only) */
  studioPort?: number;
}

export interface StudioSnapshot {
  bot: {
    phase: LifecyclePhase;
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
    apiVersion: '0.1';
    ports: { studio: number; api: number };
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
  return redact(structuredClone(config) as unknown as Record<string, unknown>) as Record<
    string,
    unknown
  >;
}

function redact(value: unknown): unknown {
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

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = status === 204 ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

/**
 * Local introspection API powering **Nexora Studio**.
 * Exposes project-specific runtime data that a public docs site can never know.
 */
export class DevServer {
  private server: Server | null = null;
  private readonly logBuffer: LogEntry[] = [];
  private readonly logBufferSize: number;
  private readonly plugins: StudioPluginInfo[];
  private readonly databaseStatus?: DevServerOptions['databaseStatus'];
  private readonly studioPort: number;
  private unsubscribeLogs: (() => void) | null = null;
  private startedAt: Date | null = null;
  readonly port: number;

  constructor(
    private readonly bot: Nexora,
    options: DevServerOptions = {},
  ) {
    this.port = options.port ?? 3920;
    this.studioPort = options.studioPort ?? 3002;
    this.logBufferSize = options.logBufferSize ?? 200;
    this.plugins = [...(options.plugins ?? [])];
    this.databaseStatus = options.databaseStatus;
  }

  /** Update plugin list after PluginLoader finishes */
  setPlugins(plugins: StudioPluginInfo[]): void {
    this.plugins.length = 0;
    for (const plugin of plugins) {
      this.plugins.push(plugin);
    }
  }

  async start(): Promise<void> {
    if (this.server) return;

    this.startedAt = new Date();
    this.unsubscribeLogs = subscribeLiveLogs((entry) => {
      this.logBuffer.push(entry);
      if (this.logBuffer.length > this.logBufferSize) {
        this.logBuffer.shift();
      }
    });

    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.port, '127.0.0.1', () => {
        this.bot.logger.info(`Nexora Studio API → http://127.0.0.1:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    this.unsubscribeLogs?.();
    this.unsubscribeLogs = null;

    if (!this.server) return;
    await new Promise<void>((resolve) => {
      this.server!.close(() => resolve());
    });
    this.server = null;
  }

  async getSnapshot(): Promise<StudioSnapshot> {
    const client = this.bot.client;
    const ready = this.bot.lifecycle === 'ready' && Boolean(client.user);
    const config = this.bot.container.resolve(TOKENS.Config) as NexoraConfig;

    const database = this.databaseStatus
      ? await this.databaseStatus()
      : {
          connected: false,
          provider: config.database.provider,
          message: 'No database probe configured',
        };

    return {
      bot: {
        phase: this.bot.lifecycle,
        online: ready,
        tag: client.user?.tag ?? null,
        guilds: client.guilds.cache.size,
        uptimeMs: client.uptime,
        startedAt: this.startedAt?.toISOString() ?? null,
      },
      commands: this.bot.commandRegistry.getAll().map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
        source: cmd.source,
        guildOnly: cmd.guildOnly,
      })),
      events: this.bot.eventRegistry.getAll().map((evt) => ({
        name: String(evt.name),
        once: evt.once,
        source: evt.source,
      })),
      plugins: [...this.plugins],
      config: sanitizeConfig(config),
      database,
      meta: {
        studio: true,
        apiVersion: '0.1',
        ports: { studio: this.studioPort, api: this.port },
      },
    };
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;

    try {
      switch (pathname) {
        case '/api/studio/health':
          sendJson(res, 200, { ok: true, service: 'nexora-studio-api' });
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
