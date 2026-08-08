import {
  MessageFlags,
  MessagePayload,
  type APIInteractionGuildMember,
  type Client,
  type Guild,
  type GuildMember,
  type InteractionDeferReplyOptions,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  type InteractionResponse,
  type Message,
  type MessageContextMenuCommandInteraction,
  type PermissionResolvable,
  type TextBasedChannel,
  type User,
  type UserContextMenuCommandInteraction,
} from 'discord.js';
import type { ComponentLike, EmbedLike } from '../builders/index.js';
import {
  resolveReplyOptions,
  type CommandReplyOptions,
} from './define.js';
import type { Guard } from './guards.js';
import {
  buildStatusReply,
  type StatusReplyOptions,
} from './reply-presets.js';
import { DEFAULT_DEFER_ERROR_MESSAGE } from '../errors/handler.js';

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
  deferThen(
    work: () => Promise<CommandReplyOptions | string | void>,
    options?: InteractionDeferReplyOptions,
  ): Promise<Message<boolean> | undefined>;
  editReply(options: CommandReplyOptions): Promise<Message<boolean>>;
  followUp(options: CommandReplyOptions): Promise<Message<boolean>>;
  success(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
  error(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
  warn(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
  info(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
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
  /** Composable guards (same helpers as slash commands) */
  guards?: Guard[];
  /** Default member permissions for Discord registration */
  defaultMemberPermissions?: PermissionResolvable | bigint | null;
  /** Whether usable in DMs (global deploy) */
  dmPermission?: boolean;

  abstract execute(ctx: ContextMenuContext): Promise<void> | void;
}

/** Plain definition shape (functional alternative to the class) */
export interface ContextMenuCommandDefinition {
  name: string;
  type: ContextMenuType;
  kind?: 'context-menu';
  guards?: Guard[];
  defaultMemberPermissions?: PermissionResolvable | bigint | null;
  dmPermission?: boolean;
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
    guards: cmd.guards,
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

function resolveEditReply(
  options: CommandReplyOptions,
): string | MessagePayload | InteractionEditReplyOptions {
  return resolveReplyOptions(options) as string | MessagePayload | InteractionEditReplyOptions;
}

function resolveFollowUp(
  options: CommandReplyOptions,
): string | MessagePayload | InteractionReplyOptions {
  return resolveReplyOptions(options);
}

async function deferThenHelper(
  interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction,
  work: () => Promise<CommandReplyOptions | string | void>,
  options?: InteractionDeferReplyOptions,
): Promise<Message<boolean> | undefined> {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply(options);
  }

  try {
    const result = await work();
    if (result === undefined) return undefined;
    return await interaction.editReply(resolveEditReply(result));
  }   catch (error) {
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: DEFAULT_DEFER_ERROR_MESSAGE });
      } else {
        await interaction.reply({
          content: DEFAULT_DEFER_ERROR_MESSAGE,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch {
      try {
        await interaction.followUp({
          content: DEFAULT_DEFER_ERROR_MESSAGE,
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        // swallow secondary reply failures
      }
    }
    throw error;
  }
}

/**
 * Build a ContextMenuContext from a user/message context-menu interaction.
 *
 * @param interaction - User or message context-menu interaction
 * @param client - Discord.js client
 * @returns Typed context with target helpers and reply shortcuts
 * @example
 * const ctx = createContextMenuContext(interaction, client);
 * await ctx.reply(`Target: ${ctx.targetUser?.tag}`);
 */
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

  const reply = (options: CommandReplyOptions) =>
    interaction.reply(resolveReplyOptions(options));

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
    reply,
    embed: (embed) => interaction.reply(resolveReplyOptions({ embed })),
    componentsV2: (...components) =>
      interaction.reply(resolveReplyOptions({ v2: components })),
    defer: (options) => interaction.deferReply(options),
    deferThen: (work, options) => deferThenHelper(interaction, work, options),
    editReply: (options) => interaction.editReply(resolveEditReply(options)),
    followUp: (options) => interaction.followUp(resolveFollowUp(options)),
    success: (description, options) =>
      reply(buildStatusReply('success', description, options)),
    error: (description, options) =>
      reply(buildStatusReply('error', description, options)),
    warn: (description, options) =>
      reply(buildStatusReply('warn', description, options)),
    info: (description, options) =>
      reply(buildStatusReply('info', description, options)),
  };
}
