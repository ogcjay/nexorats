import type { Interaction } from 'discord.js';
import type { Logger } from '@nexora.ts/logger';

/** Where a caught framework error originated */
export type NexoraErrorSource =
  | 'command'
  | 'autocomplete'
  | 'context-menu'
  | 'message'
  | 'interaction'
  | 'event'
  | 'deferThen';

/** Context passed to {@link NexoraErrorHandler} */
export interface NexoraErrorContext {
  error: unknown;
  source: NexoraErrorSource;
  /** Command / handler label when known */
  command?: string;
  /** Discord event name when `source === 'event'` */
  event?: string;
  userId?: string;
  guildId?: string | null;
  /** Raw interaction when available (commands, autocomplete, components) */
  interaction?: Interaction;
}

/** User-supplied error hook — return value is ignored */
export type NexoraErrorHandler = (
  context: NexoraErrorContext,
) => void | Promise<void>;

/** Default ephemeral message for failed slash / context-menu commands */
export const DEFAULT_COMMAND_ERROR_MESSAGE =
  'An error occurred while executing this command.';

/** Default ephemeral message for failed button / select / modal handlers */
export const DEFAULT_INTERACTION_ERROR_MESSAGE =
  'An error occurred while handling this interaction.';

/** Default message used by `deferThen` when work throws */
export const DEFAULT_DEFER_ERROR_MESSAGE = 'Something went wrong.';

/** Shared error-boundary configuration held by {@link Nexora} */
export interface ErrorBoundaryConfig {
  onError?: NexoraErrorHandler;
  /**
   * User-facing ephemeral message for command / context-menu failures.
   * Also used as fallback for interaction handlers when no dedicated message is set.
   */
  errorMessage?: string;
  /** Override for component / modal handler failures */
  interactionErrorMessage?: string;
  /** Override for `deferThen` failure replies */
  deferErrorMessage?: string;
}

/**
 * Resolve the user-facing message for a given error source.
 *
 * @param config - Optional boundary config from Nexora
 * @param source - Error origin
 */
export function resolveErrorMessage(
  config: ErrorBoundaryConfig | undefined,
  source: NexoraErrorSource,
): string {
  if (source === 'deferThen') {
    return (
      config?.deferErrorMessage ??
      config?.errorMessage ??
      DEFAULT_DEFER_ERROR_MESSAGE
    );
  }
  if (source === 'interaction') {
    return (
      config?.interactionErrorMessage ??
      config?.errorMessage ??
      DEFAULT_INTERACTION_ERROR_MESSAGE
    );
  }
  return config?.errorMessage ?? DEFAULT_COMMAND_ERROR_MESSAGE;
}

/**
 * Invoke the optional `onError` hook; never throws (secondary failures are logged).
 *
 * @param config - Error boundary config
 * @param context - Error context
 * @param logger - Optional logger for hook failures
 */
export async function reportError(
  config: ErrorBoundaryConfig | undefined,
  context: NexoraErrorContext,
  logger?: Logger,
): Promise<void> {
  const handler = config?.onError;
  if (!handler) return;

  try {
    await handler(context);
  } catch (hookError) {
    logger?.error('Nexora onError handler threw', {
      error: hookError instanceof Error ? hookError.message : String(hookError),
      source: context.source,
    });
  }
}

/**
 * Format an unknown error for logs.
 *
 * @param error - Caught value
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
