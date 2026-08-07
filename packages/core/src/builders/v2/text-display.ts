import {
  V2ComponentType,
  warnIfOverComponentLimit,
  type APITextDisplayComponent,
} from './types.js';

/**
 * Type 10 — markdown text content (replaces message `content` under V2).
 */
export class TextDisplayBuilder {
  private contentValue = '';
  private idValue?: number;

  /**
   * Creates a new text display builder.
   *
   * @param content - Markdown content string
   * @example
   * new TextDisplayBuilder('# Hello')
   *   .setId(1)
   */
  constructor(content = '') {
    this.contentValue = content;
  }

  setContent(content: string): this {
    this.contentValue = content;
    return this;
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    warnIfOverComponentLimit(this.toJSON(), 'TextDisplay');
    return this;
  }

  toJSON(): APITextDisplayComponent {
    const json: APITextDisplayComponent = {
      type: V2ComponentType.TextDisplay,
      content: this.contentValue,
    };
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/**
 * Short factory for {@link TextDisplayBuilder}.
 *
 * @param content - Markdown content string
 * @example
 * text('# Hello world')
 */
export function text(content: string): TextDisplayBuilder {
  return new TextDisplayBuilder(content);
}
