import { resolveCustomId, type CustomIdOptions } from './custom-id.js';
import {
  ButtonStyle,
  ComponentType,
  type APIButtonComponent,
  type APIPartialEmoji,
  type ButtonStyleValue,
  type JSONEncodable,
} from './types.js';

export type { CustomIdOptions };

function parseEmoji(emoji: string | APIPartialEmoji): APIPartialEmoji {
  if (typeof emoji !== 'string') return { ...emoji };

  const custom = emoji.match(/^<(a?):(\w+):(\d+)>$/);
  if (custom) {
    return {
      animated: custom[1] === 'a',
      name: custom[2],
      id: custom[3],
    };
  }

  return { name: emoji };
}

/**
 * Fluent button builder for Discord API buttons (type 2).
 */
export class ButtonBuilder implements JSONEncodable<APIButtonComponent> {
  private readonly data: Partial<APIButtonComponent> & { type: typeof ComponentType.Button } = {
    type: ComponentType.Button,
    style: ButtonStyle.Primary,
  };

  /**
   * Creates a new button builder.
   *
   * @example
   * new ButtonBuilder()
   *   .customId('confirm', { prefix: true }) // nexora:confirm
   *   .label('Confirm')
   *   .success()
   */
  constructor() {}

  /**
   * Clone from an existing button builder or plain API button object.
   *
   * @param data - API button component or another {@link ButtonBuilder}
   * @example
   * ButtonBuilder.from(existingButton)
   *   .label('Updated')
   */
  static from(data: APIButtonComponent | ButtonBuilder): ButtonBuilder {
    const raw = data instanceof ButtonBuilder ? data.toJSON() : data;
    const builder = new ButtonBuilder();
    Object.assign(builder.data, raw);
    return builder;
  }

  /**
   * One-liner: primary (blurple) button.
   *
   * @param customId - Button custom_id (optionally namespaced via `options`)
   * @param label - Visible button label
   * @param options - Optional customId prefix options
   * @example
   * ButtonBuilder.primary('confirm', 'Confirm', { prefix: true })
   */
  static primary(customId: string, label: string, options?: CustomIdOptions): ButtonBuilder {
    return new ButtonBuilder().customId(customId, options).label(label).primary();
  }

  /**
   * One-liner: secondary (grey) button.
   *
   * @param customId - Button custom_id (optionally namespaced via `options`)
   * @param label - Visible button label
   * @param options - Optional customId prefix options
   * @example
   * ButtonBuilder.secondary('cancel', 'Cancel')
   */
  static secondary(customId: string, label: string, options?: CustomIdOptions): ButtonBuilder {
    return new ButtonBuilder().customId(customId, options).label(label).secondary();
  }

  /**
   * One-liner: success (green) button.
   *
   * @param customId - Button custom_id (optionally namespaced via `options`)
   * @param label - Visible button label
   * @param options - Optional customId prefix options
   * @example
   * ButtonBuilder.success('approve', 'Approve')
   */
  static success(customId: string, label: string, options?: CustomIdOptions): ButtonBuilder {
    return new ButtonBuilder().customId(customId, options).label(label).success();
  }

  /**
   * One-liner: danger (red) button.
   *
   * @param customId - Button custom_id (optionally namespaced via `options`)
   * @param label - Visible button label
   * @param options - Optional customId prefix options
   * @example
   * ButtonBuilder.danger('delete', 'Delete')
   */
  static danger(customId: string, label: string, options?: CustomIdOptions): ButtonBuilder {
    return new ButtonBuilder().customId(customId, options).label(label).danger();
  }

  /**
   * One-liner: link button (no customId).
   *
   * @param url - Destination URL
   * @param label - Visible button label
   * @example
   * ButtonBuilder.link('https://discord.com', 'Open Discord')
   */
  static link(url: string, label: string): ButtonBuilder {
    return new ButtonBuilder().label(label).link(url);
  }

  /**
   * Set custom_id. Use `{ prefix: true }` for `nexora:<id>`.
   * Not allowed together with Link style / url.
   */
  customId(id: string, options?: CustomIdOptions): this {
    this.data.custom_id = resolveCustomId(id, options);
    return this;
  }

  label(label: string): this {
    this.data.label = label;
    return this;
  }

  style(style: ButtonStyleValue): this {
    this.data.style = style;
    if (style !== ButtonStyle.Link) {
      delete this.data.url;
    }
    return this;
  }

  /** Style shortcut: Primary (1) */
  primary(): this {
    return this.style(ButtonStyle.Primary);
  }

  /** Style shortcut: Secondary (2) */
  secondary(): this {
    return this.style(ButtonStyle.Secondary);
  }

  /** Style shortcut: Success (3) */
  success(): this {
    return this.style(ButtonStyle.Success);
  }

  /** Style shortcut: Danger (4) */
  danger(): this {
    return this.style(ButtonStyle.Danger);
  }

  /**
   * Link button (style 5). Sets url and clears custom_id.
   */
  link(url: string): this {
    this.data.style = ButtonStyle.Link;
    this.data.url = url;
    delete this.data.custom_id;
    return this;
  }

  url(url: string): this {
    this.data.style = ButtonStyle.Link;
    this.data.url = url;
    delete this.data.custom_id;
    return this;
  }

  emoji(emoji: string | APIPartialEmoji): this {
    this.data.emoji = parseEmoji(emoji);
    return this;
  }

  disabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  toJSON(): APIButtonComponent {
    const style = this.data.style ?? ButtonStyle.Primary;

    if (style === ButtonStyle.Link) {
      if (!this.data.url) {
        throw new Error('Link buttons require a url');
      }
      const json: APIButtonComponent = {
        type: ComponentType.Button,
        style: ButtonStyle.Link,
        url: this.data.url,
      };
      if (this.data.label !== undefined) json.label = this.data.label;
      if (this.data.emoji !== undefined) json.emoji = { ...this.data.emoji };
      if (this.data.disabled !== undefined) json.disabled = this.data.disabled;
      return json;
    }

    if (!this.data.custom_id) {
      throw new Error('Non-link buttons require a customId');
    }

    const json: APIButtonComponent = {
      type: ComponentType.Button,
      style,
      custom_id: this.data.custom_id,
    };
    if (this.data.label !== undefined) json.label = this.data.label;
    if (this.data.emoji !== undefined) json.emoji = { ...this.data.emoji };
    if (this.data.disabled !== undefined) json.disabled = this.data.disabled;
    return json;
  }
}

/**
 * Beginner-friendly button shortcuts — same as {@link ButtonBuilder} statics.
 *
 * @example
 * row(btn.primary('yes', 'Yes'), btn.danger('no', 'No'))
 * @example
 * btn.link('https://example.com', 'Docs')
 */
export const btn = {
  primary: ButtonBuilder.primary.bind(ButtonBuilder) as typeof ButtonBuilder.primary,
  secondary: ButtonBuilder.secondary.bind(ButtonBuilder) as typeof ButtonBuilder.secondary,
  success: ButtonBuilder.success.bind(ButtonBuilder) as typeof ButtonBuilder.success,
  danger: ButtonBuilder.danger.bind(ButtonBuilder) as typeof ButtonBuilder.danger,
  link: ButtonBuilder.link.bind(ButtonBuilder) as typeof ButtonBuilder.link,
} as const;
