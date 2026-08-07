import type {
  APIInteractionGuildMember,
  Client,
  Guild,
  GuildMember,
  InteractionDeferReplyOptions,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  MessageContextMenuCommandInteraction,
  TextBasedChannel,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import type { ComponentLike, EmbedLike } from '../builders/index.js';
import {
  resolveReplyOptions,
  type CommandReplyOptions,
} from './define.js';

/** Context-menu target kind (Discord ApplicationCommand type) */
export type ContextMenuType = 'user' | 'message';

/** Context-menu execution context with target helpers */
export interface ContextMenuContext {
  interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction;
  client: Client;
  user: User;
  guild: Guild | null;
  member: GuildMember | APIInteractionGuildMember | null;
  channel: TextBasedChannel | null;
  guildId: string | null;
  /** Target user (user menus) or message author (message menus) */
  targetUser: User | null;
  /** Target message — only set for message context menus */
  targetMessage: Message | null;

  reply(options: CommandReplyOptions): Promise<InteractionResponse<boolean>>;
  embed(embed: EmbedLike): Promise<InteractionResponse<boolean>>;
  componentsV2(
    ...components: ComponentLike[]
  ): Promise<InteractionResponse<boolean>>;
  defer(options?: InteractionDeferReplyOptions): Promise<InteractionResponse<boolean>>;
  editReply(
    options: InteractionEditReplyOptions | string,
  ): Promise<Message<boolean>>;
  followUp(
    options: InteractionReplyOptions | string,
  ): Promise<Message<boolean>>;
}

/**
 * Abstract context-menu command (User / Message application commands).
 *
 * @example
 * export default class BanUserMenu extends ContextMenuCommand {
 *   name = 'Ban User';
 *   type = 'user' as const;
 *   async execute(ctx) {
 *     await ctx.reply(`Would ban ${ctx.targetUser?.tag}`);
 *   }
 * }
 */
export abstract class ContextMenuCommand {
  abstract name: string;
  abstract type: ContextMenuType;
  /** Discriminator vs content-match {@link messageCommand} */
  readonly kind = 'context-menu' as const;

  abstract execute(ctx: ContextMenuContext): Promise<void> | void;
}

/** Plain definition shape (functional alternative to the class) */
export interface ContextMenuCommandDefinition {
  name: string;
  type: ContextMenuType;
  kind?: 'context-menu';
  execute: (ctx: ContextMenuContext) => Promise<void> | void;
}

/** True when `value` is a constructable ContextMenuCommand subclass */
export function isContextMenuClass(
  value: unknown,
): value is new (...args: never[]) => ContextMenuCommand {
  return typeof value === 'function' && value.prototype instanceof ContextMenuCommand;
}

/**
 * Normalize a module default export into a context-menu definition.
 * Supports: class extending ContextMenuCommand, or a pre-built instance/object.
 */
export function resolveContextMenuExport(
  exported: unknown,
): ContextMenuCommandDefinition | null {
  if (exported == null) return null;

  if (isContextMenuClass(exported)) {
    const instance = new exported();
    return toContextMenuDefinition(instance);
  }

  if (exported instanceof ContextMenuCommand) {
    return toContextMenuDefinition(exported);
  }

  if (isContextMenuDefinition(exported)) {
    return exported;
  }

  return null;
}

function toContextMenuDefinition(
  cmd: ContextMenuCommand,
): ContextMenuCommandDefinition {
  return {
    name: cmd.name,
    type: cmd.type,
    kind: 'context-menu',
    execute: (ctx) => cmd.execute(ctx),
  };
}

function isContextMenuDefinition(value: unknown): value is ContextMenuCommandDefinition {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.kind === 'context-menu') {
    return (
      typeof obj.name === 'string' &&
      (obj.type === 'user' || obj.type === 'message') &&
      typeof obj.execute === 'function'
    );
  }
  // Class instances always set kind; plain objects need the discriminator
  return false;
}

/** Build a ContextMenuContext from a user/message context-menu interaction */
export function createContextMenuContext(
  interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction,
  client: Client,
): ContextMenuContext {
  const targetUser = interaction.isUserContextMenuCommand()
    ? interaction.targetUser
    : interaction.targetMessage.author;

  const targetMessage = interaction.isMessageContextMenuCommand()
    ? interaction.targetMessage
    : null;

  return {
    interaction,
    client,
    user: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    channel: interaction.channel,
    guildId: interaction.guildId,
    targetUser,
    targetMessage,
    reply: (options) => interaction.reply(resolveReplyOptions(options)),
    embed: (embed) => interaction.reply(resolveReplyOptions({ embed })),
    componentsV2: (...components) =>
      interaction.reply(resolveReplyOptions({ v2: components })),
    defer: (options) => interaction.deferReply(options),
    editReply: (options) => interaction.editReply(options),
    followUp: (options) => interaction.followUp(options),
  };
}
