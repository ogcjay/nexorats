/** Service identifier type */
export type ServiceToken<T = unknown> = symbol | string | (new (...args: never[]) => T);

/** Factory function for lazy service creation */
export type ServiceFactory<T> = () => T;

/** Service registration options */
export interface ServiceRegistration<T = unknown> {
  token: ServiceToken<T>;
  factory: ServiceFactory<T>;
  singleton?: boolean;
}

/**
 * Dependency injection container.
 * No global singletons — each Nexora instance owns its container.
 *
 * @example
 * const container = new Container();
 * container.registerSingleton(TOKENS.Cache, () => new Cache(new MemoryCacheAdapter()));
 * const cache = container.resolve(TOKENS.Cache);
 */
export class Container {
  private readonly factories = new Map<ServiceToken, ServiceFactory<unknown>>();
  private readonly singletons = new Map<ServiceToken, unknown>();
  private readonly singletonFlags = new Set<ServiceToken>();

  /**
   * Register a transient service (new instance each resolve).
   *
   * @param token - Service token (symbol, string, or class)
   * @param factory - Factory invoked on each {@link resolve}
   * @example
   * container.register('uuid', () => crypto.randomUUID());
   */
  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.factories.set(token, factory as ServiceFactory<unknown>);
    this.singletonFlags.delete(token);
    this.singletons.delete(token);
  }

  /**
   * Register a singleton service (single shared instance).
   *
   * @param token - Service token
   * @param factory - Factory invoked once on first {@link resolve}
   * @example
   * container.registerSingleton(TOKENS.Cache, () => new Cache(new MemoryCacheAdapter()));
   */
  registerSingleton<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.factories.set(token, factory as ServiceFactory<unknown>);
    this.singletonFlags.add(token);
    this.singletons.delete(token);
  }

  /**
   * Register an existing instance as singleton.
   *
   * @param token - Service token
   * @param instance - Pre-built instance
   * @example
   * container.registerInstance(TOKENS.Logger, logger);
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.singletons.set(token, instance);
    this.singletonFlags.add(token);
  }

  /**
   * Resolve a service by token.
   *
   * @param token - Service token
   * @returns The registered service instance
   * @throws If the token is not registered
   * @example
   * const logger = container.resolve(TOKENS.Logger);
   */
  resolve<T>(token: ServiceToken<T>): T {
    if (this.singletonFlags.has(token) && this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    const instance = factory() as T;

    if (this.singletonFlags.has(token)) {
      this.singletons.set(token, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered.
   *
   * @param token - Service token
   */
  has(token: ServiceToken): boolean {
    return this.factories.has(token) || this.singletons.has(token);
  }

  /** Remove all registrations */
  clear(): void {
    this.factories.clear();
    this.singletons.clear();
    this.singletonFlags.clear();
  }
}

/**
 * Well-known service tokens.
 * Uses Symbol.for so identity is shared across duplicate @nexora.ts/core copies
 * (common with pnpm nested deps / mismatched patch versions).
 */
export const TOKENS = {
  Logger: Symbol.for('nexora.Logger'),
  Config: Symbol.for('nexora.Config'),
  Client: Symbol.for('nexora.Client'),
  CommandRegistry: Symbol.for('nexora.CommandRegistry'),
  EventRegistry: Symbol.for('nexora.EventRegistry'),
  InteractionRegistry: Symbol.for('nexora.InteractionRegistry'),
  EventBus: Symbol.for('nexora.EventBus'),
  Cache: Symbol.for('nexora.Cache'),
  Scheduler: Symbol.for('nexora.Scheduler'),
} as const;
