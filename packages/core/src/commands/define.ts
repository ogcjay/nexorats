import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildBasedChannel,
  GuildMember,
  InteractionDeferReplyOptions,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  MessagePayload,
  MessageReplyOptions,
  PermissionResolvable,
  TextBasedChannel,
  User,
  APIInteractionGuildMember,
} from 'discord.js';

/** Command execution context with interaction shortcuts */
export interface CommandContext {
  /** Raw Discord.js interaction — always available */
  interaction: ChatInputCommandInteraction;
  client: Client;
  user: User;
  guild: Guild | null;
  member: GuildMember | APIInteractionGuildMember | null;
  channel: TextBasedChannel | null;
  guildId: string | null;

  /** Shortcut for `interaction.reply()` */
  reply(
    options: InteractionReplyOptions | MessagePayload | string,
  ): Promise<InteractionResponse<boolean>>;
  /** Shortcut for `interaction.deferReply()` */
  defer(options?: InteractionDeferReplyOptions): Promise<InteractionResponse<boolean>>;
  /** Shortcut for `interaction.editReply()` */
  editReply(
    options: InteractionEditReplyOptions | MessagePayload | string,
  ): Promise<Message<boolean>>;
  /** Shortcut for `interaction.followUp()` */
  followUp(
    options: InteractionReplyOptions | MessagePayload | string,
  ): Promise<Message<boolean>>;
}

/** Slash command option definition */
export interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role' | 'mentionable' | 'number';
  required?: boolean;
  choices?: { name: string; value: string | number }[];
  autocomplete?: boolean;
}

/** Discriminator for discovered command modules */
export type CommandModuleType = 'slash' | 'message';

/** Command definition */
export interface CommandDefinition {
  name: string;
  description: string;
  options?: CommandOption[];
  /** Reject DMs with an ephemeral error */
  guildOnly?: boolean;
  /** Require Administrator permission */
  adminOnly?: boolean;
  /** Require all listed Discord permissions */
  permissions?: PermissionResolvable[];
  /** Per-user cooldown in milliseconds */
  cooldown?: number;
  /** Internal module kind — set by `command()` / SlashCommand */
  type?: CommandModuleType;
  execute: (ctx: CommandContext) => Promise<void> | void;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void;
}

/** Message command context (content-match, no prefix) */
export interface MessageCommandContext {
  message: Message;
  client: Client;
  args: string[];
  user: User;
  guild: Guild | null;
  member: GuildMember | null;
  channel: TextBasedChannel | GuildBasedChannel | null;
  /** Reply to the triggering message */
  reply(options: string | MessagePayload | MessageReplyOptions): Promise<Message>;
}

/** Message command definition */
export interface MessageCommandDefinition {
  name: string;
  aliases?: string[];
  description?: string;
  /** Internal module kind — set by `messageCommand()` */
  type?: CommandModuleType;
  execute: (ctx: MessageCommandContext) => Promise<void> | void;
}

/**
 * Type-safe command builder for slash commands.
 *
 * @example
 * export default command({
 *   name: 'ping',
 *   description: 'Ping command',
 *   async execute(ctx) {
 *     await ctx.reply('Pong!');
 *   },
 * });
 */
export function command(definition: CommandDefinition): CommandDefinition {
  return { ...definition, type: 'slash' };
}

/** Type-safe message command builder (content-match, no prefix) */
export function messageCommand(definition: MessageCommandDefinition): MessageCommandDefinition {
  return { ...definition, type: 'message' };
}

/** Build a CommandContext from a chat-input interaction */
export function createCommandContext(
  interaction: ChatInputCommandInteraction,
  client: Client,
): CommandContext {
  return {
    interaction,
    client,
    user: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    channel: interaction.channel,
    guildId: interaction.guildId,
    reply: (options) => interaction.reply(options),
    defer: (options) => interaction.deferReply(options),
    editReply: (options) => interaction.editReply(options),
    followUp: (options) => interaction.followUp(options),
  };
}

/** Build a MessageCommandContext from a Discord message */
export function createMessageCommandContext(
  message: Message,
  client: Client,
  args: string[],
): MessageCommandContext {
  return {
    message,
    client,
    args,
    user: message.author,
    guild: message.guild,
    member: message.member,
    channel: message.channel,
    reply: (options) => message.reply(options),
  };
}
