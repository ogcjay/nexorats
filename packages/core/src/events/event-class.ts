import type { ClientEvents } from 'discord.js';
import type { EventDefinition } from './index.js';

/**
 * Abstract event handler class — additive alternative to `event()`.
 *
 * @example
 * export default class ReadyHandler extends EventHandler<'ready'> {
 *   name = 'ready' as const;
 *   once = true;
 *   execute(client) {
 *     console.log(`Logged in as ${client.user.tag}`);
 *   }
 * }
 */
export abstract class EventHandler<K extends keyof ClientEvents = keyof ClientEvents>
  implements EventDefinition<K>
{
  abstract name: K;
  once?: boolean;
  abstract execute(...args: ClientEvents[K]): Promise<void> | void;
}

/** True when `value` is a constructable event class (not a plain definition object) */
export function isEventClass(
  value: unknown,
): value is new (...args: never[]) => EventDefinition {
  if (typeof value !== 'function') return false;
  const proto = value.prototype as { execute?: unknown } | undefined;
  return proto != null && typeof proto.execute === 'function';
}

/**
 * Normalize a module default export into an EventDefinition.
 * Supports: `event()`, class extending EventHandler, or a pre-built instance.
 */
export function resolveEventExport(exported: unknown): EventDefinition | null {
  if (exported == null) return null;

  if (isEventClass(exported)) {
    const instance = new exported();
    return isEventDefinition(instance) ? instance : null;
  }

  if (isEventDefinition(exported)) {
    return exported;
  }

  return null;
}

function isEventDefinition(value: unknown): value is EventDefinition {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.name != null &&
    typeof obj.execute === 'function'
  );
}
