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

/**
 * Type 9 — text (1–3 Text Displays) + accessory (Thumbnail or Button).
 */
export class SectionBuilder {
  private readonly children: TextDisplayBuilder[] = [];
  private accessoryValue?: SectionAccessory;
  private idValue?: number;

  /**
   * Creates a new section builder.
   *
   * @example
   * new SectionBuilder()
   *   .add(text('# Profile'), text('Member since 2024'))
   *   .accessory(thumbnail('https://cdn.example.com/avatar.png'))
   */
  constructor() {}

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

/**
 * Short factory for {@link SectionBuilder}.
 *
 * @param components - Optional text displays or markdown strings to add immediately
 * @example
 * section().add(text('# Title')).accessory(thumbnail('https://…'))
 * @example
 * section('# Title', 'Body text').accessory(thumbnail('https://…'))
 */
export function section(...components: Array<TextDisplayBuilder | string>): SectionBuilder {
  const builder = new SectionBuilder();
  if (components.length > 0) builder.add(...components);
  return builder;
}
