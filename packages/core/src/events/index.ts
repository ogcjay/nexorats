import type { Client, ClientEvents } from 'discord.js';
import { resolveEventExport } from './event-class.js';

export {
  EventHandler,
  isEventClass,
  resolveEventExport,
} from './event-class.js';

/** Event handler function */
export type EventExecuteFn<K extends keyof ClientEvents = keyof ClientEvents> = (
  ...args: ClientEvents[K]
) => Promise<void> | void;

/** Event definition */
export interface EventDefinition<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: EventExecuteFn<K>;
}

/**
 * Type-safe event builder.
 *
 * @example
 * export default event('ready', (client) => {
 *   console.log(`Logged in as ${client.user.tag}`);
 * });
 */
export function event<K extends keyof ClientEvents>(
  name: K,
  execute: EventExecuteFn<K>,
  once = false,
): EventDefinition<K> {
  return { name, execute, once };
}

/** Registered event with metadata */
export interface RegisteredEvent<
  K extends keyof ClientEvents = keyof ClientEvents,
> extends EventDefinition<K> {
  source?: string;
}

/** Event registry */
export class EventRegistry {
  private readonly events = new Map<string, RegisteredEvent[]>();

  register<K extends keyof ClientEvents>(eventDef: RegisteredEvent<K>): void {
    const existing = this.events.get(eventDef.name as string) ?? [];
    existing.push(eventDef as unknown as RegisteredEvent);
    this.events.set(eventDef.name as string, existing);
  }

  getAll(): RegisteredEvent[] {
    const all: RegisteredEvent[] = [];
    for (const events of this.events.values()) {
      all.push(...events);
    }
    return all;
  }

  get size(): number {
    return this.getAll().length;
  }
}

/** Auto-discover events from glob patterns */
export async function discoverEvents(
  patterns: string[],
  registry: EventRegistry,
  logger: import('@nexora.ts/logger').Logger,
): Promise<void> {
  const { glob } = await import('glob');
  const { pathToFileURL } = await import('node:url');

  for (const pattern of patterns) {
    const files = await glob(pattern, { absolute: true });

    for (const file of files) {
      try {
        const module = await import(pathToFileURL(file).href);
        const eventDef = resolveEventExport(module.default);

        if (eventDef) {
          registry.register(Object.assign(eventDef, { source: file }));
          logger.debug(`Registered event: ${String(eventDef.name)}`, { file });
        }
      } catch (error) {
        logger.error(`Failed to load event: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  logger.info(`Discovered ${registry.size} event handler(s)`);
}

/** Attach all registered events to the Discord client */
export function attachEventHandlers(client: Client, registry: EventRegistry): void {
  for (const eventDef of registry.getAll()) {
    if (eventDef.once) {
      client.once(eventDef.name, (...args: unknown[]) => eventDef.execute(...(args as never)));
    } else {
      client.on(eventDef.name, (...args: unknown[]) => eventDef.execute(...(args as never)));
    }
  }
}
