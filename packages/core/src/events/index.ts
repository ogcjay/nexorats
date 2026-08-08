import type { Client, ClientEvents } from 'discord.js';
import type { Logger } from '@nexora.ts/logger';
import {
  formatErrorMessage,
  reportError,
  type ErrorBoundaryConfig,
} from '../errors/handler.js';
import {
  nextTelemetryId,
  studioTelemetry,
  type StudioEventHandlerSpan,
} from '../studio-telemetry/index.js';
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
 * @param name - Discord.js client event name
 * @param execute - Event handler (typed args for `name`)
 * @param once - When `true`, register with `client.once` (default `false`)
 * @returns An {@link EventDefinition} ready for discovery
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

/**
 * Alias for {@link event} — same discovery, shorter name for beginners.
 *
 * @param name - Discord.js client event name
 * @param execute - Event handler
 * @param once - When `true`, register with `client.once` (default `false`)
 * @example
 * export default on('messageCreate', async (message) => {
 *   if (message.content === 'ping') await message.reply('pong');
 * });
 */
export function on<K extends keyof ClientEvents>(
  name: K,
  execute: EventExecuteFn<K>,
  once = false,
): EventDefinition<K> {
  return event(name, execute, once);
}

/**
 * Ready-event shortcut (`once: true` by default).
 *
 * @param execute - Handler for the `ready` event
 * @param once - When `true`, register once (default `true`)
 * @example
 * export default onReady((client) => {
 *   console.log(`Logged in as ${client.user.tag}`);
 * });
 */
export function onReady(
  execute: EventExecuteFn<'ready'>,
  once = true,
): EventDefinition<'ready'> {
  return event('ready', execute, once);
}

/** Registered event with metadata */
export interface RegisteredEvent<
  K extends keyof ClientEvents = keyof ClientEvents,
> extends EventDefinition<K> {
  source?: string;
  /** Optional plugin name when registered via a plugin loader */
  plugin?: string;
}

/**
 * Registry of Discord event handlers discovered or registered manually.
 *
 * @example
 * const registry = new EventRegistry();
 * registry.register({
 *   name: 'ready',
 *   once: true,
 *   execute(client) {
 *     console.log(client.user.tag);
 *   },
 * });
 */
export class EventRegistry {
  private readonly events = new Map<string, RegisteredEvent[]>();

  /**
   * Register an event definition (multiple handlers per event name allowed).
   *
   * @param eventDef - Event definition, optionally with `source` / `plugin` metadata
   */
  register<K extends keyof ClientEvents>(eventDef: RegisteredEvent<K>): void {
    const existing = this.events.get(eventDef.name as string) ?? [];
    existing.push(eventDef as unknown as RegisteredEvent);
    this.events.set(eventDef.name as string, existing);
  }

  /** All registered handlers (flat list) */
  getAll(): RegisteredEvent[] {
    const all: RegisteredEvent[] = [];
    for (const events of this.events.values()) {
      all.push(...events);
    }
    return all;
  }

  /**
   * Handlers grouped by Discord event name.
   *
   * @param name - Discord.js event name (e.g. `'ready'`)
   */
  getByName(name: string): RegisteredEvent[] {
    return this.events.get(name) ?? [];
  }

  /** Total number of registered handlers */
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

/**
 * Attach all registered events to the Discord client.
 * Handlers for the same event (+ once flag) share one listener so Studio
 * receives a single {@link import('../studio-telemetry/index.js').StudioEventTrace}.
 *
 * @param client - Discord.js client
 * @param registry - Event registry
 * @param logger - Optional logger for handler failures
 * @param options - Optional error boundary
 */
export function attachEventHandlers(
  client: Client,
  registry: EventRegistry,
  logger?: Logger,
  options?: { errorBoundary?: ErrorBoundaryConfig },
): void {
  /** key: `once|on:eventName` → handlers */
  const groups = new Map<string, RegisteredEvent[]>();

  for (const eventDef of registry.getAll()) {
    const key = `${eventDef.once ? 'once' : 'on'}:${String(eventDef.name)}`;
    const list = groups.get(key);
    if (list) {
      list[list.length] = eventDef;
    } else {
      groups.set(key, [eventDef]);
    }
  }

  for (const [key, handlers] of groups) {
    const once = key.startsWith('once:');
    const eventName = handlers[0]!.name;

    const listener = (...args: unknown[]) => {
      void runEventHandlers(
        String(eventName),
        handlers,
        args,
        logger,
        options?.errorBoundary,
      );
    };

    if (once) {
      client.once(eventName, listener);
    } else {
      client.on(eventName, listener);
    }
  }
}

async function runEventHandlers(
  eventName: string,
  handlers: readonly RegisteredEvent[],
  args: unknown[],
  logger?: Logger,
  errorBoundary?: ErrorBoundaryConfig,
): Promise<void> {
  const started = Date.now();
  const spans: StudioEventHandlerSpan[] = [];
  let traceError: string | undefined;

  for (let i = 0; i < handlers.length; i++) {
    const eventDef = handlers[i]!;
    const spanId = nextTelemetryId('eh');
    const source =
      eventDef.source ??
      (typeof eventDef.execute === 'function' ? eventDef.execute.name || undefined : undefined);
    const t0 = performance.now();

    try {
      await eventDef.execute(...(args as never));
      spans[spans.length] = {
        id: spanId,
        plugin: eventDef.plugin,
        source,
        durationMs: performance.now() - t0,
      };
    } catch (error) {
      const message = formatErrorMessage(error);
      spans[spans.length] = {
        id: spanId,
        plugin: eventDef.plugin,
        source,
        durationMs: performance.now() - t0,
        error: message,
      };
      // Keep first handler error on the trace; continue so one bad handler
      // does not skip siblings (matches prior per-listener isolation).
      if (!traceError) traceError = message;

      logger?.error(`Event handler error: ${eventName}`, {
        error: message,
        source,
      });

      await reportError(
        errorBoundary,
        {
          error,
          source: 'event',
          event: eventName,
        },
        logger,
      );
    }
  }

  studioTelemetry.recordEventTrace({
    event: eventName,
    timestamp: new Date(started).toISOString(),
    totalMs: Date.now() - started,
    handlers: spans,
    error: traceError,
  });
}
