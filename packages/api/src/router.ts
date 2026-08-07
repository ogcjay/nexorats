import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthService, AuthSession } from '@nexorajs/auth';
import type { RepositoryFactory } from '@nexorajs/database';
import type { Logger } from '@nexorajs/logger';
import { ApiError, errorResponse, success } from './errors.js';

/** Extended request with auth context */
export interface ApiRequest extends IncomingMessage {
  session?: AuthSession;
  params: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
}

/** Route handler function */
export type RouteHandler = (req: ApiRequest, res: ServerResponse) => Promise<void>;

/** Route definition */
export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: RouteHandler;
  auth?: boolean;
  permissions?: string[];
}

/** Parse URL path with params (e.g. /guilds/:guildId/settings) */
function matchRoute(
  routePath: string,
  urlPath: string,
): { match: boolean; params: Record<string, string> } {
  const routeParts = routePath.split('/').filter(Boolean);
  const urlParts = urlPath.split('/').filter(Boolean);

  if (routeParts.length !== urlParts.length) {
    return { match: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i]!;
    const urlPart = urlParts[i]!;

    if (routePart.startsWith(':')) {
      params[routePart.slice(1)] = urlPart;
    } else if (routePart !== urlPart) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

/** Parse query string */
function parseQuery(url: string): Record<string, string> {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};

  const params = new URLSearchParams(url.slice(queryIndex + 1));
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/** Read JSON body from request */
async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : undefined);
      } catch {
        reject(ApiError.badRequest('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/** API router */
export class ApiRouter {
  private readonly routes: Route[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly repos: RepositoryFactory,
    private readonly logger: Logger,
  ) {
    this.registerDefaultRoutes();
  }

  /** Register a route */
  add(route: Route): void {
    this.routes.push(route);
  }

  /** Handle incoming HTTP request */
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = req.url ?? '/';
      const pathOnly = url.split('?')[0] ?? '/';
      const method = req.method ?? 'GET';

      for (const route of this.routes) {
        const { match, params } = matchRoute(route.path, pathOnly);
        if (!match || route.method !== method) continue;

        const apiReq = req as ApiRequest;
        apiReq.params = params;
        apiReq.query = parseQuery(url);

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          apiReq.body = await readBody(req);
        }

        if (route.auth) {
          await this.authenticate(apiReq);
        }

        if (route.permissions?.length && apiReq.session) {
          const guildId = params.guildId ?? apiReq.query.guildId;
          if (guildId) {
            for (const perm of route.permissions) {
              const allowed = await this.auth.permissions.hasPermission(
                apiReq.session.user.id,
                guildId,
                perm as import('@nexorajs/auth').Permission,
              );
              if (!allowed) throw ApiError.forbidden();
            }
          }
        }

        await route.handler(apiReq, res);
        return;
      }

      throw ApiError.notFound(`Route not found: ${method} ${pathOnly}`);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async authenticate(req: ApiRequest): Promise<void> {
    const authHeader = req.headers.authorization;
    const cookie = req.headers.cookie;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (cookie) {
      const match = cookie.match(/nexora_session=([^;]+)/);
      token = match?.[1];
    }

    if (!token) throw ApiError.unauthorized();

    const session = await this.auth.sessions.validateSession(token);
    if (!session) throw ApiError.unauthorized('Session expired');

    req.session = session;
  }

  private handleError(error: unknown, res: ServerResponse): void {
    if (error instanceof ApiError) {
      res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errorResponse(error)));
      return;
    }

    this.logger.error('Unhandled API error', {
      error: error instanceof Error ? error.message : String(error),
    });

    const internal = ApiError.badRequest('Internal server error');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(errorResponse(internal)));
  }

  private registerDefaultRoutes(): void {
    this.add({
      method: 'GET',
      path: '/api/health',
      handler: async (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(success({ status: 'ok', timestamp: new Date().toISOString() })));
      },
    });

    this.add({
      method: 'GET',
      path: '/api/me',
      auth: true,
      handler: async (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(success({ user: req.session!.user })));
      },
    });

    this.add({
      method: 'GET',
      path: '/api/guilds/:guildId/settings',
      auth: true,
      permissions: ['view:dashboard'],
      handler: async (req, res) => {
        const settings = await this.repos.guildSettings.getAll(req.params.guildId!);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(success(settings)));
      },
    });

    this.add({
      method: 'GET',
      path: '/api/guilds/:guildId/logs',
      auth: true,
      permissions: ['view:logs'],
      handler: async (req, res) => {
        const logs = await this.repos.auditLogs.findByGuild(req.params.guildId!);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(success(logs)));
      },
    });
  }
}

/** Create and start API server */
export function createApiServer(
  auth: AuthService,
  repos: RepositoryFactory,
  logger: Logger,
  port = 4000,
) {
  const router = new ApiRouter(auth, repos, logger);

  const server = createServer((req, res) => {
    void router.handle(req, res);
  });

  return {
    router,
    start: () =>
      new Promise<void>((resolve) => {
        server.listen(port, () => {
          logger.info(`API server listening on port ${port}`);
          resolve();
        });
      }),
    stop: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

export { ApiError, success, errorResponse, validateBody, schemas } from './errors.js';
export type { ApiResponse } from './errors.js';
