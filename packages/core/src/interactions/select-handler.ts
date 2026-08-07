import type { ComponentContext } from './context.js';

/**
 * Base select-menu handler (string / user / role / mentionable / channel).
 * Prefer {@link StringSelectHandler} for classic string selects.
 *
 * @example
 * export default class RolePick extends SelectHandler {
 *   customId = 'role-pick';
 *   async execute(ctx) {
 *     await ctx.update(`Chose: ${ctx.values.join(', ')}`);
 *   }
 * }
 */
export abstract class SelectHandler {
  readonly kind = 'select' as const;

  /** Exact id, prefix (e.g. `role:`), or RegExp */
  abstract customId: string | RegExp;

  abstract execute(ctx: ComponentContext): Promise<void> | void;
}

/**
 * String select menu handler.
 *
 * @example
 * export default class RolePick extends StringSelectHandler {
 *   customId = 'role-pick';
 *   async execute(ctx) {
 *     await ctx.update(`Chose: ${ctx.values.join(', ')}`);
 *   }
 * }
 */
export abstract class StringSelectHandler extends SelectHandler {}

/**
 * Functional select handler — same discovery as `extends SelectHandler`.
 *
 * @param customId - Exact id, prefix (e.g. `role:`), or RegExp
 * @param execute - Handler receiving {@link ComponentContext}
 * @returns A discoverable select handler object
 * @example
 * export default select('role-pick', async (ctx) => {
 *   await ctx.update(`Chose: ${ctx.values.join(', ')}`);
 * });
 */
export function select(
  customId: string | RegExp,
  execute: (ctx: ComponentContext) => Promise<void> | void,
): SelectHandler {
  return { kind: 'select', customId, execute };
}

/** True when `value` is a constructable SelectHandler class */
export function isSelectHandlerClass(
  value: unknown,
): value is new (...args: never[]) => SelectHandler {
  return isSubclassOf(value, SelectHandler);
}

function isSubclassOf(ctor: unknown, base: abstract new (...args: never[]) => unknown): boolean {
  if (typeof ctor !== 'function') return false;
  let proto = Object.getPrototypeOf(ctor);
  while (proto && proto !== Function.prototype) {
    if (proto === base) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

/** Normalize a module export into a SelectHandler instance */
export function resolveSelectHandlerExport(exported: unknown): SelectHandler | null {
  if (exported == null) return null;

  if (isSelectHandlerClass(exported)) {
    const instance = new exported();
    return isSelectHandler(instance) ? instance : null;
  }

  if (isSelectHandler(exported)) {
    return exported;
  }

  return null;
}

function isSelectHandler(value: unknown): value is SelectHandler {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.kind === 'select' &&
    (typeof obj.customId === 'string' || obj.customId instanceof RegExp) &&
    typeof obj.execute === 'function'
  );
}
