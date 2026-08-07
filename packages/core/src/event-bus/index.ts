/** Hook execution phase */
export type HookPhase = 'before' | 'after';

/** Event listener with priority (higher = runs first) */
export interface EventListener<T = unknown> {
  handler: (payload: T) => Promise<void> | void;
  priority: number;
}

/** Middleware function */
export type Middleware<T = unknown> = (
  payload: T,
  next: () => Promise<void>,
) => Promise<void> | void;

/**
 * Internal event bus with hooks, middleware, and priorities.
 * Separate from Discord.js events — used for framework-level events.
 */
export class EventBus {
  private readonly listeners = new Map<string, EventListener[]>();
  private readonly beforeHooks = new Map<string, EventListener[]>();
  private readonly afterHooks = new Map<string, EventListener[]>();
  private readonly middleware = new Map<string, Middleware[]>();

  /** Subscribe to an event */
  on<T>(event: string, handler: (payload: T) => Promise<void> | void, priority = 0): () => void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push({ handler: handler as EventListener['handler'], priority });
    listeners.sort((a, b) => b.priority - a.priority);
    this.listeners.set(event, listeners);

    return () => {
      const idx = listeners.findIndex((l) => l.handler === handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  /** Subscribe to before hook */
  before<T>(
    event: string,
    handler: (payload: T) => Promise<void> | void,
    priority = 0,
  ): () => void {
    return this.addHook(this.beforeHooks, event, handler, priority);
  }

  /** Subscribe to after hook */
  after<T>(event: string, handler: (payload: T) => Promise<void> | void, priority = 0): () => void {
    return this.addHook(this.afterHooks, event, handler, priority);
  }

  /** Add middleware for an event */
  use<T>(event: string, middleware: Middleware<T>): () => void {
    const stack = this.middleware.get(event) ?? [];
    stack.push(middleware as Middleware);
    this.middleware.set(event, stack);

    return () => {
      const idx = stack.indexOf(middleware as Middleware);
      if (idx !== -1) stack.splice(idx, 1);
    };
  }

  /** Emit an event through hooks, middleware, and listeners */
  async emit<T>(event: string, payload: T): Promise<void> {
    await this.runHooks(this.beforeHooks, event, payload);

    const middlewareStack = this.middleware.get(event) ?? [];
    if (middlewareStack.length > 0) {
      await this.runMiddleware(middlewareStack, payload, () => this.runListeners(event, payload));
    } else {
      await this.runListeners(event, payload);
    }

    await this.runHooks(this.afterHooks, event, payload);
  }

  private addHook<T>(
    map: Map<string, EventListener[]>,
    event: string,
    handler: (payload: T) => Promise<void> | void,
    priority: number,
  ): () => void {
    const hooks = map.get(event) ?? [];
    hooks.push({ handler: handler as EventListener['handler'], priority });
    hooks.sort((a, b) => b.priority - a.priority);
    map.set(event, hooks);

    return () => {
      const idx = hooks.findIndex((h) => h.handler === handler);
      if (idx !== -1) hooks.splice(idx, 1);
    };
  }

  private async runHooks(
    map: Map<string, EventListener[]>,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const hooks = map.get(event) ?? [];
    for (const hook of hooks) {
      await hook.handler(payload);
    }
  }

  private async runListeners(event: string, payload: unknown): Promise<void> {
    const listeners = this.listeners.get(event) ?? [];
    for (const listener of listeners) {
      await listener.handler(payload);
    }
  }

  private async runMiddleware(
    stack: Middleware[],
    payload: unknown,
    final: () => Promise<void>,
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= stack.length) {
        await final();
        return;
      }
      const middleware = stack[index];
      index++;
      if (middleware) {
        await middleware(payload, next);
      }
    };

    await next();
  }
}

/** Well-known framework events */
export const FrameworkEvents = {
  BOT_READY: 'bot:ready',
  BOT_SHUTDOWN: 'bot:shutdown',
  COMMAND_EXECUTED: 'command:executed',
  COMMAND_ERROR: 'command:error',
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_UNLOADED: 'plugin:unloaded',
  GUILD_JOINED: 'guild:joined',
  GUILD_LEFT: 'guild:left',
} as const;
