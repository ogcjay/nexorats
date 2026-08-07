import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  Message,
  User,
} from 'discord.js';

/** Command execution context */
export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  client: Client;
  user: User;
  guildId: string | null;
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

/** Command definition */
export interface CommandDefinition {
  name: string;
  description: string;
  options?: CommandOption[];
  guildOnly?: boolean;
  adminOnly?: boolean;
  execute: (ctx: CommandContext) => Promise<void> | void;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void;
}

/** Message command context (prefix commands) */
export interface MessageCommandContext {
  message: Message;
  client: Client;
  args: string[];
}

/** Message command definition */
export interface MessageCommandDefinition {
  name: string;
  aliases?: string[];
  description?: string;
  execute: (ctx: MessageCommandContext) => Promise<void> | void;
}

/**
 * Type-safe command builder for slash commands.
 *
 * @example
 * export default command({
 *   name: 'ping',
 *   description: 'Ping command',
 *   execute(ctx) {
 *     ctx.interaction.reply('Pong!');
 *   },
 * });
 */
export function command(definition: CommandDefinition): CommandDefinition {
  return definition;
}

/** Type-safe message command builder */
export function messageCommand(definition: MessageCommandDefinition): MessageCommandDefinition {
  return definition;
}
