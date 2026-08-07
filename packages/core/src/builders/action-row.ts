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
 *
 * @example
 * new ActionRowBuilder()
 *   .add(new ButtonBuilder().customId('ok').label('OK').success())
 */
export class ActionRowBuilder<T extends RowComponent = RowComponent>
  implements JSONEncodable<APIActionRowComponent<T>>
{
  private components: T[] = [];

  static from<U extends RowComponent>(
    data: APIActionRowComponent<U> | ActionRowBuilder<U>,
  ): ActionRowBuilder<U> {
    const raw = data instanceof ActionRowBuilder ? data.toJSON() : data;
    return new ActionRowBuilder<U>().set(...(raw.components as U[]));
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
