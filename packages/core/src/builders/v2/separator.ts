import {
  SeparatorSpacing,
  V2ComponentType,
  warnIfOverComponentLimit,
  type APISeparatorComponent,
  type SeparatorSpacingValue,
} from './types.js';

export interface SeparatorOptions {
  divider?: boolean;
  spacing?: SeparatorSpacingValue;
}

/** Type 14 — vertical padding / optional divider between components. */
export class SeparatorBuilder {
  private dividerValue?: boolean;
  private spacingValue?: SeparatorSpacingValue;
  private idValue?: number;

  constructor(options: SeparatorOptions = {}) {
    if (options.divider !== undefined) this.dividerValue = options.divider;
    if (options.spacing !== undefined) this.spacingValue = options.spacing;
  }

  setDivider(divider = true): this {
    this.dividerValue = divider;
    return this;
  }

  /** Alias for `setDivider(true)`. */
  divider(enabled = true): this {
    return this.setDivider(enabled);
  }

  setSpacing(spacing: SeparatorSpacingValue): this {
    this.spacingValue = spacing;
    return this;
  }

  small(): this {
    return this.setSpacing(SeparatorSpacing.Small);
  }

  large(): this {
    return this.setSpacing(SeparatorSpacing.Large);
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    warnIfOverComponentLimit(this.toJSON(), 'Separator');
    return this;
  }

  toJSON(): APISeparatorComponent {
    const json: APISeparatorComponent = {
      type: V2ComponentType.Separator,
    };
    if (this.dividerValue !== undefined) json.divider = this.dividerValue;
    if (this.spacingValue !== undefined) json.spacing = this.spacingValue;
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/** Short factory: `separator()` / `separator({ spacing: 2 })`. */
export function separator(options?: SeparatorOptions): SeparatorBuilder {
  return new SeparatorBuilder(options);
}
