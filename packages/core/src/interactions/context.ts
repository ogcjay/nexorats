import type {
  APIInteractionGuildMember,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Client,
  Guild,
  GuildMember,
  InteractionDeferReplyOptions,
  InteractionDeferUpdateOptions,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionUpdateOptions,
  Message,
  MessageComponentInteraction,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  TextBasedChannel,
  User,
  UserSelectMenuInteraction,
} from 'discord.js';
import { MessagePayload } from 'discord.js';
import type { ComponentLike, EmbedLike } from '../builders/index.js';
import {
  resolveReplyOptions,
  type BuilderReplyOptions,
  type CommandReplyOptions,
} from '../commands/define.js';

/** Inputs accepted by component/modal reply helpers */
export type InteractionReplyInput = CommandReplyOptions;

/** Builder-friendly update payload (same duck-typing as reply) */
export type InteractionUpdateInput =
  | string
  | InteractionUpdateOptions
  | MessagePayload
  | BuilderReplyOptions;

/** Any message-component interaction handled by ComponentContext */
export type ComponentInteraction =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | UserSelectMenuInteraction
  | RoleSelectMenuInteraction
  | MentionableSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | MessageComponentInteraction;

function resolveUpdateOptions(
  options: InteractionUpdateInput,
): string | InteractionUpdateOptions | MessagePayload {
  return resolveReplyOptions(options as CommandReplyOptions) as
    | string
    | InteractionUpdateOptions
    | MessagePayload;
}

/** Shared fields for component + modal contexts */
export interface BaseInteractionContext {
  client: Client;
  user: User;
  guild: Guild | null;
  member: GuildMember | APIInteractionGuildMember | null;
  channel: TextBasedChannel | null;
  guildId: string | null;
  /** Raw customId from the interaction */
  customId: string;
}

/**
 * Context for button / select menu interactions.
 * Helpers mirror {@link import('../commands/define.js').CommandContext}
 * and add `update` / `deferUpdate` for component acknowledgements.
 */
export interface ComponentContext extends BaseInteractionContext {
  interaction: ComponentInteraction;
  /**
   * Select menu values (empty for buttons).
   * String selects expose option values; entity selects expose snowflakes.
   */
  values: string[];

  reply(options: InteractionReplyInput): Promise<InteractionResponse<boolean>>;
  /** Update the message the component belongs to */
  update(options: InteractionUpdateInput): Promise<InteractionResponse<boolean> | Message<boolean>>;
  embed(embed: EmbedLike): Promise<InteractionResponse<boolean>>;
  componentsV2(
    ...components: ComponentLike[]
  ): Promise<InteractionResponse<boolean>>;
  /** Shortcut for `interaction.deferReply()` */
  defer(options?: InteractionDeferReplyOptions): Promise<InteractionResponse<boolean>>;
  /** Shortcut for `interaction.deferUpdate()` */
  deferUpdate(options?: InteractionDeferUpdateOptions): Promise<InteractionResponse<boolean>>;
  editReply(
    options: InteractionEditReplyOptions | MessagePayload | string,
  ): Promise<Message<boolean>>;
  followUp(
    options: InteractionReplyOptions | MessagePayload | string,
  ): Promise<Message<boolean>>;
}

/** Context for modal submit interactions */
export interface ModalContext extends BaseInteractionContext {
  interaction: ModalSubmitInteraction;
  /** discord.js modal field helper */
  fields: ModalSubmitInteraction['fields'];

  /** Read a text input value by field customId */
  getField(fieldCustomId: string): string;

  reply(options: InteractionReplyInput): Promise<InteractionResponse<boolean>>;
  embed(embed: EmbedLike): Promise<InteractionResponse<boolean>>;
  componentsV2(
    ...components: ComponentLike[]
  ): Promise<InteractionResponse<boolean>>;
  defer(options?: InteractionDeferReplyOptions): Promise<InteractionResponse<boolean>>;
  editReply(
    options: InteractionEditReplyOptions | MessagePayload | string,
  ): Promise<Message<boolean>>;
  followUp(
    options: InteractionReplyOptions | MessagePayload | string,
  ): Promise<Message<boolean>>;
}

function readSelectValues(interaction: ComponentInteraction): string[] {
  if ('values' in interaction && Array.isArray(interaction.values)) {
    return [...interaction.values];
  }
  return [];
}

/** Build a ComponentContext from a message-component interaction */
export function createComponentContext(
  interaction: ComponentInteraction,
  client: Client,
): ComponentContext {
  return {
    interaction,
    client,
    user: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    channel: interaction.channel,
    guildId: interaction.guildId,
    customId: interaction.customId,
    values: readSelectValues(interaction),
    reply: (options) => interaction.reply(resolveReplyOptions(options)),
    update: (options) => interaction.update(resolveUpdateOptions(options)),
    embed: (embed) => interaction.reply(resolveReplyOptions({ embed })),
    componentsV2: (...components) =>
      interaction.reply(resolveReplyOptions({ v2: components })),
    defer: (options) => interaction.deferReply(options),
    deferUpdate: (options) => interaction.deferUpdate(options),
    editReply: (options) => interaction.editReply(options),
    followUp: (options) => interaction.followUp(options),
  };
}

/** Build a ModalContext from a modal submit interaction */
export function createModalContext(
  interaction: ModalSubmitInteraction,
  client: Client,
): ModalContext {
  return {
    interaction,
    client,
    user: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    channel: interaction.channel,
    guildId: interaction.guildId,
    customId: interaction.customId,
    fields: interaction.fields,
    getField: (fieldCustomId) => interaction.fields.getTextInputValue(fieldCustomId),
    reply: (options) => interaction.reply(resolveReplyOptions(options)),
    embed: (embed) => interaction.reply(resolveReplyOptions({ embed })),
    componentsV2: (...components) =>
      interaction.reply(resolveReplyOptions({ v2: components })),
    defer: (options) => interaction.deferReply(options),
    editReply: (options) => interaction.editReply(options),
    followUp: (options) => interaction.followUp(options),
  };
}
