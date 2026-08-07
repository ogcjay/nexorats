import { ComponentType, type Message } from 'discord.js';
import { ActionRowBuilder } from '../builders/action-row.js';
import { StringSelectBuilder, type SelectOptionInput } from '../builders/select.js';
import {
  clearPromptComponents,
  promptCustomId,
  resolvePromptUserId,
  sendPromptMessage,
  uniqueSuffix,
  type PromptContext,
} from './shared.js';

export interface ChoicePromptOption extends SelectOptionInput {}

export interface ChoicePromptOptions {
  placeholder?: string;
  options: ChoicePromptOption[];
  /** Collector timeout in ms (default 60_000) */
  timeout?: number;
  /** Ephemeral interaction reply (default true) */
  ephemeral?: boolean;
  /** Optional message content above the select */
  content?: string;
  /** Restrict select to this user (defaults to ctx user) */
  userId?: string;
}

/**
 * String-select choice prompt. Returns the selected value, or `null` on timeout.
 *
 * @example
 * const value = await ChoicePrompt.ask(ctx, {
 *   placeholder: 'Pick a role',
 *   options: [
 *     { label: 'Admin', value: 'admin' },
 *     { label: 'Mod', value: 'mod' },
 *   ],
 *   timeout: 60_000,
 * });
 */
export class ChoicePrompt {
  /**
   * Prompt the user with a string select menu.
   *
   * @param ctx - Command or interaction context that can send a message
   * @param options - Select options, placeholder, timeout, ephemeral, user lock
   * @returns The selected option value, or `null` on timeout
   * @example
   * const value = await ChoicePrompt.ask(ctx, {
   *   placeholder: 'Pick a role',
   *   options: [
   *     { label: 'Admin', value: 'admin' },
   *     { label: 'Mod', value: 'mod' },
   *   ],
   * });
   */
  static async ask(
    ctx: PromptContext,
    options: ChoicePromptOptions,
  ): Promise<string | null> {
    if (!options.options?.length) {
      throw new Error('ChoicePrompt requires at least one option');
    }
    if (options.options.length > 25) {
      throw new Error('ChoicePrompt supports at most 25 options');
    }

    const suffix = uniqueSuffix();
    const selectId = promptCustomId('choice', suffix);
    const timeout = options.timeout ?? 60_000;
    const ephemeral = options.ephemeral ?? true;
    const allowedUserId = options.userId ?? resolvePromptUserId(ctx);
    const placeholder = options.placeholder ?? 'Select an option';

    const select = new StringSelectBuilder()
      .customId(selectId)
      .placeholder(placeholder)
      .values(1)
      .options(options.options);

    const row = new ActionRowBuilder().add(select);

    const message = await sendPromptMessage(ctx, {
      content: options.content,
      components: [row],
      ephemeral,
    });

    return collectChoice(message, {
      selectId,
      timeout,
      allowedUserId,
    });
  }
}

async function collectChoice(
  message: Message,
  opts: {
    selectId: string;
    timeout: number;
    allowedUserId?: string;
  },
): Promise<string | null> {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: opts.timeout,
    max: 1,
    filter: (interaction) => {
      if (opts.allowedUserId && interaction.user.id !== opts.allowedUserId) {
        void interaction.reply({
          content: 'Only the command author can use this menu.',
          ephemeral: true,
        });
        return false;
      }
      return interaction.customId === opts.selectId;
    },
  });

  return new Promise<string | null>((resolve) => {
    let value: string | null = null;

    collector.on('collect', async (interaction) => {
      value = interaction.values[0] ?? null;
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
      resolve(value);
    });
  });
}
