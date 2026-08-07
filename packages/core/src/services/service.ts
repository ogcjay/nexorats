import type { Logger } from '@nexora.ts/logger';
import type { Container, ServiceToken } from '../container/index.js';

/** Context passed into every {@link Service} constructor */
export interface ServiceContext {
  logger: Logger;
  container?: Container;
}

/**
 * Base service class for DI-friendly application services.
 *
 * @example
 * class EconomyService extends Service {
 *   async getBalance(userId: string) {
 *     this.logger.debug('balance lookup', { userId });
 *     return 0;
 *   }
 * }
 */
export abstract class Service {
  protected readonly logger: Logger;
  protected readonly container: Container | undefined;

  constructor(ctx: ServiceContext) {
    this.logger = ctx.logger;
    this.container = ctx.container;
  }
}

/** Instantiate a Service subclass with the given context */
export function createService<T extends Service>(
  Ctor: new (ctx: ServiceContext) => T,
  ctx: ServiceContext,
): T {
  return new Ctor(ctx);
}

/** Register a Service class on a Container (singleton by default) */
export function registerService<T extends Service>(
  container: Container,
  token: ServiceToken<T>,
  Ctor: new (ctx: ServiceContext) => T,
  ctx: ServiceContext,
  singleton = true,
): void {
  const factory = () => new Ctor(ctx);
  if (singleton) {
    container.registerSingleton(token, factory);
  } else {
    container.register(token, factory);
  }
}
