import { randomBytes } from 'node:crypto';
import type {
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageReplyOptions,
  TextBasedChannel,
  User,
} from 'discord.js';
import { ActionRowBuilder } from '../builders/action-row.js';
import { ButtonBuilder } from '../builders/button.js';
import { customId } from '../builders/custom-id.js';
import type { ComponentLike } from '../builders/types.js';
import {
  resolveReplyOptions,
  type BuilderReplyOptions,
  type CommandReplyOptions,
} from '../commands/define.js';

/**
 * Minimal context accepted by prompt helpers.
 * Compatible with {@link import('../commands/define.js').CommandContext}
 * and message-command / channel send paths.
 */
export interface PromptContext {
  interaction?: ChatInputCommandInteraction;
  reply?(options: CommandReplyOptions | string | MessageReplyOptions): Promise<unknown>;
  followUp?(
    options: InteractionReplyOptions | string,
  ): Promise<Message>;
  channel?: TextBasedChannel | null;
  user?: User;
  message?: Message;
}

export interface PromptSendOptions extends BuilderReplyOptions {
  /** Defaults to `true` for interaction replies */
  ephemeral?: boolean;
}

/** Unique `nexora:<base>:<hex>` custom id for this prompt instance */
export function promptCustomId(base: string, suffix = uniqueSuffix()): string {
  return customId(`${base}:${suffix}`, { prefix: true });
}

export function uniqueSuffix(): string {
  return randomBytes(4).toString('hex');
}

export function resolvePromptUserId(ctx: PromptContext): string | undefined {
  return ctx.user?.id ?? ctx.interaction?.user.id ?? ctx.message?.author.id;
}

function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Message).createMessageComponentCollector === 'function'
  );
}

/**
 * Send a prompt payload and return the Message used for collectors.
 */
export async function sendPromptMessage(
  ctx: PromptContext,
  options: PromptSendOptions,
): Promise<Message> {
  const ephemeral = options.ephemeral ?? true;
  const builderPayload: BuilderReplyOptions = {
    ...options,
    ephemeral,
    fetchReply: true,
  };

  if (ctx.interaction) {
    const interaction = ctx.interaction;
    const resolved = resolveReplyOptions(builderPayload);

    if (interaction.replied || interaction.deferred) {
      const followUpOptions =
        typeof resolved === 'string'
          ? ({ content: resolved, ephemeral } satisfies InteractionReplyOptions)
          : ({
              ...(resolved as InteractionReplyOptions),
              ephemeral,
            } satisfies InteractionReplyOptions);

      if (ctx.followUp) {
        return ctx.followUp(followUpOptions);
      }
      return interaction.followUp(followUpOptions);
    }

    if (ctx.reply) {
      const result = await ctx.reply({ ...builderPayload, fetchReply: true });
      if (isMessage(result)) return result;
      return interaction.fetchReply();
    }

    return interaction.reply({
      ...(typeof resolved === 'string'
        ? { content: resolved }
        : (resolved as InteractionReplyOptions)),
      ephemeral,
      fetchReply: true,
    });
  }

  const resolved = resolveReplyOptions({ ...options, ephemeral: undefined });
  const messageOptions: MessageReplyOptions =
    typeof resolved === 'string'
      ? { content: resolved }
      : ({
          content: 'content' in resolved ? resolved.content : undefined,
          embeds: 'embeds' in resolved ? resolved.embeds : undefined,
          components:
            'components' in resolved ? resolved.components : undefined,
          allowedMentions:
            'allowedMentions' in resolved ? resolved.allowedMentions : undefined,
          files: 'files' in resolved ? resolved.files ?? undefined : undefined,
          tts: 'tts' in resolved ? resolved.tts : undefined,
        } as MessageReplyOptions);

  if (ctx.message) {
    return ctx.message.reply(messageOptions);
  }

  const channel = ctx.channel;
  if (channel && 'send' in channel && typeof channel.send === 'function') {
    return channel.send(messageOptions);
  }

  throw new Error(
    'PromptContext requires an interaction, message, or sendable channel',
  );
}

/** Remove interactive components from a prompt message (best-effort). */
export async function clearPromptComponents(message: Message): Promise<void> {
  try {
    if (message.editable) {
      await message.edit({ components: [] });
    }
  } catch {
    // Message may already be deleted or missing permissions
  }
}

/** Disable all buttons / selects in place (best-effort). */
export async function disablePromptComponents(message: Message): Promise<void> {
  try {
    if (!message.editable || message.components.length === 0) return;

    const rows = message.components.map((row) => {
      const rebuilt = new ActionRowBuilder();
      const children =
        'components' in row && Array.isArray(row.components)
          ? row.components
          : [];
      for (const component of children) {
        const data = (
          typeof (component as { toJSON?: () => unknown }).toJSON === 'function'
            ? (component as { toJSON: () => unknown }).toJSON()
            : component
        ) as ComponentLike & { disabled?: boolean; type: number };
        rebuilt.add({ ...data, disabled: true } as never);
      }
      return rebuilt;
    });

    await message.edit({
      components: rows.map((r) => r.toJSON()) as MessageReplyOptions['components'],
    });
  } catch {
    await clearPromptComponents(message);
  }
}

/** Build a standard action row of buttons */
export function buttonRow(...buttons: ButtonBuilder[]): ActionRowBuilder {
  return new ActionRowBuilder().add(...buttons);
}
