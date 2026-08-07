import {
  V2ComponentType,
  warnIfOverComponentLimit,
  type APIMediaGalleryComponent,
  type APIMediaGalleryItem,
} from './types.js';

export interface MediaGalleryItemInput {
  url: string;
  description?: string | null;
  spoiler?: boolean;
}

/** Type 12 — 1–10 media items in a gallery. */
export class MediaGalleryBuilder {
  private readonly galleryItems: APIMediaGalleryItem[] = [];
  private idValue?: number;

  add(...items: Array<MediaGalleryItemInput | string>): this {
    for (const item of items) {
      if (typeof item === 'string') {
        this.galleryItems.push({ media: { url: item } });
        continue;
      }
      const entry: APIMediaGalleryItem = { media: { url: item.url } };
      if (item.description !== undefined) entry.description = item.description;
      if (item.spoiler !== undefined) entry.spoiler = item.spoiler;
      this.galleryItems.push(entry);
    }
    return this;
  }

  item(url: string, options?: Omit<MediaGalleryItemInput, 'url'>): this {
    return this.add({ url, ...options });
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    if (this.galleryItems.length < 1 || this.galleryItems.length > 10) {
      console.warn(
        `[nexora.ts] MediaGallery: expected 1–10 items, got ${this.galleryItems.length}.`,
      );
    }
    warnIfOverComponentLimit(this.toJSON(), 'MediaGallery');
    return this;
  }

  toJSON(): APIMediaGalleryComponent {
    const json: APIMediaGalleryComponent = {
      type: V2ComponentType.MediaGallery,
      items: this.galleryItems.map((item) => ({ ...item })),
    };
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/** Short factory: `gallery("https://a.png", { url: "https://b.png" })`. */
export function gallery(...items: Array<MediaGalleryItemInput | string>): MediaGalleryBuilder {
  const builder = new MediaGalleryBuilder();
  if (items.length > 0) builder.add(...items);
  return builder;
}

/** Alias matching Discord naming. */
export const mediaGallery = gallery;
