import {
  ComponentType,
  type APIActionRowComponent,
  type APIMessageActionRowComponent,
  type APIModalActionRowComponent,
  type JSONEncodable,
} from './types.js';

type RowComponent = APIMessageActionRowComponent | APIModalActionRowComponent;
type RowChild<T> = T | JSONEncodable<T>;

function serializeChild<T>(child: RowChild<T>): T {
  if (
    child !== null &&
    typeof child === 'object' &&
    'toJSON' in child &&
    typeof child.toJSON === 'function'
  ) {
    return child.toJSON();
  }
  return child as T;
}

/**
 * Fluent action row builder (component type 1).
 * Holds up to 5 message components, or a single text input for modals.
 */
export class ActionRowBuilder<T extends RowComponent = RowComponent>
  implements JSONEncodable<APIActionRowComponent<T>>
{
  private components: T[] = [];

  /**
   * Creates a new action row builder.
   *
   * @example
   * new ActionRowBuilder()
   *   .add(new ButtonBuilder().customId('ok').label('OK').success())
   */
  constructor() {}

  /**
   * Clone from an existing action row builder or plain API object.
   *
   * @param data - API action row or another {@link ActionRowBuilder}
   * @example
   * ActionRowBuilder.from(existingRow).add(ButtonBuilder.danger('x', 'Remove'))
   */
  static from<U extends RowComponent>(
    data: APIActionRowComponent<U> | ActionRowBuilder<U>,
  ): ActionRowBuilder<U> {
    const raw = data instanceof ActionRowBuilder ? data.toJSON() : data;
    return new ActionRowBuilder<U>().set(...(raw.components as U[]));
  }

  /**
   * Shorthand for `new ActionRowBuilder().add(...)`.
   *
   * @param components - Builders or plain API components to place in the row
   * @example
   * ActionRowBuilder.of(
   *   ButtonBuilder.primary('ok', 'OK'),
   *   ButtonBuilder.danger('cancel', 'Cancel'),
   * )
   */
  static of<U extends RowComponent>(...components: RowChild<U>[]): ActionRowBuilder<U> {
    return new ActionRowBuilder<U>().add(...components);
  }

  /** Append components (builders or plain API objects) */
  add(...components: RowChild<T>[]): this {
    for (const component of components) {
      this.components.push(serializeChild(component));
    }
    return this;
  }

  /** Alias for {@link add} */
  addComponents(...components: RowChild<T>[]): this {
    return this.add(...components);
  }

  /** Replace all components */
  set(...components: RowChild<T>[]): this {
    this.components = components.map(serializeChild);
    return this;
  }

  /** Alias for {@link set} */
  setComponents(...components: RowChild<T>[]): this {
    return this.set(...components);
  }

  clear(): this {
    this.components = [];
    return this;
  }

  toJSON(): APIActionRowComponent<T> {
    return {
      type: ComponentType.ActionRow,
      components: this.components.map((c) => ({ ...c })) as T[],
    };
  }
}

/**
 * Shorthand for {@link ActionRowBuilder.of} — wrap buttons/selects in a row.
 *
 * @param components - Builders or plain API components to place in the row
 * @example
 * row(ButtonBuilder.primary('yes', 'Yes'), ButtonBuilder.secondary('no', 'No'))
 */
export function row<T extends RowComponent = RowComponent>(
  ...components: RowChild<T>[]
): ActionRowBuilder<T> {
  return ActionRowBuilder.of(...components);
}
