import {
  V2ComponentType,
  attachmentUrl,
  warnIfOverComponentLimit,
  type APIFileComponent,
  type UnfurledMediaItem,
} from './types.js';

/** Type 13 — displays an uploaded attachment (`attachment://filename`). */
export class FileBuilder {
  private fileValue: UnfurledMediaItem;
  private spoilerValue?: boolean;
  private idValue?: number;

  constructor(file: string) {
    this.fileValue = { url: attachmentUrl(file) };
  }

  setFile(file: string): this {
    this.fileValue = { url: attachmentUrl(file) };
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
    if (!this.fileValue.url.startsWith('attachment://')) {
      console.warn(
        '[nexora.ts] File: Discord only accepts attachment:// URLs for File components.',
      );
    }
    warnIfOverComponentLimit(this.toJSON(), 'File');
    return this;
  }

  toJSON(): APIFileComponent {
    const json: APIFileComponent = {
      type: V2ComponentType.File,
      file: this.fileValue,
    };
    if (this.spoilerValue !== undefined) json.spoiler = this.spoilerValue;
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/**
 * Short factory: `file("game.zip")` or `file("attachment://game.zip")`.
 * Bare filenames are prefixed with `attachment://`.
 */
export function file(name: string): FileBuilder {
  return new FileBuilder(name);
}
