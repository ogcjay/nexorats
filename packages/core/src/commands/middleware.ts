import type { CommandContext } from './define.js';
import type { StudioPipelineStep } from '../studio-telemetry/index.js';

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

/** Optional step recorder for Studio Middleware Pipeline Viewer */
export interface ComposeCommandMiddlewareOptions {
  /** Receives exclusive middleware time and command execute timing */
  onStep?: (step: StudioPipelineStep) => void;
}

/**
 * Compose middlewares around `execute`.
 * Registration order: first = outermost (runs first).
 */
export function composeCommandMiddleware(
  middlewares: readonly CommandMiddleware[],
  execute: (ctx: CommandContext) => Promise<void> | void,
  options?: ComposeCommandMiddlewareOptions,
): (ctx: CommandContext) => Promise<void> {
  const onStep = options?.onStep;

  const wrappedExecute = async (ctx: CommandContext): Promise<void> => {
    if (!onStep) {
      await execute(ctx);
      return;
    }

    const step: StudioPipelineStep = {
      name: 'execute',
      kind: 'command',
      status: 'ok',
      durationMs: 0,
    };
    onStep(step);
    const t0 = performance.now();
    try {
      await execute(ctx);
    } catch (error) {
      step.status = 'error';
      step.detail = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      step.durationMs = performance.now() - t0;
    }
  };

  const wrappedMiddlewares =
    onStep && middlewares.length > 0
      ? middlewares.map((mw, mwIndex) => wrapMiddlewareExclusive(mw, mwIndex, onStep))
      : middlewares;

  return async (ctx) => {
    if (wrappedMiddlewares.length === 0) {
      await wrappedExecute(ctx);
      return;
    }

    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times in command middleware');
      }
      index = i;

      if (i === wrappedMiddlewares.length) {
        await wrappedExecute(ctx);
        return;
      }

      const mw = wrappedMiddlewares[i]!;
      await mw(ctx, () => dispatch(i + 1));
    };

    await dispatch(0);
  };
}

/** Measure exclusive time (before + after `next`, excluding nested work) */
function wrapMiddlewareExclusive(
  mw: CommandMiddleware,
  mwIndex: number,
  onStep: (step: StudioPipelineStep) => void,
): CommandMiddleware {
  return async (ctx, next) => {
    // Push early so pipeline order is outer→inner→execute
    const step: StudioPipelineStep = {
      name: `middleware[${mwIndex}]`,
      kind: 'middleware',
      status: 'ok',
      durationMs: 0,
    };
    onStep(step);

    const start = performance.now();
    let nextStart = 0;
    let nextEnd = 0;
    let nextCalled = false;

    try {
      await mw(ctx, async () => {
        nextCalled = true;
        nextStart = performance.now();
        try {
          await next();
        } finally {
          nextEnd = performance.now();
        }
      });
    } catch (error) {
      step.status = 'error';
      step.detail = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      const end = performance.now();
      step.durationMs = nextCalled
        ? nextStart - start + (end - nextEnd)
        : end - start;
    }
  };
}
