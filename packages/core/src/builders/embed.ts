import type {
  APIEmbed,
  APIEmbedAuthor,
  APIEmbedField,
  APIEmbedFooter,
  APIEmbedMedia,
  ColorResolvable,
  JSONEncodable,
} from './types.js';

/** Discord-branded preset colors */
export const EmbedColor = {
  Success: 0x57f287,
  Error: 0xed4245,
  Warn: 0xfee75c,
  Info: 0x5865f2,
  Default: 0x2b2d31,
} as const;

/**
 * Parse a color into a Discord integer.
 * Accepts `0x5865F2`, `5865F2`, `#5865F2`, or a number.
 */
export function resolveColor(color: ColorResolvable): number {
  if (typeof color === 'number') {
    if (!Number.isInteger(color) || color < 0 || color > 0xffffff) {
      throw new RangeError(`Invalid embed color: ${color}`);
    }
    return color;
  }

  const hex = color.startsWith('#') ? color.slice(1) : color.startsWith('0x') ? color.slice(2) : color;
  if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) {
    throw new TypeError(`Invalid embed color string: ${color}`);
  }
  return Number.parseInt(hex, 16);
}

export type EmbedData = APIEmbed;

/**
 * Fluent embed builder — shorter chains and sensible presets vs discord.js.
 */
export class EmbedBuilder implements JSONEncodable<APIEmbed> {
  private readonly data: APIEmbed;

  /**
   * Creates a new embed builder.
   *
   * @param data - Optional partial API embed data to start from
   * @example
   * new EmbedBuilder({ title: 'Hello' })
   *   .description('Welcome!')
   *   .color(0x5865f2)
   *   .timestamp()
   */
  constructor(data: APIEmbed = {}) {
    this.data = { ...data, fields: data.fields ? [...data.fields] : undefined };
  }

  /**
   * Clone from an existing embed / plain API object.
   *
   * @param data - API embed or another {@link EmbedBuilder}
   * @example
   * EmbedBuilder.from(existingEmbed).title('Updated')
   */
  static from(data: APIEmbed | EmbedBuilder): EmbedBuilder {
    return new EmbedBuilder(data instanceof EmbedBuilder ? data.toJSON() : { ...data });
  }

  /**
   * Green success embed.
   *
   * @param title - Optional embed title
   * @param description - Optional embed description
   * @example
   * EmbedBuilder.success('Done', 'User banned.')
   *   .field('Moderator', interaction.user.tag, true)
   *   .timestamp()
   */
  static success(title?: string, description?: string): EmbedBuilder {
    return EmbedBuilder.preset(EmbedColor.Success, title, description);
  }

  /**
   * Red error embed.
   *
   * @param title - Optional embed title
   * @param description - Optional embed description
   * @example
   * EmbedBuilder.error('Failed', 'Missing permissions.')
   */
  static error(title?: string, description?: string): EmbedBuilder {
    return EmbedBuilder.preset(EmbedColor.Error, title, description);
  }

  /**
   * Yellow warning embed.
   *
   * @param title - Optional embed title
   * @param description - Optional embed description
   * @example
   * EmbedBuilder.warn('Careful', 'This action cannot be undone.')
   */
  static warn(title?: string, description?: string): EmbedBuilder {
    return EmbedBuilder.preset(EmbedColor.Warn, title, description);
  }

  /**
   * Blurple info embed.
   *
   * @param title - Optional embed title
   * @param description - Optional embed description
   * @example
   * EmbedBuilder.info('Tip', 'Use /help for commands.')
   */
  static info(title?: string, description?: string): EmbedBuilder {
    return EmbedBuilder.preset(EmbedColor.Info, title, description);
  }

  private static preset(color: number, title?: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder().color(color);
    if (title !== undefined) embed.title(title);
    if (description !== undefined) embed.description(description);
    return embed;
  }

  title(title: string | null): this {
    if (title === null) {
      delete this.data.title;
      return this;
    }
    this.data.title = title;
    return this;
  }

  description(description: string | null): this {
    if (description === null) {
      delete this.data.description;
      return this;
    }
    this.data.description = description;
    return this;
  }

  color(color: ColorResolvable | null): this {
    if (color === null) {
      delete this.data.color;
      return this;
    }
    this.data.color = resolveColor(color);
    return this;
  }

  url(url: string | null): this {
    if (url === null) {
      delete this.data.url;
      return this;
    }
    this.data.url = url;
    return this;
  }

  /**
   * Set timestamp. Pass `Date`, ISO string, unix ms, or omit for now.
   */
  timestamp(value?: Date | string | number | null): this {
    if (value === null) {
      delete this.data.timestamp;
      return this;
    }
    if (value === undefined) {
      this.data.timestamp = new Date().toISOString();
      return this;
    }
    if (value instanceof Date) {
      this.data.timestamp = value.toISOString();
      return this;
    }
    if (typeof value === 'number') {
      this.data.timestamp = new Date(value).toISOString();
      return this;
    }
    this.data.timestamp = new Date(value).toISOString();
    return this;
  }

  footer(text: string, iconURL?: string): this;
  footer(footer: APIEmbedFooter | null): this;
  footer(textOrFooter: string | APIEmbedFooter | null, iconURL?: string): this {
    if (textOrFooter === null) {
      delete this.data.footer;
      return this;
    }
    if (typeof textOrFooter === 'string') {
      const footer: APIEmbedFooter = { text: textOrFooter };
      if (iconURL !== undefined) footer.icon_url = iconURL;
      this.data.footer = footer;
      return this;
    }
    this.data.footer = { ...textOrFooter };
    return this;
  }

  author(name: string, options?: { iconURL?: string; url?: string }): this;
  author(author: APIEmbedAuthor | null): this;
  author(
    nameOrAuthor: string | APIEmbedAuthor | null,
    options?: { iconURL?: string; url?: string },
  ): this {
    if (nameOrAuthor === null) {
      delete this.data.author;
      return this;
    }
    if (typeof nameOrAuthor === 'string') {
      const author: APIEmbedAuthor = { name: nameOrAuthor };
      if (options?.iconURL !== undefined) author.icon_url = options.iconURL;
      if (options?.url !== undefined) author.url = options.url;
      this.data.author = author;
      return this;
    }
    this.data.author = { ...nameOrAuthor };
    return this;
  }

  thumbnail(url: string | null): this;
  thumbnail(media: APIEmbedMedia | null): this;
  thumbnail(urlOrMedia: string | APIEmbedMedia | null): this {
    if (urlOrMedia === null) {
      delete this.data.thumbnail;
      return this;
    }
    this.data.thumbnail = typeof urlOrMedia === 'string' ? { url: urlOrMedia } : { ...urlOrMedia };
    return this;
  }

  image(url: string | null): this;
  image(media: APIEmbedMedia | null): this;
  image(urlOrMedia: string | APIEmbedMedia | null): this {
    if (urlOrMedia === null) {
      delete this.data.image;
      return this;
    }
    this.data.image = typeof urlOrMedia === 'string' ? { url: urlOrMedia } : { ...urlOrMedia };
    return this;
  }

  /** Append a single field */
  field(name: string, value: string, inline?: boolean): this {
    this.data.fields ??= [];
    const field: APIEmbedField = { name, value };
    if (inline !== undefined) field.inline = inline;
    this.data.fields.push(field);
    return this;
  }

  /** Append multiple fields (or replace when `replace` is true) */
  fields(fields: APIEmbedField[], replace = false): this {
    if (replace) {
      this.data.fields = [...fields];
      return this;
    }
    this.data.fields ??= [];
    this.data.fields.push(...fields);
    return this;
  }

  clearFields(): this {
    this.data.fields = [];
    return this;
  }

  /** APIEmbed-compatible plain object (works with `interaction.reply({ embeds })`) */
  toJSON(): APIEmbed {
    const json: APIEmbed = { ...this.data };
    if (this.data.fields) json.fields = this.data.fields.map((f) => ({ ...f }));
    if (this.data.footer) json.footer = { ...this.data.footer };
    if (this.data.author) json.author = { ...this.data.author };
    if (this.data.thumbnail) json.thumbnail = { ...this.data.thumbnail };
    if (this.data.image) json.image = { ...this.data.image };
    return json;
  }
}
