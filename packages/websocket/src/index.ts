import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Duplex } from 'node:stream';
import type { Logger } from '@nexora.ts/logger';
import type { LogEntry } from '@nexora.ts/logger';
import { subscribeLiveLogs } from '@nexora.ts/logger';

/** WebSocket event types */
export const WsEvents = {
  LOG: 'log',
  BOT_STATUS: 'bot:status',
  GUILD_EVENT: 'guild:event',
  CONSOLE: 'console',
  STATS_UPDATE: 'stats:update',
  /** Full Studio snapshot (same shape as HTTP `/api/studio/snapshot`) */
  STUDIO_SNAPSHOT: 'studio:snapshot',
  /** Full Studio log buffer */
  STUDIO_LOGS: 'studio:logs',
  /** Combined Studio state: `{ snapshot, logs }` */
  STUDIO_STATE: 'studio:state',
  /** Studio telemetry ring-buffer summary (events / pipelines / metrics) */
  STUDIO_TELEMETRY: 'studio:telemetry',
} as const;

export type WsEventType = (typeof WsEvents)[keyof typeof WsEvents];

/** WebSocket message envelope */
export interface WsMessage<T = unknown> {
  type: WsEventType | string;
  payload: T;
  timestamp: string;
}

/** Connected client metadata */
export interface ConnectedClient {
  ws: WebSocket;
  subscriptions: Set<string>;
  authenticated: boolean;
}

export interface WebSocketHubStartOptions {
  /** Standalone listen port (dashboard mode) */
  port?: number;
  /** Attach to an existing HTTP server (Studio / shared host) */
  server?: HttpServer;
  /** Upgrade path when using `server` or `noServer` (default `/ws`) */
  path?: string;
  /**
   * Create a path-scoped hub without binding a port.
   * Call `handleUpgrade` from one or more HTTP servers.
   */
  noServer?: boolean;
  /** Forward live logger lines as `log` events (default true) */
  forwardLogs?: boolean;
}

/** WebSocket hub for live dashboard / Studio updates */
export class WebSocketHub {
  private wss: WebSocketServer | null = null;
  private readonly clients = new Map<WebSocket, ConnectedClient>();
  private unsubscribeLogs: (() => void) | null = null;
  private path = '/ws';
  private onConnectHandler:
    | ((client: ConnectedClient, hub: WebSocketHub) => void | Promise<void>)
    | null = null;

  constructor(private readonly logger?: Logger) {}

  /** Register a handler invoked for every new connection (e.g. push initial Studio state). */
  onConnect(
    handler: (client: ConnectedClient, hub: WebSocketHub) => void | Promise<void>,
  ): () => void {
    this.onConnectHandler = handler;
    return () => {
      if (this.onConnectHandler === handler) this.onConnectHandler = null;
    };
  }

  /**
   * Start WebSocket server.
   * - `start(3921)` — standalone port (legacy)
   * - `start({ server, path: '/ws' })` — attach to HTTP server
   * - `start({ noServer: true, path: '/ws' })` — manual upgrades via `handleUpgrade`
   */
  start(portOrOptions: number | WebSocketHubStartOptions): void {
    if (this.wss) return;

    const options: WebSocketHubStartOptions =
      typeof portOrOptions === 'number' ? { port: portOrOptions } : portOrOptions;

    this.path = normalizePath(options.path ?? '/ws');
    const forwardLogs = options.forwardLogs !== false;

    if (options.noServer) {
      this.wss = new WebSocketServer({ noServer: true });
    } else if (options.server) {
      this.wss = new WebSocketServer({ server: options.server, path: this.path });
    } else if (options.port != null) {
      this.wss = new WebSocketServer({ port: options.port, path: this.path });
    } else {
      throw new Error('WebSocketHub.start requires port, server, or noServer: true');
    }

    this.wss.on('connection', (ws) => {
      void this.acceptConnection(ws);
    });

    if (forwardLogs) {
      this.unsubscribeLogs = subscribeLiveLogs((entry) => {
        this.broadcast(WsEvents.LOG, entry, 'log');
      });
    }

    const where =
      options.noServer
        ? `noServer path ${this.path}`
        : options.server
          ? `attached path ${this.path}`
          : `port ${options.port}${this.path !== '/' ? ` path ${this.path}` : ''}`;
    this.logger?.info(`WebSocket server listening (${where})`);
  }

  /**
   * Handle an HTTP upgrade for `noServer` hubs (or multi-server sharing).
   * Returns true when the upgrade was claimed.
   */
  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): boolean {
    if (!this.wss) return false;
    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
    if (pathname !== this.path) return false;

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss!.emit('connection', ws, req);
    });
    return true;
  }

  /** Stop WebSocket server */
  stop(): void {
    this.unsubscribeLogs?.();
    this.unsubscribeLogs = null;

    for (const client of this.clients.values()) {
      client.ws.close();
    }
    this.clients.clear();

    this.wss?.close();
    this.wss = null;
  }

  /** Broadcast message to subscribed clients (or everyone when no subscription filter). */
  broadcast(type: WsEventType | string, payload: unknown, subscription?: string): void {
    const message: WsMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    const data = JSON.stringify(message);

    for (const client of this.clients.values()) {
      if (subscription && !client.subscriptions.has(subscription)) continue;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  /** Send to a single client */
  sendTo(client: ConnectedClient, type: string, payload: unknown): void {
    this.send(client.ws, type, payload);
  }

  /** Send bot status update */
  sendBotStatus(status: {
    online: boolean;
    uptime?: number;
    guilds?: number;
    users?: number;
  }): void {
    this.broadcast(WsEvents.BOT_STATUS, status, 'bot:status');
  }

  /** Send guild event */
  sendGuildEvent(event: { guildId: string; type: string; data: unknown }): void {
    this.broadcast(WsEvents.GUILD_EVENT, event, 'guild:event');
  }

  /** Send stats update */
  sendStatsUpdate(stats: Record<string, number>): void {
    this.broadcast(WsEvents.STATS_UPDATE, stats, 'stats:update');
  }

  /** Push Studio snapshot to all clients (no subscription filter). */
  sendStudioSnapshot(snapshot: unknown): void {
    this.broadcast(WsEvents.STUDIO_SNAPSHOT, snapshot);
  }

  /** Push Studio log buffer to all clients. */
  sendStudioLogs(logs: unknown): void {
    this.broadcast(WsEvents.STUDIO_LOGS, logs);
  }

  /** Push combined Studio state `{ snapshot, logs }`. */
  sendStudioState(state: { snapshot: unknown; logs: unknown }): void {
    this.broadcast(WsEvents.STUDIO_STATE, state);
  }

  get connectionCount(): number {
    return this.clients.size;
  }

  private async acceptConnection(ws: WebSocket): Promise<void> {
    const client: ConnectedClient = {
      ws,
      subscriptions: new Set([
        'log',
        'bot:status',
        WsEvents.STUDIO_SNAPSHOT,
        WsEvents.STUDIO_LOGS,
        WsEvents.STUDIO_STATE,
      ]),
      authenticated: false,
    };
    this.clients.set(ws, client);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WsMessage;
        this.handleClientMessage(ws, message);
      } catch {
        this.send(ws, 'error', { message: 'Invalid message format' });
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    this.send(ws, 'connected', { message: 'Connected to Nexora WebSocket' });

    if (this.onConnectHandler) {
      try {
        await this.onConnectHandler(client, this);
      } catch (error) {
        this.logger?.warn(
          `WebSocket onConnect failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private send(ws: WebSocket, type: string, payload: unknown): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
  }

  private handleClientMessage(ws: WebSocket, message: WsMessage): void {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'auth': {
        const { token } = message.payload as { token?: string };
        client.authenticated = !!token;
        this.send(ws, 'auth:result', { authenticated: client.authenticated });
        break;
      }
      case 'subscribe': {
        const { channels } = message.payload as { channels?: string[] };
        for (const ch of channels ?? []) {
          client.subscriptions.add(ch);
        }
        break;
      }
      case 'unsubscribe': {
        const { channels } = message.payload as { channels?: string[] };
        for (const ch of channels ?? []) {
          client.subscriptions.delete(ch);
        }
        break;
      }
      case 'ping':
        this.send(ws, 'pong', {});
        break;
      case 'studio:refresh':
        void this.onConnectHandler?.(client, this);
        break;
    }
  }
}

function normalizePath(path: string): string {
  if (!path.startsWith('/')) return `/${path}`;
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

export type { LogEntry };
