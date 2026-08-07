import { ComponentType, type Message } from 'discord.js';
import { ActionRowBuilder } from '../builders/action-row.js';
import { ButtonBuilder } from '../builders/button.js';
import { EmbedBuilder } from '../builders/embed.js';
import {
  clearPromptComponents,
  promptCustomId,
  resolvePromptUserId,
  sendPromptMessage,
  uniqueSuffix,
  type PromptContext,
} from './shared.js';

export interface ConfirmDialogOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Collector timeout in ms (default 30_000) */
  timeout?: number;
  /** Ephemeral interaction reply (default true) */
  ephemeral?: boolean;
  /** Optional plain content instead of / in addition to the embed */
  content?: string;
  /** Restrict button clicks to this user (defaults to ctx user) */
  userId?: string;
}

/**
 * Yes/No confirm dialog via buttons + collector.
 *
 * @example
 * const ok = await ConfirmDialog.ask(ctx, {
 *   title: 'Delete?',
 *   description: 'Cannot undo',
 *   confirmLabel: 'Delete',
 *   cancelLabel: 'Cancel',
 *   timeout: 30_000,
 * });
 */
export class ConfirmDialog {
  static async ask(
    ctx: PromptContext,
    options: ConfirmDialogOptions = {},
  ): Promise<boolean> {
    const suffix = uniqueSuffix();
    const confirmId = promptCustomId('confirm:yes', suffix);
    const cancelId = promptCustomId('confirm:no', suffix);
    const timeout = options.timeout ?? 30_000;
    const ephemeral = options.ephemeral ?? true;
    const allowedUserId = options.userId ?? resolvePromptUserId(ctx);

    const title = options.title ?? 'Confirm';
    const description = options.description ?? 'Are you sure?';
    const confirmLabel = options.confirmLabel ?? 'Confirm';
    const cancelLabel = options.cancelLabel ?? 'Cancel';

    const row = new ActionRowBuilder().add(
      new ButtonBuilder().customId(confirmId).label(confirmLabel).danger(),
      new ButtonBuilder().customId(cancelId).label(cancelLabel).secondary(),
    );

    const message = await sendPromptMessage(ctx, {
      content: options.content,
      embeds: [EmbedBuilder.warn(title, description)],
      components: [row],
      ephemeral,
    });

    return collectConfirm(message, {
      confirmId,
      cancelId,
      timeout,
      allowedUserId,
    });
  }
}

async function collectConfirm(
  message: Message,
  opts: {
    confirmId: string;
    cancelId: string;
    timeout: number;
    allowedUserId?: string;
  },
): Promise<boolean> {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: opts.timeout,
    max: 1,
    filter: (interaction) => {
      if (opts.allowedUserId && interaction.user.id !== opts.allowedUserId) {
        void interaction.reply({
          content: 'Only the command author can use these buttons.',
          ephemeral: true,
        });
        return false;
      }
      return (
        interaction.customId === opts.confirmId ||
        interaction.customId === opts.cancelId
      );
    },
  });

  return new Promise<boolean>((resolve) => {
    let result = false;

    collector.on('collect', async (interaction) => {
      result = interaction.customId === opts.confirmId;
      try {
        await interaction.update({ components: [] });
      } catch {
        await clearPromptComponents(message);
      }
    });

    collector.on('end', async () => {
      if (collector.collected.size === 0) {
        await clearPromptComponents(message);
      }
      resolve(result);
    });
  });
}
