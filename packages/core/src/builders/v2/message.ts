import { text } from './text-display.js';
import { section } from './section.js';
import { thumbnail } from './thumbnail.js';
import { container } from './layout-container.js';
import { V2ComponentType } from './types.js';
import {
  IsComponentsV2,
  toAPI,
  warnIfOverComponentLimit,
  type ComponentLike,
  type ComponentsV2MessagePayload,
} from './types.js';

export interface ComponentsV2CardOptions {
  title: string;
  body: string;
  /** RGB integer or `#rrggbb`. */
  accent?: number | string;
  thumbnail?: string;
  /** Action-row buttons (builders or raw API button objects). */
  buttons?: ComponentLike[];
}

/**
 * Builds a Components V2 message payload: `{ components, flags: IsComponentsV2 }`.
 * With V2 enabled, classic `content` / `embeds` are disabled — everything goes through components.
 */
export class ComponentsV2Message {
  private readonly children: ComponentLike[] = [];
  private extraFlags = 0;

  /**
   * Creates a new Components V2 message builder.
   *
   * @example
   * new ComponentsV2Message()
   *   .add(text('# Hello'), container().add(text('Body')))
   *   .flags(64) // ephemeral
   */
  constructor() {}

  add(...components: ComponentLike[]): this {
    for (const component of components) {
      this.children.push(component);
    }
    return this;
  }

  /** OR additional message flags (e.g. Ephemeral = 64) onto `IsComponentsV2`. */
  flags(extra: number): this {
    this.extraFlags = extra;
    return this;
  }

  validate(): this {
    warnIfOverComponentLimit({ components: this.children.map((c) => toAPI(c)) }, 'ComponentsV2Message');
    return this;
  }

  toJSON(): ComponentsV2MessagePayload & { flags: number } {
    return {
      components: this.children.map((child) => toAPI(child)),
      flags: IsComponentsV2 | this.extraFlags,
    };
  }
}

/**
 * Short helper for {@link ComponentsV2Message}.
 *
 * @param components - Optional top-level V2 components to add immediately
 * @example
 * v2Message(text('hi'), container().add(text('More')))
 */
export function v2Message(...components: ComponentLike[]): ComponentsV2Message {
  const message = new ComponentsV2Message();
  if (components.length > 0) message.add(...components);
  return message;
}

function cardTitle(title: string): string {
  return title.startsWith('#') ? title : `# ${title}`;
}

/** Preset layouts and message helpers. */
export const ComponentsV2 = {
  message: v2Message,
  IsComponentsV2,

  /**
   * Card layout: accent container with title + body, optional thumbnail section and button row.
   *
   * @param options - Card title, body, and optional accent / thumbnail / buttons
   * @example
   * ```ts
   * await channel.send(ComponentsV2.card({
   *   title: 'Welcome',
   *   body: 'Thanks for joining.',
   *   accent: 0x5865f2,
   *   buttons: [{ type: 2, style: 1, custom_id: 'ok', label: 'OK' }],
   * }).toJSON());
   * ```
   */
  card(options: ComponentsV2CardOptions): ComponentsV2Message {
    const inner: ComponentLike[] = [];

    if (options.thumbnail) {
      inner.push(
        section(cardTitle(options.title), options.body).accessory(thumbnail(options.thumbnail)),
      );
    } else {
      inner.push(text(cardTitle(options.title)), text(options.body));
    }

    if (options.buttons && options.buttons.length > 0) {
      inner.push({
        type: V2ComponentType.ActionRow,
        components: options.buttons.map((button) => toAPI(button)),
      });
    }

    const layout = container(...inner);
    if (options.accent !== undefined) layout.accent(options.accent);

    return v2Message(layout);
  },
};
