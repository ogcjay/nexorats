import {
  V2ComponentType,
  toAPI,
  warnIfOverComponentLimit,
  type APILabelComponent,
  type ComponentLike,
} from './types.js';

/**
 * Type 18 — modal layout wrapping a label (+ optional description) around an interactive component.
 */
export class LabelBuilder {
  private labelValue: string;
  private descriptionValue?: string;
  private componentValue?: ComponentLike;
  private idValue?: number;

  constructor(label: string) {
    this.labelValue = label;
  }

  setLabel(label: string): this {
    this.labelValue = label;
    return this;
  }

  setDescription(description: string): this {
    this.descriptionValue = description;
    return this;
  }

  description(text: string): this {
    return this.setDescription(text);
  }

  setComponent(component: ComponentLike): this {
    this.componentValue = component;
    return this;
  }

  /** Nested fluent: `label("Name").component(textInput)`. */
  component(component: ComponentLike): this {
    return this.setComponent(component);
  }

  setId(id: number): this {
    this.idValue = id;
    return this;
  }

  validate(): this {
    if (this.labelValue.length > 45) {
      console.warn('[nexorajs] Label: label text exceeds 45 characters.');
    }
    if (this.descriptionValue !== undefined && this.descriptionValue.length > 100) {
      console.warn('[nexorajs] Label: description exceeds 100 characters.');
    }
    if (!this.componentValue) {
      console.warn('[nexorajs] Label: an inner component is required.');
    }
    warnIfOverComponentLimit(this.toJSON(), 'Label');
    return this;
  }

  toJSON(): APILabelComponent {
    if (!this.componentValue) {
      throw new Error('LabelBuilder requires an inner component.');
    }

    const json: APILabelComponent = {
      type: V2ComponentType.Label,
      label: this.labelValue,
      component: toAPI(this.componentValue),
    };
    if (this.descriptionValue !== undefined) json.description = this.descriptionValue;
    if (this.idValue !== undefined) json.id = this.idValue;
    return json;
  }
}

/** Short factory: `label("Choose a user").component(…)`. */
export function label(text: string): LabelBuilder {
  return new LabelBuilder(text);
}
