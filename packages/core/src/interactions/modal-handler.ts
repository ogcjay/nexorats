import type { ModalContext } from './context.js';

/**
 * Abstract modal submit handler.
 *
 * @example
 * export default class ReportModal extends ModalHandler {
 *   customId = 'report';
 *   async execute(ctx) {
 *     const details = ctx.getField('details');
 *     await ctx.reply(`Thanks — received: ${details}`);
 *   }
 * }
 */
export abstract class ModalHandler {
  readonly kind = 'modal' as const;

  /** Exact id, prefix (e.g. `report:`), or RegExp */
  abstract customId: string | RegExp;

  abstract execute(ctx: ModalContext): Promise<void> | void;
}

/** True when `value` is a constructable ModalHandler class */
export function isModalHandlerClass(
  value: unknown,
): value is new (...args: never[]) => ModalHandler {
  return isSubclassOf(value, ModalHandler);
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

/** Normalize a module export into a ModalHandler instance */
export function resolveModalHandlerExport(exported: unknown): ModalHandler | null {
  if (exported == null) return null;

  if (isModalHandlerClass(exported)) {
    const instance = new exported();
    return isModalHandler(instance) ? instance : null;
  }

  if (isModalHandler(exported)) {
    return exported;
  }

  return null;
}

function isModalHandler(value: unknown): value is ModalHandler {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.kind === 'modal' &&
    (typeof obj.customId === 'string' || obj.customId instanceof RegExp) &&
    typeof obj.execute === 'function'
  );
}
