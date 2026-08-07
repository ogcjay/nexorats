import { EmbedBuilder } from '../builders/embed.js';

/** Options for {@link CommandContext.success} / `.error` / `.warn` / `.info` */
export interface StatusReplyOptions {
  /** Embed title (defaults: Success / Error / Warning / Info) */
  title?: string;
  /** Defaults to `true` — status replies are usually private */
  ephemeral?: boolean;
}

type StatusKind = 'success' | 'error' | 'warn' | 'info';

const DEFAULT_TITLES: Record<StatusKind, string> = {
  success: 'Success',
  error: 'Error',
  warn: 'Warning',
  info: 'Info',
};

/** Payload returned by {@link buildStatusReply} — accepted by `ctx.reply` */
export interface StatusReplyPayload {
  embed: EmbedBuilder;
  ephemeral: boolean;
}

/**
 * Build a builder-friendly status reply (colored embed + ephemeral by default).
 * Used by `ctx.success` / `ctx.error` / `ctx.warn` / `ctx.info`.
 */
export function buildStatusReply(
  kind: StatusKind,
  description: string,
  options?: StatusReplyOptions,
): StatusReplyPayload {
  const title = options?.title ?? DEFAULT_TITLES[kind];
  const embed =
    kind === 'success'
      ? EmbedBuilder.success(title, description)
      : kind === 'error'
        ? EmbedBuilder.error(title, description)
        : kind === 'warn'
          ? EmbedBuilder.warn(title, description)
          : EmbedBuilder.info(title, description);

  return {
    embed,
    ephemeral: options?.ephemeral ?? true,
  };
}
