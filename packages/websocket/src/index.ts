import { WebSocketServer, WebSocket } from 'ws';
import type { Logger } from '@nexorajs/logger';
import type { LogEntry } from '@nexorajs/logger';
import { subscribeLiveLogs } from '@nexorajs/logger';

/** WebSocket event types */
export const WsEvents = {
  LOG: 'log',
  BOT_STATUS: 'bot:status',
  GUILD_EVENT: 'guild:event',
  CONSOLE: 'console',
  STATS_UPDATE: 'stats:update',
} as const;

export type WsEventType = (typeof WsEvents)[keyof typeof WsEvents];

/** WebSocket message envelope */
export interface WsMessage<T = unknown> {
  type: WsEventType | string;
  payload: T;
  timestamp: string;
}

/** Connected client metadata */
interface ConnectedClient {
  ws: WebSocket;
  subscriptions: Set<string>;
  authenticated: boolean;
}

/** WebSocket hub for live dashboard updates */
export class WebSocketHub {
  private wss: WebSocketServer | null = null;
  private readonly clients = new Map<WebSocket, ConnectedClient>();
  private unsubscribeLogs: (() => void) | null = null;

  constructor(private readonly logger: Logger) {}

  /** Start WebSocket server */
  start(port: number): void {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      const client: ConnectedClient = {
        ws,
        subscriptions: new Set(['log', 'bot:status']),
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
    });

    this.unsubscribeLogs = subscribeLiveLogs((entry) => {
      this.broadcast(WsEvents.LOG, entry, 'log');
    });

    this.logger.info(`WebSocket server listening on port ${port}`);
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

  /** Broadcast message to subscribed clients */
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

  get connectionCount(): number {
    return this.clients.size;
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
    }
  }
}

export type { LogEntry };
