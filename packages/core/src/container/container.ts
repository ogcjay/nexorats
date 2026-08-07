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
 */
export class Container {
  private readonly factories = new Map<ServiceToken, ServiceFactory<unknown>>();
  private readonly singletons = new Map<ServiceToken, unknown>();
  private readonly singletonFlags = new Set<ServiceToken>();

  /** Register a transient service (new instance each resolve) */
  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.factories.set(token, factory as ServiceFactory<unknown>);
    this.singletonFlags.delete(token);
    this.singletons.delete(token);
  }

  /** Register a singleton service (single shared instance) */
  registerSingleton<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.factories.set(token, factory as ServiceFactory<unknown>);
    this.singletonFlags.add(token);
    this.singletons.delete(token);
  }

  /** Register an existing instance as singleton */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.singletons.set(token, instance);
    this.singletonFlags.add(token);
  }

  /** Resolve a service by token */
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

  /** Check if a service is registered */
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

/** Well-known service tokens */
export const TOKENS = {
  Logger: Symbol('Logger'),
  Config: Symbol('Config'),
  Client: Symbol('Client'),
  CommandRegistry: Symbol('CommandRegistry'),
  EventRegistry: Symbol('EventRegistry'),
  EventBus: Symbol('EventBus'),
  Cache: Symbol('Cache'),
  Scheduler: Symbol('Scheduler'),
} as const;
