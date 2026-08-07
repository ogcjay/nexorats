/** Discord Components V2 type IDs (official Component Reference). */
export const V2ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  File: 13,
  Separator: 14,
  Container: 17,
  Label: 18,
} as const;

export type V2ComponentTypeValue = (typeof V2ComponentType)[keyof typeof V2ComponentType];

/** Message flag `IS_COMPONENTS_V2` = `1 << 15`. */
export const IsComponentsV2 = 1 << 15;

/** Discord allows up to 40 total components per V2 message. */
export const MAX_V2_COMPONENTS = 40;

export const SeparatorSpacing = {
  Small: 1,
  Large: 2,
} as const;

export type SeparatorSpacingValue = (typeof SeparatorSpacing)[keyof typeof SeparatorSpacing];

import type { ComponentLike, JSONEncodable } from '../types.js';
export type { ComponentLike, JSONEncodable } from '../types.js';

export interface UnfurledMediaItem {
  url: string;
}

export interface APITextDisplayComponent {
  type: typeof V2ComponentType.TextDisplay;
  id?: number;
  content: string;
}

export interface APIThumbnailComponent {
  type: typeof V2ComponentType.Thumbnail;
  id?: number;
  media: UnfurledMediaItem;
  description?: string | null;
  spoiler?: boolean;
}

export interface APIMediaGalleryItem {
  media: UnfurledMediaItem;
  description?: string | null;
  spoiler?: boolean;
}

export interface APIMediaGalleryComponent {
  type: typeof V2ComponentType.MediaGallery;
  id?: number;
  items: APIMediaGalleryItem[];
}

export interface APIFileComponent {
  type: typeof V2ComponentType.File;
  id?: number;
  file: UnfurledMediaItem;
  spoiler?: boolean;
}

export interface APISeparatorComponent {
  type: typeof V2ComponentType.Separator;
  id?: number;
  divider?: boolean;
  spacing?: SeparatorSpacingValue;
}

export interface APISectionComponent {
  type: typeof V2ComponentType.Section;
  id?: number;
  components: APITextDisplayComponent[];
  accessory: APIThumbnailComponent | Record<string, unknown>;
}

export interface APIContainerComponent {
  type: typeof V2ComponentType.Container;
  id?: number;
  components: Record<string, unknown>[];
  accent_color?: number | null;
  spoiler?: boolean;
}

export interface APILabelComponent {
  type: typeof V2ComponentType.Label;
  id?: number;
  label: string;
  description?: string;
  component: Record<string, unknown>;
}

export interface ComponentsV2MessagePayload {
  components: Record<string, unknown>[];
  flags: typeof IsComponentsV2;
}

/** Resolve a builder or raw object to an API payload. */
export function toAPI<T = Record<string, unknown>>(component: ComponentLike): T {
  if (
    component !== null &&
    typeof component === 'object' &&
    'toJSON' in component &&
    typeof (component as JSONEncodable<unknown>).toJSON === 'function'
  ) {
    return (component as JSONEncodable<unknown>).toJSON() as T;
  }
  return component as T;
}

/** Count every nested object that has a Discord `type` field. */
export function countComponents(node: unknown): number {
  if (node === null || typeof node !== 'object') return 0;

  const obj = node as Record<string, unknown>;
  let total = typeof obj['type'] === 'number' ? 1 : 0;

  const components = obj['components'];
  if (Array.isArray(components)) {
    for (const child of components) {
      total += countComponents(child);
    }
  }

  if (obj['accessory'] !== undefined) {
    total += countComponents(obj['accessory']);
  }

  if (obj['component'] !== undefined) {
    total += countComponents(obj['component']);
  }

  return total;
}

export function resolveAccentColor(color: number | string): number {
  if (typeof color === 'number') {
    if (!Number.isInteger(color) || color < 0 || color > 0xffffff) {
      throw new TypeError(`Accent color must be an RGB integer 0–0xFFFFFF, got ${color}`);
    }
    return color;
  }

  const hex = color.startsWith('#') ? color.slice(1) : color;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new TypeError(`Invalid accent color: ${color}`);
  }
  return Number.parseInt(hex, 16);
}

export function attachmentUrl(file: string): string {
  return file.startsWith('attachment://') ? file : `attachment://${file}`;
}

export function warnIfOverComponentLimit(root: unknown, context: string): void {
  const total = countComponents(root);
  if (total > MAX_V2_COMPONENTS) {
    console.warn(
      `[nexora.ts] ${context}: ${total} components exceeds Discord's Components V2 limit of ${MAX_V2_COMPONENTS}.`,
    );
  }
}
