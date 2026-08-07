import { ActionRowBuilder } from './action-row.js';
import { resolveCustomId, type CustomIdOptions } from './custom-id.js';
import {
  ComponentType,
  TextInputStyle,
  type APIModalComponent,
  type APITextInputComponent,
  type JSONEncodable,
  type TextInputStyleValue,
} from './types.js';

/**
 * Text input component for modals (type 4).
 *
 * @example
 * new TextInputBuilder()
 *   .customId('reason', { prefix: true })
 *   .label('Reason')
 *   .paragraph()
 *   .required()
 */
export class TextInputBuilder implements JSONEncodable<APITextInputComponent> {
  private readonly data: Partial<APITextInputComponent> & {
    type: typeof ComponentType.TextInput;
  } = {
    type: ComponentType.TextInput,
    style: TextInputStyle.Short,
  };

  static from(data: APITextInputComponent | TextInputBuilder): TextInputBuilder {
    const raw = data instanceof TextInputBuilder ? data.toJSON() : data;
    const builder = new TextInputBuilder();
    Object.assign(builder.data, raw);
    return builder;
  }

  customId(id: string, options?: CustomIdOptions): this {
    this.data.custom_id = resolveCustomId(id, options);
    return this;
  }

  label(label: string): this {
    this.data.label = label;
    return this;
  }

  style(style: TextInputStyleValue): this {
    this.data.style = style;
    return this;
  }

  /** Style shortcut: Short (1) */
  short(): this {
    return this.style(TextInputStyle.Short);
  }

  /** Style shortcut: Paragraph (2) */
  paragraph(): this {
    return this.style(TextInputStyle.Paragraph);
  }

  placeholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  value(value: string): this {
    this.data.value = value;
    return this;
  }

  minLength(min: number): this {
    this.data.min_length = min;
    return this;
  }

  maxLength(max: number): this {
    this.data.max_length = max;
    return this;
  }

  required(required = true): this {
    this.data.required = required;
    return this;
  }

  toJSON(): APITextInputComponent {
    if (!this.data.custom_id) {
      throw new Error('Text inputs require a customId');
    }
    if (!this.data.label) {
      throw new Error('Text inputs require a label');
    }

    const json: APITextInputComponent = {
      type: ComponentType.TextInput,
      custom_id: this.data.custom_id,
      style: this.data.style ?? TextInputStyle.Short,
      label: this.data.label,
    };
    if (this.data.min_length !== undefined) json.min_length = this.data.min_length;
    if (this.data.max_length !== undefined) json.max_length = this.data.max_length;
    if (this.data.required !== undefined) json.required = this.data.required;
    if (this.data.value !== undefined) json.value = this.data.value;
    if (this.data.placeholder !== undefined) json.placeholder = this.data.placeholder;
    return json;
  }
}

/**
 * Modal builder — wraps text inputs in action rows automatically.
 *
 * @example
 * new ModalBuilder()
 *   .customId('report', { prefix: true })
 *   .title('Report user')
 *   .add(
 *     new TextInputBuilder().customId('details').label('Details').paragraph(),
 *   )
 */
export class ModalBuilder implements JSONEncodable<APIModalComponent> {
  private customIdValue?: string;
  private titleValue?: string;
  private rows: ActionRowBuilder<APITextInputComponent>[] = [];

  static from(data: APIModalComponent | ModalBuilder): ModalBuilder {
    const raw = data instanceof ModalBuilder ? data.toJSON() : data;
    const builder = new ModalBuilder().customId(raw.custom_id).title(raw.title);
    for (const row of raw.components) {
      builder.add(ActionRowBuilder.from(row));
    }
    return builder;
  }

  customId(id: string, options?: CustomIdOptions): this {
    this.customIdValue = resolveCustomId(id, options);
    return this;
  }

  title(title: string): this {
    this.titleValue = title;
    return this;
  }

  /**
   * Add a text input (auto-wrapped in an action row) or an existing action row.
   */
  add(
    ...components: Array<
      TextInputBuilder | APITextInputComponent | ActionRowBuilder<APITextInputComponent>
    >
  ): this {
    for (const component of components) {
      if (component instanceof ActionRowBuilder) {
        this.rows.push(component);
        continue;
      }

      if (component instanceof TextInputBuilder) {
        this.rows.push(new ActionRowBuilder<APITextInputComponent>().add(component));
        continue;
      }

      this.rows.push(
        new ActionRowBuilder<APITextInputComponent>().add({
          ...component,
          type: ComponentType.TextInput,
        }),
      );
    }
    return this;
  }

  /** Alias for {@link add} */
  addComponents(
    ...components: Array<
      TextInputBuilder | APITextInputComponent | ActionRowBuilder<APITextInputComponent>
    >
  ): this {
    return this.add(...components);
  }

  clear(): this {
    this.rows = [];
    return this;
  }

  toJSON(): APIModalComponent {
    if (!this.customIdValue) {
      throw new Error('Modals require a customId');
    }
    if (!this.titleValue) {
      throw new Error('Modals require a title');
    }
    if (this.rows.length === 0) {
      throw new Error('Modals require at least one text input');
    }

    return {
      custom_id: this.customIdValue,
      title: this.titleValue,
      components: this.rows.map((row) => row.toJSON()),
    };
  }
}
