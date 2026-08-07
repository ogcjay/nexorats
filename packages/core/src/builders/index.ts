export {
  ComponentType,
  ButtonStyle,
  TextInputStyle,
  ChannelType,
} from './types.js';
export type {
  ComponentTypeValue,
  ButtonStyleValue,
  TextInputStyleValue,
  ChannelTypeValue,
  ColorResolvable,
  JSONEncodable,
  EmbedLike,
  ComponentLike,
  APIEmbed,
  APIEmbedField,
  APIEmbedFooter,
  APIEmbedAuthor,
  APIEmbedMedia,
  APIPartialEmoji,
  APIButtonComponent,
  APISelectOption,
  APISelectDefaultValue,
  APIStringSelectComponent,
  APIUserSelectComponent,
  APIRoleSelectComponent,
  APIMentionableSelectComponent,
  APIChannelSelectComponent,
  APISelectMenuComponent,
  APITextInputComponent,
  APIActionRowComponent,
  APIModalComponent,
  APIMessageActionRowComponent,
  APIModalActionRowComponent,
} from './types.js';

export { EmbedBuilder, EmbedColor, resolveColor } from './embed.js';
export type { EmbedData } from './embed.js';
/** Alias beginners often expect — same as {@link EmbedBuilder} */
export { EmbedBuilder as Embed } from './embed.js';

export { ButtonBuilder, btn } from './button.js';
export { ActionRowBuilder, row } from './action-row.js';
export {
  StringSelectBuilder,
  UserSelectBuilder,
  RoleSelectBuilder,
  MentionableSelectBuilder,
  ChannelSelectBuilder,
} from './select.js';
export type { SelectOptionInput } from './select.js';

export { ModalBuilder, TextInputBuilder } from './modal.js';
export { customId, resolveCustomId, CUSTOM_ID_NAMESPACE } from './custom-id.js';
export type { CustomIdOptions } from './custom-id.js';

export {
  V2ComponentType,
  IsComponentsV2,
  MAX_V2_COMPONENTS,
  SeparatorSpacing,
  toAPI,
  countComponents,
  resolveAccentColor,
  attachmentUrl,
  TextDisplayBuilder,
  text,
  ThumbnailBuilder,
  thumbnail,
  SectionBuilder,
  section,
  MediaGalleryBuilder,
  gallery,
  mediaGallery,
  SeparatorBuilder,
  separator,
  FileBuilder,
  file,
  LayoutContainerBuilder,
  MessageContainerBuilder,
  container,
  LabelBuilder,
  label,
  ComponentsV2Message,
  v2Message,
  ComponentsV2,
} from './v2/index.js';
export type {
  V2ComponentTypeValue,
  SeparatorSpacingValue,
  UnfurledMediaItem,
  APITextDisplayComponent,
  APIThumbnailComponent,
  APIMediaGalleryItem,
  APIMediaGalleryComponent,
  APIFileComponent,
  APISeparatorComponent,
  APISectionComponent,
  APIContainerComponent,
  APILabelComponent,
  ComponentsV2MessagePayload,
  SectionAccessory,
  MediaGalleryItemInput,
  SeparatorOptions,
  ComponentsV2CardOptions,
} from './v2/index.js';
