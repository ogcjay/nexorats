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
  MessageReplyOptions,
  PermissionResolvable,
  TextBasedChannel,
  User,
  APIInteractionGuildMember,
  APIEmbed,
} from 'discord.js';
import { MessageFlags, MessageFlagsBitField, MessagePayload } from 'discord.js';
import type { ComponentLike, EmbedLike } from '../builders/index.js';
import type { Guard } from './guards.js';

/** Builder-first reply options (resolved before discord.js) */
export interface BuilderReplyOptions {
  content?: string;
  /** Single embed shortcut — merged into `embeds` */
  embed?: EmbedLike;
  embeds?: EmbedLike[];
  components?: ComponentLike[];
  /**
   * Components V2:
   * - `true` — set {@link MessageFlags.IsComponentsV2} (use `components`)
   * - `ComponentLike[]` — set flag and use as `components`
   */
  v2?: boolean | ComponentLike[];
  ephemeral?: boolean;
  flags?: InteractionReplyOptions['flags'];
  fetchReply?: boolean;
  tts?: boolean;
  allowedMentions?: InteractionReplyOptions['allowedMentions'];
  files?: InteractionReplyOptions['files'];
  withResponse?: InteractionReplyOptions['withResponse'];
}

/** Inputs accepted by {@link CommandContext.reply} */
export type CommandReplyOptions =
  | string
  | InteractionReplyOptions
  | MessagePayload
  | BuilderReplyOptions;

function hasToJSON(value: unknown): value is { toJSON(): unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toJSON?: unknown }).toJSON === 'function'
  );
}

function resolveEmbedLike(embed: EmbedLike): APIEmbed {
  if (hasToJSON(embed)) {
    return embed.toJSON() as APIEmbed;
  }
  return embed as APIEmbed;
}

function resolveComponentLike(component: ComponentLike): unknown {
  if (hasToJSON(component)) {
    return component.toJSON();
  }
  return component;
}

function mergeFlags(
  existing: InteractionReplyOptions['flags'] | undefined,
  add: number,
): number {
  let base = 0;
  if (typeof existing === 'number') {
    base = existing;
  } else if (existing != null) {
    // InteractionReplyOptions.flags is a narrowed MessageFlags subset
    base = MessageFlagsBitField.resolve(existing as never);
  }
  return base | add;
}

/**
 * Normalize string | discord.js options | builder-friendly options into
 * something `interaction.reply()` accepts. Resolves `toJSON()` builders and
 * applies {@link MessageFlags.IsComponentsV2} when `v2` is set.
 */
export function resolveReplyOptions(
  options: CommandReplyOptions,
): string | InteractionReplyOptions | MessagePayload {
  if (typeof options === 'string') {
    return options;
  }

  if (options instanceof MessagePayload) {
    return options;
  }

  // Top-level builder (e.g. EmbedBuilder passed by mistake) → single embed reply
  if (
    hasToJSON(options) &&
    !('content' in options) &&
    !('embeds' in options) &&
    !('embed' in options) &&
    !('components' in options) &&
    !('v2' in options) &&
    !('flags' in options) &&
    !('ephemeral' in options)
  ) {
    return { embeds: [options.toJSON() as APIEmbed] };
  }

  const input = options as BuilderReplyOptions & InteractionReplyOptions;
  const {
    embed,
    embeds,
    components,
    v2,
    flags,
    ...rest
  } = input;

  const resolved: InteractionReplyOptions = { ...rest };

  if (embed !== undefined || embeds !== undefined) {
    const list: APIEmbed[] = [];
    if (embed !== undefined) {
      list[list.length] = resolveEmbedLike(embed);
    }
    if (embeds !== undefined) {
      for (let i = 0; i < embeds.length; i++) {
        list[list.length] = resolveEmbedLike(embeds[i]!);
      }
    }
    resolved.embeds = list;
  }

  let useV2 = false;
  let v2Components: ComponentLike[] | undefined;

  if (v2 === true) {
    useV2 = true;
  } else if (Array.isArray(v2)) {
    useV2 = true;
    v2Components = v2;
  }

  if (v2Components !== undefined) {
    resolved.components = v2Components.map(resolveComponentLike) as InteractionReplyOptions['components'];
  } else if (components !== undefined) {
    resolved.components = components.map(resolveComponentLike) as InteractionReplyOptions['components'];
  }

  if (useV2) {
    resolved.flags = mergeFlags(flags, MessageFlags.IsComponentsV2);
  } else if (flags !== undefined) {
    resolved.flags = flags;
  }

  return resolved;
}

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

  /**
   * Shortcut for `interaction.reply()`.
   * Accepts strings, discord.js options, or builder-friendly payloads
   * (`embed` / `embeds` / `components` / `v2`).
   */
  reply(options: CommandReplyOptions): Promise<InteractionResponse<boolean>>;
  /** Reply with a single embed (builder or APIEmbed) */
  embed(embed: EmbedLike): Promise<InteractionResponse<boolean>>;
  /** Reply with Components V2 (`MessageFlags.IsComponentsV2`) */
  componentsV2(
    ...components: ComponentLike[]
  ): Promise<InteractionResponse<boolean>>;
  /** Shortcut for `interaction.deferReply()` */
  defer(options?: InteractionDeferReplyOptions): Promise<InteractionResponse<boolean>>;
  /**
   * Defer (if needed), run async work, then `editReply` when work returns a payload.
   * On throw: tries ephemeral `editReply` / `followUp` with a generic error, then rethrows.
   */
  deferThen(
    work: () => Promise<CommandReplyOptions | string | void>,
    options?: InteractionDeferReplyOptions,
  ): Promise<Message<boolean> | undefined>;
  /** Shortcut for `interaction.editReply()` — accepts the same inputs as {@link reply} */
  editReply(options: CommandReplyOptions): Promise<Message<boolean>>;
  /** Shortcut for `interaction.followUp()` — accepts the same inputs as {@link reply} */
  followUp(options: CommandReplyOptions): Promise<Message<boolean>>;
}

/** Slash command option definition */
export interface CommandOption {
  name: string;
  description: string;
  type:
    | 'string'
    | 'integer'
    | 'boolean'
    | 'user'
    | 'channel'
    | 'role'
    | 'mentionable'
    | 'number'
    | 'attachment';
  required?: boolean;
  choices?: { name: string; value: string | number }[];
  autocomplete?: boolean;
  /** Minimum value (integer / number options) — maps to Discord `min_value` */
  minValue?: number;
  /** Maximum value (integer / number options) — maps to Discord `max_value` */
  maxValue?: number;
  /** Minimum string length — maps to Discord `min_length` */
  minLength?: number;
  /** Maximum string length — maps to Discord `max_length` */
  maxLength?: number;
  /** Allowed channel types (channel options) — maps to Discord `channel_types` */
  channelTypes?: number[];
}

/** Discriminator for discovered command modules */
export type CommandModuleType = 'slash' | 'message' | 'slash-group' | 'context-menu';

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
  /**
   * Composable guards — run after built-in `guildOnly` / `adminOnly` /
   * `permissions` / `cooldown` flags.
   */
  guards?: Guard[];
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

/** Resolve builder/string options for `editReply` */
function resolveEditReply(
  options: CommandReplyOptions,
): string | MessagePayload | InteractionEditReplyOptions {
  return resolveReplyOptions(options) as string | MessagePayload | InteractionEditReplyOptions;
}

/** Resolve builder/string options for `followUp` */
function resolveFollowUp(
  options: CommandReplyOptions,
): string | MessagePayload | InteractionReplyOptions {
  return resolveReplyOptions(options);
}

async function deferThenHelper(
  interaction: ChatInputCommandInteraction,
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
  } catch (error) {
    try {
      if (interaction.deferred || interaction.replied) {
        // editReply does not accept Ephemeral — use plain content
        await interaction.editReply({ content: 'Something went wrong.' });
      } else {
        await interaction.reply({
          content: 'Something went wrong.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch {
      try {
        await interaction.followUp({
          content: 'Something went wrong.',
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        // swallow secondary reply failures — original error is rethrown
      }
    }
    throw error;
  }
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
    reply: (options) => interaction.reply(resolveReplyOptions(options)),
    embed: (embed) => interaction.reply(resolveReplyOptions({ embed })),
    componentsV2: (...components) =>
      interaction.reply(resolveReplyOptions({ v2: components })),
    defer: (options) => interaction.deferReply(options),
    deferThen: (work, options) => deferThenHelper(interaction, work, options),
    editReply: (options) => interaction.editReply(resolveEditReply(options)),
    followUp: (options) => interaction.followUp(resolveFollowUp(options)),
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
