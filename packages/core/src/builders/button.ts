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
 * Fluent button builder producing Discord API button components (type 2).
 *
 * @example
 * new ButtonBuilder()
 *   .customId('confirm', { prefix: true }) // nexora:confirm
 *   .label('Confirm')
 *   .success()
 */
export class ButtonBuilder implements JSONEncodable<APIButtonComponent> {
  private readonly data: Partial<APIButtonComponent> & { type: typeof ComponentType.Button } = {
    type: ComponentType.Button,
    style: ButtonStyle.Primary,
  };

  static from(data: APIButtonComponent | ButtonBuilder): ButtonBuilder {
    const raw = data instanceof ButtonBuilder ? data.toJSON() : data;
    const builder = new ButtonBuilder();
    Object.assign(builder.data, raw);
    return builder;
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
