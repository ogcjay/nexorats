import {
  V2ComponentType,
  resolveAccentColor,
  toAPI,
  warnIfOverComponentLimit,
  type APIContainerComponent,
  type ComponentLike,
} from './types.js';

/**
 * Type 17 — visual group with optional accent color.
 *
 * Named `LayoutContainerBuilder` (not `Container`) to avoid colliding with the DI Container.
 * Alias: `MessageContainerBuilder`.
 */
export class LayoutContainerBuilder {
  private readonly children: ComponentLike[] = [];
  private accentValue?: number | null;
  private spoilerValue?: boolean;
  private idValue?: number;

  add(...components: ComponentLike[]): this {
    for (const component of components) {
      this.children.push(component);
    }
    return this;
  }

  accent(color: number | string | null): this {
    this.accentValue = color === null ? null : resolveAccentColor(color);
    return this;
  }

  setAccentColor(color: number | string | null): this {
    return this.accent(color);
  }

  setSpoiler(spoiler = true): this {
    this.spoilerValue = spoiler;
    return this;
  }

  spoiler(enabled = true): this {
    return this.setSpoiler(enabled);
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    warnIfOverComponentLimit(this.toJSON(), 'LayoutContainer');
    return this;
  }

  toJSON(): APIContainerComponent {
    const json: APIContainerComponent = {
      type: V2ComponentType.Container,
      components: this.children.map((child) => toAPI(child)),
    };
    if (this.accentValue !== undefined) json.accent_color = this.accentValue;
    if (this.spoilerValue !== undefined) json.spoiler = this.spoilerValue;
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/** Alias preferred when the value is specifically a message layout container. */
export type MessageContainerBuilder = LayoutContainerBuilder;
export const MessageContainerBuilder = LayoutContainerBuilder;

/** Short factory: `container().accent(0x5865f2).add(text("…"))`. */
export function container(...components: ComponentLike[]): LayoutContainerBuilder {
  const builder = new LayoutContainerBuilder();
  if (components.length > 0) builder.add(...components);
  return builder;
}
