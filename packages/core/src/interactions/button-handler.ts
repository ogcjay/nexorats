import type { ComponentContext } from './context.js';

/**
 * Abstract button interaction handler.
 *
 * @example
 * export default class DeleteConfirm extends ButtonHandler {
 *   customId = 'delete:confirm'; // or /delete:.+/
 *   async execute(ctx) {
 *     await ctx.update('Deleted.');
 *   }
 * }
 */
export abstract class ButtonHandler {
  readonly kind = 'button' as const;

  /** Exact id, prefix (e.g. `delete:`), or RegExp */
  abstract customId: string | RegExp;

  abstract execute(ctx: ComponentContext): Promise<void> | void;
}

/**
 * Functional button handler — same discovery as `extends ButtonHandler`.
 *
 * @example
 * export default button('delete:confirm', async (ctx) => {
 *   await ctx.update('Deleted.');
 * });
 */
export function button(
  customId: string | RegExp,
  execute: (ctx: ComponentContext) => Promise<void> | void,
): ButtonHandler {
  return { kind: 'button', customId, execute };
}

/** True when `value` is a constructable ButtonHandler class */
export function isButtonHandlerClass(
  value: unknown,
): value is new (...args: never[]) => ButtonHandler {
  return isSubclassOf(value, ButtonHandler);
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

/** Normalize a module export into a ButtonHandler instance */
export function resolveButtonHandlerExport(exported: unknown): ButtonHandler | null {
  if (exported == null) return null;

  if (isButtonHandlerClass(exported)) {
    const instance = new exported();
    return isButtonHandler(instance) ? instance : null;
  }

  if (isButtonHandler(exported)) {
    return exported;
  }

  return null;
}

function isButtonHandler(value: unknown): value is ButtonHandler {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.kind === 'button' &&
    (typeof obj.customId === 'string' || obj.customId instanceof RegExp) &&
    typeof obj.execute === 'function'
  );
}
