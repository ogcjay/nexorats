import type { CommandContext } from './define.js';

/**
 * Onion-style command middleware (Express-like).
 *
 * First-registered middleware is outermost: it runs first and wraps everything
 * else. Last-registered runs closest to `execute`.
 *
 * @example
 * bot.useCommand(async (ctx, next) => {
 *   console.log('before', ctx.interaction.commandName);
 *   await next();
 *   console.log('after');
 * });
 */
export type CommandMiddleware = (
  ctx: CommandContext,
  next: () => Promise<void>,
) => void | Promise<void>;

/**
 * Compose middlewares around `execute`.
 * Registration order: first = outermost (runs first).
 */
export function composeCommandMiddleware(
  middlewares: readonly CommandMiddleware[],
  execute: (ctx: CommandContext) => Promise<void> | void,
): (ctx: CommandContext) => Promise<void> {
  return async (ctx) => {
    if (middlewares.length === 0) {
      await execute(ctx);
      return;
    }

    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times in command middleware');
      }
      index = i;

      if (i === middlewares.length) {
        await execute(ctx);
        return;
      }

      const mw = middlewares[i]!;
      await mw(ctx, () => dispatch(i + 1));
    };

    await dispatch(0);
  };
}
