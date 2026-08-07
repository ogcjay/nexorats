import {
  V2ComponentType,
  warnIfOverComponentLimit,
  type APIThumbnailComponent,
  type UnfurledMediaItem,
} from './types.js';

/**
 * Type 11 — small image accessory for sections.
 */
export class ThumbnailBuilder {
  private mediaValue: UnfurledMediaItem;
  private descriptionValue?: string | null;
  private spoilerValue?: boolean;
  private idValue?: number;

  /**
   * Creates a new thumbnail builder.
   *
   * @param url - Image URL (https or attachment://)
   * @example
   * new ThumbnailBuilder('https://cdn.example.com/avatar.png')
   *   .setDescription('User avatar')
   */
  constructor(url: string) {
    this.mediaValue = { url };
  }

  setURL(url: string): this {
    this.mediaValue = { url };
    return this;
  }

  setDescription(description: string | null): this {
    this.descriptionValue = description;
    return this;
  }

  setSpoiler(spoiler = true): this {
    this.spoilerValue = spoiler;
    return this;
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    warnIfOverComponentLimit(this.toJSON(), 'Thumbnail');
    return this;
  }

  toJSON(): APIThumbnailComponent {
    const json: APIThumbnailComponent = {
      type: V2ComponentType.Thumbnail,
      media: this.mediaValue,
    };
    if (this.descriptionValue !== undefined) json.description = this.descriptionValue;
    if (this.spoilerValue !== undefined) json.spoiler = this.spoilerValue;
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/**
 * Short factory for {@link ThumbnailBuilder}.
 *
 * @param url - Image URL (https or attachment://)
 * @example
 * thumbnail('https://cdn.example.com/icon.png')
 */
export function thumbnail(url: string): ThumbnailBuilder {
  return new ThumbnailBuilder(url);
}
