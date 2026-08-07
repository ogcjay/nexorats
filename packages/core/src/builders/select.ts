import { resolveCustomId, type CustomIdOptions } from './custom-id.js';
import {
  ComponentType,
  type APIChannelSelectComponent,
  type APIMentionableSelectComponent,
  type APIPartialEmoji,
  type APIRoleSelectComponent,
  type APISelectDefaultValue,
  type APISelectOption,
  type APIStringSelectComponent,
  type APIUserSelectComponent,
  type ChannelTypeValue,
  type JSONEncodable,
} from './types.js';

function parseEmoji(emoji: string | APIPartialEmoji): APIPartialEmoji {
  if (typeof emoji !== 'string') return { ...emoji };

  const custom = emoji.match(/^<(a?):(\w+):(\d+)>$/);
  if (custom) {
    return {
      animated: custom[1] === 'a',
      name: custom[2],
      id: custom[3],
    };
  }

  return { name: emoji };
}

export interface SelectOptionInput {
  label: string;
  value: string;
  description?: string;
  emoji?: string | APIPartialEmoji;
  default?: boolean;
}

abstract class BaseSelectBuilder<T extends { type: number; custom_id: string }> implements JSONEncodable<T> {
  protected customIdValue?: string;
  protected placeholderValue?: string;
  protected minValuesValue?: number;
  protected maxValuesValue?: number;
  protected disabledValue?: boolean;

  customId(id: string, options?: CustomIdOptions): this {
    this.customIdValue = resolveCustomId(id, options);
    return this;
  }

  placeholder(placeholder: string): this {
    this.placeholderValue = placeholder;
    return this;
  }

  minValues(min: number): this {
    this.minValuesValue = min;
    return this;
  }

  maxValues(max: number): this {
    this.maxValuesValue = max;
    return this;
  }

  /** Shorthand: min_values = max_values = count */
  values(count: number): this;
  values(min: number, max: number): this;
  values(min: number, max?: number): this {
    this.minValuesValue = min;
    this.maxValuesValue = max ?? min;
    return this;
  }

  disabled(disabled = true): this {
    this.disabledValue = disabled;
    return this;
  }

  protected applyBase(json: {
    custom_id: string;
    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
  }): void {
    if (!this.customIdValue) {
      throw new Error('Select menus require a customId');
    }
    json.custom_id = this.customIdValue;
    if (this.placeholderValue !== undefined) json.placeholder = this.placeholderValue;
    if (this.minValuesValue !== undefined) json.min_values = this.minValuesValue;
    if (this.maxValuesValue !== undefined) json.max_values = this.maxValuesValue;
    if (this.disabledValue !== undefined) json.disabled = this.disabledValue;
  }

  abstract toJSON(): T;
}

/**
 * String select menu (type 3).
 */
export class StringSelectBuilder
  extends BaseSelectBuilder<APIStringSelectComponent>
  implements JSONEncodable<APIStringSelectComponent>
{
  private optionsList: APISelectOption[] = [];

  /**
   * Creates a new string select menu builder.
   *
   * @example
   * new StringSelectBuilder()
   *   .customId('role-pick', { prefix: true })
   *   .placeholder('Choose a role')
   *   .option('Admin', 'admin')
   *   .option({ label: 'Mod', value: 'mod', emoji: '🛡️' })
   */
  constructor() {
    super();
  }

  /**
   * Clone from an existing string select builder or plain API object.
   *
   * @param data - API string select or another {@link StringSelectBuilder}
   * @example
   * StringSelectBuilder.from(existingSelect).placeholder('Pick again')
   */
  static from(data: APIStringSelectComponent | StringSelectBuilder): StringSelectBuilder {
    const raw = data instanceof StringSelectBuilder ? data.toJSON() : data;
    const builder = new StringSelectBuilder().customId(raw.custom_id);
    if (raw.placeholder) builder.placeholder(raw.placeholder);
    if (raw.min_values !== undefined) builder.minValues(raw.min_values);
    if (raw.max_values !== undefined) builder.maxValues(raw.max_values);
    if (raw.disabled !== undefined) builder.disabled(raw.disabled);
    builder.options(raw.options);
    return builder;
  }

  option(label: string, value: string, extras?: Omit<SelectOptionInput, 'label' | 'value'>): this;
  option(option: SelectOptionInput): this;
  option(
    labelOrOption: string | SelectOptionInput,
    value?: string,
    extras?: Omit<SelectOptionInput, 'label' | 'value'>,
  ): this {
    const input: SelectOptionInput =
      typeof labelOrOption === 'string'
        ? { label: labelOrOption, value: value!, ...extras }
        : labelOrOption;

    const option: APISelectOption = {
      label: input.label,
      value: input.value,
    };
    if (input.description !== undefined) option.description = input.description;
    if (input.emoji !== undefined) option.emoji = parseEmoji(input.emoji);
    if (input.default !== undefined) option.default = input.default;
    this.optionsList.push(option);
    return this;
  }

  options(options: SelectOptionInput[], replace = false): this {
    if (replace) this.optionsList = [];
    for (const opt of options) this.option(opt);
    return this;
  }

  clearOptions(): this {
    this.optionsList = [];
    return this;
  }

  toJSON(): APIStringSelectComponent {
    if (this.optionsList.length === 0) {
      throw new Error('String select menus require at least one option');
    }
    const json: APIStringSelectComponent = {
      type: ComponentType.StringSelect,
      custom_id: '',
      options: this.optionsList.map((o) => ({
        ...o,
        emoji: o.emoji ? { ...o.emoji } : undefined,
      })),
    };
    this.applyBase(json);
    return json;
  }
}

abstract class EntitySelectBuilder<
  T extends
    | APIUserSelectComponent
    | APIRoleSelectComponent
    | APIMentionableSelectComponent
    | APIChannelSelectComponent,
> extends BaseSelectBuilder<T> {
  protected defaults: APISelectDefaultValue[] = [];

  defaultValues(values: APISelectDefaultValue[], replace = true): this {
    this.defaults = replace ? [...values] : [...this.defaults, ...values];
    return this;
  }

  protected applyDefaults(
    json: { default_values?: APISelectDefaultValue[] },
  ): void {
    if (this.defaults.length > 0) {
      json.default_values = this.defaults.map((d) => ({ ...d }));
    }
  }
}

/**
 * User select menu (type 5).
 */
export class UserSelectBuilder
  extends EntitySelectBuilder<APIUserSelectComponent>
  implements JSONEncodable<APIUserSelectComponent>
{
  /**
   * Creates a new user select menu builder.
   *
   * @example
   * new UserSelectBuilder()
   *   .customId('pick-user', { prefix: true })
   *   .placeholder('Select a user')
   *   .values(1)
   */
  constructor() {
    super();
  }

  /**
   * Clone from an existing user select builder or plain API object.
   *
   * @param data - API user select or another {@link UserSelectBuilder}
   * @example
   * UserSelectBuilder.from(existingSelect).maxValues(3)
   */
  static from(data: APIUserSelectComponent | UserSelectBuilder): UserSelectBuilder {
    const raw = data instanceof UserSelectBuilder ? data.toJSON() : data;
    const builder = new UserSelectBuilder().customId(raw.custom_id);
    if (raw.placeholder) builder.placeholder(raw.placeholder);
    if (raw.min_values !== undefined) builder.minValues(raw.min_values);
    if (raw.max_values !== undefined) builder.maxValues(raw.max_values);
    if (raw.disabled !== undefined) builder.disabled(raw.disabled);
    if (raw.default_values) builder.defaultValues(raw.default_values);
    return builder;
  }

  defaultUsers(...ids: string[]): this {
    return this.defaultValues(
      ids.map((id) => ({ id, type: 'user' as const })),
      false,
    );
  }

  toJSON(): APIUserSelectComponent {
    const json: APIUserSelectComponent = {
      type: ComponentType.UserSelect,
      custom_id: '',
    };
    this.applyBase(json);
    this.applyDefaults(json);
    return json;
  }
}

/**
 * Role select menu (type 6).
 */
export class RoleSelectBuilder
  extends EntitySelectBuilder<APIRoleSelectComponent>
  implements JSONEncodable<APIRoleSelectComponent>
{
  /**
   * Creates a new role select menu builder.
   *
   * @example
   * new RoleSelectBuilder()
   *   .customId('pick-role', { prefix: true })
   *   .placeholder('Select a role')
   *   .minValues(1)
   *   .maxValues(3)
   */
  constructor() {
    super();
  }

  /**
   * Clone from an existing role select builder or plain API object.
   *
   * @param data - API role select or another {@link RoleSelectBuilder}
   * @example
   * RoleSelectBuilder.from(existingSelect).placeholder('Choose roles')
   */
  static from(data: APIRoleSelectComponent | RoleSelectBuilder): RoleSelectBuilder {
    const raw = data instanceof RoleSelectBuilder ? data.toJSON() : data;
    const builder = new RoleSelectBuilder().customId(raw.custom_id);
    if (raw.placeholder) builder.placeholder(raw.placeholder);
    if (raw.min_values !== undefined) builder.minValues(raw.min_values);
    if (raw.max_values !== undefined) builder.maxValues(raw.max_values);
    if (raw.disabled !== undefined) builder.disabled(raw.disabled);
    if (raw.default_values) builder.defaultValues(raw.default_values);
    return builder;
  }

  defaultRoles(...ids: string[]): this {
    return this.defaultValues(
      ids.map((id) => ({ id, type: 'role' as const })),
      false,
    );
  }

  toJSON(): APIRoleSelectComponent {
    const json: APIRoleSelectComponent = {
      type: ComponentType.RoleSelect,
      custom_id: '',
    };
    this.applyBase(json);
    this.applyDefaults(json);
    return json;
  }
}

/**
 * Mentionable select menu (type 7).
 */
export class MentionableSelectBuilder
  extends EntitySelectBuilder<APIMentionableSelectComponent>
  implements JSONEncodable<APIMentionableSelectComponent>
{
  /**
   * Creates a new mentionable select menu builder.
   *
   * @example
   * new MentionableSelectBuilder()
   *   .customId('mention', { prefix: true })
   *   .placeholder('Select a user or role')
   */
  constructor() {
    super();
  }

  /**
   * Clone from an existing mentionable select builder or plain API object.
   *
   * @param data - API mentionable select or another {@link MentionableSelectBuilder}
   * @example
   * MentionableSelectBuilder.from(existingSelect).disabled()
   */
  static from(
    data: APIMentionableSelectComponent | MentionableSelectBuilder,
  ): MentionableSelectBuilder {
    const raw = data instanceof MentionableSelectBuilder ? data.toJSON() : data;
    const builder = new MentionableSelectBuilder().customId(raw.custom_id);
    if (raw.placeholder) builder.placeholder(raw.placeholder);
    if (raw.min_values !== undefined) builder.minValues(raw.min_values);
    if (raw.max_values !== undefined) builder.maxValues(raw.max_values);
    if (raw.disabled !== undefined) builder.disabled(raw.disabled);
    if (raw.default_values) builder.defaultValues(raw.default_values);
    return builder;
  }

  toJSON(): APIMentionableSelectComponent {
    const json: APIMentionableSelectComponent = {
      type: ComponentType.MentionableSelect,
      custom_id: '',
    };
    this.applyBase(json);
    this.applyDefaults(json);
    return json;
  }
}

/**
 * Channel select menu (type 8).
 */
export class ChannelSelectBuilder
  extends EntitySelectBuilder<APIChannelSelectComponent>
  implements JSONEncodable<APIChannelSelectComponent>
{
  private channelTypesList?: ChannelTypeValue[];

  /**
   * Creates a new channel select menu builder.
   *
   * @example
   * new ChannelSelectBuilder()
   *   .customId('pick-channel', { prefix: true })
   *   .placeholder('Select a channel')
   *   .channelTypes(0, 5) // guild text + announcement
   */
  constructor() {
    super();
  }

  /**
   * Clone from an existing channel select builder or plain API object.
   *
   * @param data - API channel select or another {@link ChannelSelectBuilder}
   * @example
   * ChannelSelectBuilder.from(existingSelect).channelTypes(2) // voice
   */
  static from(data: APIChannelSelectComponent | ChannelSelectBuilder): ChannelSelectBuilder {
    const raw = data instanceof ChannelSelectBuilder ? data.toJSON() : data;
    const builder = new ChannelSelectBuilder().customId(raw.custom_id);
    if (raw.placeholder) builder.placeholder(raw.placeholder);
    if (raw.min_values !== undefined) builder.minValues(raw.min_values);
    if (raw.max_values !== undefined) builder.maxValues(raw.max_values);
    if (raw.disabled !== undefined) builder.disabled(raw.disabled);
    if (raw.channel_types) builder.channelTypes(...raw.channel_types);
    if (raw.default_values) builder.defaultValues(raw.default_values);
    return builder;
  }

  channelTypes(...types: ChannelTypeValue[]): this {
    this.channelTypesList = [...types];
    return this;
  }

  defaultChannels(...ids: string[]): this {
    return this.defaultValues(
      ids.map((id) => ({ id, type: 'channel' as const })),
      false,
    );
  }

  toJSON(): APIChannelSelectComponent {
    const json: APIChannelSelectComponent = {
      type: ComponentType.ChannelSelect,
      custom_id: '',
    };
    this.applyBase(json);
    this.applyDefaults(json);
    if (this.channelTypesList) json.channel_types = [...this.channelTypesList];
    return json;
  }
}
