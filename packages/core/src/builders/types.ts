/** Discord API component type constants */
export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
} as const;

export type ComponentTypeValue = (typeof ComponentType)[keyof typeof ComponentType];

/** Button style constants */
export const ButtonStyle = {
  Primary: 1,
  Secondary: 2,
  Success: 3,
  Danger: 4,
  Link: 5,
} as const;

export type ButtonStyleValue = (typeof ButtonStyle)[keyof typeof ButtonStyle];

/** Text input style constants */
export const TextInputStyle = {
  Short: 1,
  Paragraph: 2,
} as const;

export type TextInputStyleValue = (typeof TextInputStyle)[keyof typeof TextInputStyle];

/** Channel types usable in Channel Select menus */
export const ChannelType = {
  GuildText: 0,
  DM: 1,
  GuildVoice: 2,
  GroupDM: 3,
  GuildCategory: 4,
  GuildAnnouncement: 5,
  AnnouncementThread: 10,
  PublicThread: 11,
  PrivateThread: 12,
  GuildStageVoice: 13,
  GuildDirectory: 14,
  GuildForum: 15,
  GuildMedia: 16,
} as const;

export type ChannelTypeValue = (typeof ChannelType)[keyof typeof ChannelType];

/** Partial emoji for buttons / select options */
export interface APIPartialEmoji {
  id?: string | null;
  name?: string | null;
  animated?: boolean;
}

/** Embed field */
export interface APIEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/** Embed footer */
export interface APIEmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

/** Embed author */
export interface APIEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

/** Embed image / thumbnail / media */
export interface APIEmbedMedia {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

/** Plain APIEmbed-compatible object */
export interface APIEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: APIEmbedFooter;
  image?: APIEmbedMedia;
  thumbnail?: APIEmbedMedia;
  video?: APIEmbedMedia;
  provider?: { name?: string; url?: string };
  author?: APIEmbedAuthor;
  fields?: APIEmbedField[];
}

export interface APIButtonComponent {
  type: typeof ComponentType.Button;
  style: ButtonStyleValue;
  label?: string;
  emoji?: APIPartialEmoji;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface APISelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: APIPartialEmoji;
  default?: boolean;
}

export interface APISelectDefaultValue {
  id: string;
  type: 'user' | 'role' | 'channel';
}

export interface APIBaseSelectMenu {
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
}

export interface APIStringSelectComponent extends APIBaseSelectMenu {
  type: typeof ComponentType.StringSelect;
  options: APISelectOption[];
}

export interface APIUserSelectComponent extends APIBaseSelectMenu {
  type: typeof ComponentType.UserSelect;
  default_values?: APISelectDefaultValue[];
}

export interface APIRoleSelectComponent extends APIBaseSelectMenu {
  type: typeof ComponentType.RoleSelect;
  default_values?: APISelectDefaultValue[];
}

export interface APIMentionableSelectComponent extends APIBaseSelectMenu {
  type: typeof ComponentType.MentionableSelect;
  default_values?: APISelectDefaultValue[];
}

export interface APIChannelSelectComponent extends APIBaseSelectMenu {
  type: typeof ComponentType.ChannelSelect;
  channel_types?: ChannelTypeValue[];
  default_values?: APISelectDefaultValue[];
}

export type APISelectMenuComponent =
  | APIStringSelectComponent
  | APIUserSelectComponent
  | APIRoleSelectComponent
  | APIMentionableSelectComponent
  | APIChannelSelectComponent;

export interface APITextInputComponent {
  type: typeof ComponentType.TextInput;
  custom_id: string;
  style: TextInputStyleValue;
  label: string;
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
  placeholder?: string;
}

export type APIMessageActionRowComponent = APIButtonComponent | APISelectMenuComponent;
export type APIModalActionRowComponent = APITextInputComponent;

export interface APIActionRowComponent<
  T extends APIMessageActionRowComponent | APIModalActionRowComponent =
    | APIMessageActionRowComponent
    | APIModalActionRowComponent,
> {
  type: typeof ComponentType.ActionRow;
  components: T[];
}

export interface APIModalComponent {
  type?: never;
  custom_id: string;
  title: string;
  components: APIActionRowComponent<APITextInputComponent>[];
}

/** Anything that serializes to a Discord API object */
export interface JSONEncodable<T> {
  toJSON(): T;
}

export type ColorResolvable = number | string | `#${string}`;

/** Embed builder or plain API embed — accepted by reply helpers */
export type EmbedLike = APIEmbed | JSONEncodable<APIEmbed> | Record<string, unknown>;

/**
 * Component builder or plain API component object.
 * Intentionally wide so Components V2 payloads and action rows both type-check.
 */
export type ComponentLike =
  | APIActionRowComponent
  | APIButtonComponent
  | APISelectMenuComponent
  | APITextInputComponent
  | APIModalComponent
  | JSONEncodable<unknown>
  | Record<string, unknown>;
