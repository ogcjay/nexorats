import { TextDisplayBuilder, text } from './text-display.js';
import { ThumbnailBuilder } from './thumbnail.js';
import {
  V2ComponentType,
  toAPI,
  warnIfOverComponentLimit,
  type APISectionComponent,
  type APITextDisplayComponent,
  type ComponentLike,
} from './types.js';

export type SectionAccessory = ThumbnailBuilder | ComponentLike;

/** Type 9 — text (1–3 Text Displays) + accessory (Thumbnail or Button). */
export class SectionBuilder {
  private readonly children: TextDisplayBuilder[] = [];
  private accessoryValue?: SectionAccessory;
  private idValue?: number;

  add(...components: Array<TextDisplayBuilder | string>): this {
    for (const component of components) {
      this.children.push(typeof component === 'string' ? text(component) : component);
    }
    return this;
  }

  accessory(component: SectionAccessory): this {
    this.accessoryValue = component;
    return this;
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    if (this.children.length < 1 || this.children.length > 3) {
      console.warn(
        `[nexora.ts] Section: expected 1–3 Text Display children, got ${this.children.length}.`,
      );
    }
    if (!this.accessoryValue) {
      console.warn('[nexora.ts] Section: accessory is required (Thumbnail or Button).');
    }
    warnIfOverComponentLimit(this.toJSON(), 'Section');
    return this;
  }

  toJSON(): APISectionComponent {
    if (!this.accessoryValue) {
      throw new Error('SectionBuilder requires an accessory (Thumbnail or Button).');
    }

    const components: APITextDisplayComponent[] = this.children.map((child) => child.toJSON());
    const accessory = toAPI(this.accessoryValue);

    const json: APISectionComponent = {
      type: V2ComponentType.Section,
      components,
      accessory,
    };
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/** Short factory: `section().add(text("…")).accessory(thumbnail("…"))`. */
export function section(...components: Array<TextDisplayBuilder | string>): SectionBuilder {
  const builder = new SectionBuilder();
  if (components.length > 0) builder.add(...components);
  return builder;
}
