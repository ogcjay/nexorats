import type { Message } from 'discord.js';
import { ComponentType } from 'discord.js';
import { ActionRowBuilder } from '../builders/action-row.js';
import { ButtonBuilder } from '../builders/button.js';
import { EmbedBuilder } from '../builders/embed.js';
import type { APIEmbed, EmbedLike } from '../builders/types.js';
import {
  clearPromptComponents,
  promptCustomId,
  resolvePromptUserId,
  sendPromptMessage,
  uniqueSuffix,
  type PromptContext,
} from './shared.js';

export type PaginatorPage = string | EmbedBuilder | APIEmbed;

export interface PaginatorOptions {
  pages: string[] | EmbedBuilder[] | APIEmbed[];
  /** Collector idle/timeout in ms (default 60_000) */
  timeout?: number;
  /** Ephemeral interaction reply (default true) */
  ephemeral?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  stopLabel?: string;
  /** Restrict button clicks to this user (defaults to ctx user) */
  userId?: string;
  /** Append `Page X/Y` to embed footers (default true for embed pages) */
  pageFooter?: boolean;
}

interface ResolvedPage {
  content?: string;
  embeds?: EmbedLike[];
}

function toAPIEmbed(page: EmbedBuilder | APIEmbed): APIEmbed {
  return page instanceof EmbedBuilder ? page.toJSON() : { ...page };
}

function resolvePages(
  pages: string[] | EmbedBuilder[] | APIEmbed[],
  pageFooter: boolean,
): ResolvedPage[] {
  if (pages.length === 0) {
    throw new Error('Paginator requires at least one page');
  }

  if (typeof pages[0] === 'string') {
    return (pages as string[]).map((content) => ({ content }));
  }

  return (pages as (EmbedBuilder | APIEmbed)[]).map((page, index, arr) => {
    const embed = toAPIEmbed(page);
    if (pageFooter) {
      const marker = `Page ${index + 1}/${arr.length}`;
      const existing = embed.footer?.text;
      embed.footer = {
        ...embed.footer,
        text: existing ? `${existing} · ${marker}` : marker,
      };
    }
    return { embeds: [embed] };
  });
}

/**
 * Paginate string content or embeds with prev / next / stop buttons.
 *
 * @example
 * const paginator = new EmbedPaginator({
 *   pages: [EmbedBuilder.info('Page 1'), EmbedBuilder.info('Page 2')],
 * });
 * await paginator.send(ctx);
 */
export class EmbedPaginator {
  private readonly pages: ResolvedPage[];
  private readonly timeout: number;
  private readonly ephemeral: boolean;
  private readonly prevLabel: string;
  private readonly nextLabel: string;
  private readonly stopLabel: string;
  private readonly userId?: string;

  /**
   * Creates an embed/string paginator.
   *
   * @param options - Pages and optional timeout, labels, ephemeral, user lock
   * @example
   * const paginator = new EmbedPaginator({
   *   pages: ['Page 1', 'Page 2', 'Page 3'],
   *   timeout: 60_000,
   *   ephemeral: true,
   * });
   */
  constructor(options: PaginatorOptions) {
    this.pages = resolvePages(options.pages, options.pageFooter ?? true);
    this.timeout = options.timeout ?? 60_000;
    this.ephemeral = options.ephemeral ?? true;
    this.prevLabel = options.prevLabel ?? 'Previous';
    this.nextLabel = options.nextLabel ?? 'Next';
    this.stopLabel = options.stopLabel ?? 'Stop';
    this.userId = options.userId;
  }

  /** Number of pages */
  get size(): number {
    return this.pages.length;
  }

  /**
   * Send the paginator and run a component collector until stop / timeout.
   * Returns the prompt message.
   *
   * @param ctx - Command or interaction context that can send a message
   * @returns The prompt message (after collector ends)
   * @example
   * await new EmbedPaginator({ pages: embeds }).send(ctx);
   */
  async send(ctx: PromptContext): Promise<Message> {
    const suffix = uniqueSuffix();
    const prevId = promptCustomId('pag:prev', suffix);
    const nextId = promptCustomId('pag:next', suffix);
    const stopId = promptCustomId('pag:stop', suffix);
    const allowedUserId = this.userId ?? resolvePromptUserId(ctx);

    let index = 0;

    const buildRow = (pageIndex: number) =>
      new ActionRowBuilder().add(
        new ButtonBuilder()
          .customId(prevId)
          .label(this.prevLabel)
          .secondary()
          .disabled(pageIndex <= 0),
        new ButtonBuilder()
          .customId(nextId)
          .label(this.nextLabel)
          .secondary()
          .disabled(pageIndex >= this.pages.length - 1),
        new ButtonBuilder().customId(stopId).label(this.stopLabel).danger(),
      );

    const pagePayload = (pageIndex: number) => {
      const page = this.pages[pageIndex]!;
      return {
        content: page.content,
        embeds: page.embeds,
        components: [buildRow(pageIndex)],
      };
    };

    const message = await sendPromptMessage(ctx, {
      ...pagePayload(0),
      ephemeral: this.ephemeral,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.timeout,
      filter: (interaction) => {
        if (allowedUserId && interaction.user.id !== allowedUserId) {
          void interaction.reply({
            content: 'Only the command author can use these buttons.',
            ephemeral: true,
          });
          return false;
        }
        return (
          interaction.customId === prevId ||
          interaction.customId === nextId ||
          interaction.customId === stopId
        );
      },
    });

    return new Promise<Message>((resolve) => {
      collector.on('collect', async (interaction) => {
        try {
          if (interaction.customId === stopId) {
            collector.stop('stop');
            await interaction.update({ components: [] }).catch(() => undefined);
            return;
          }

          if (interaction.customId === prevId) {
            index = Math.max(0, index - 1);
          } else if (interaction.customId === nextId) {
            index = Math.min(this.pages.length - 1, index + 1);
          }

          const next = pagePayload(index);
          await interaction.update({
            content: next.content ?? null,
            embeds: (next.embeds ?? []) as never,
            components: next.components.map((row) => row.toJSON()) as never,
          });
        } catch {
          collector.stop('error');
        }
      });

      collector.on('end', async (_collected, reason) => {
        if (reason !== 'stop') {
          await clearPromptComponents(message);
        }
        resolve(message);
      });
    });
  }
}

/** Alias for {@link EmbedPaginator} */
export { EmbedPaginator as Paginator };
