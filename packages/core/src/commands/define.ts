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
import type { Logger } from '@nexora.ts/logger';
import type { ComponentLike, EmbedLike } from '../builders/index.js';
import type { Cache } from '../cache/index.js';
import type { Container, ServiceToken } from '../container/index.js';
import type { Guard } from './guards.js';
import {
  buildStatusReply,
  type StatusReplyOptions,
} from './reply-presets.js';

export type { StatusReplyOptions } from './reply-presets.js';

/** Optional DI accessors on {@link CommandContext} */
export interface CommandContextServices {
  get<T>(token: ServiceToken<T>): T;
  tryGet<T>(token: ServiceToken<T>): T | undefined;
}

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

  /** Framework logger when wired via {@link createCommandContext} / attach options */
  logger?: Logger;
  /** Shared cache when wired via attach options */
  cache?: Cache;
  /** DI container when wired via attach options */
  container?: Container;
  /**
   * Resolve services from {@link container} when available.
   * Prefer `ctx.logger` / `ctx.cache` for well-known deps.
   */
  services?: CommandContextServices;

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
  /**
   * Reply with a green success embed (ephemeral by default).
   * @example await ctx.success('User banned.');
   */
  success(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
  /** Reply with a red error embed (ephemeral by default) */
  error(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
  /** Reply with a yellow warning embed (ephemeral by default) */
  warn(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
  /** Reply with a blurple info embed (ephemeral by default) */
  info(description: string, options?: StatusReplyOptions): Promise<InteractionResponse<boolean>>;
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
   * When `true`, `ctx.reply` / `ctx.embed` / `ctx.componentsV2` default to
   * ephemeral unless the call sets `ephemeral` explicitly.
   * Does not affect `ctx.success` / `ctx.error` (already ephemeral by default).
   */
  ephemeral?: boolean;
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
 * @param definition - Slash command name, description, options, and execute handler
 * @returns The same definition with `type: 'slash'`
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

/**
 * Shortest slash-command factory for beginners.
 *
 * @param name - Slash command name
 * @param description - Command description shown in Discord
 * @param execute - Handler receiving {@link CommandContext}
 * @param options - Optional flags (ephemeral, guildOnly, options, …)
 * @returns A {@link CommandDefinition} ready for discovery
 * @example
 * export default slash('ping', 'Check latency', async (ctx) => {
 *   await ctx.reply('Pong!');
 * });
 *
 * @example
 * export default slash('secret', 'Private info', async (ctx) => {
 *   await ctx.reply('Shh');
 * }, { ephemeral: true, guildOnly: true });
 */
export function slash(
  name: string,
  description: string,
  execute: (ctx: CommandContext) => Promise<void> | void,
  options?: Omit<CommandDefinition, 'name' | 'description' | 'execute' | 'type'>,
): CommandDefinition {
  return command({ name, description, execute, ...options });
}

/**
 * Type-safe message command builder (content-match, no prefix).
 *
 * @param definition - Message command name, optional aliases, and execute handler
 * @returns The same definition with `type: 'message'`
 * @example
 * export default messageCommand({
 *   name: 'hello',
 *   async execute(ctx) {
 *     await ctx.reply('Hi!');
 *   },
 * });
 */
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

/** Options for {@link createCommandContext} */
export interface CreateCommandContextOptions {
  /** Default ephemeral for reply / embed / componentsV2 when not set per-call */
  ephemeral?: boolean;
  /** Optional logger exposed as `ctx.logger` */
  logger?: Logger;
  /** Optional cache exposed as `ctx.cache` */
  cache?: Cache;
  /** Optional DI container — enables `ctx.container` and `ctx.services` */
  container?: Container;
}

/** Apply command-level default ephemeral unless the payload already sets it */
export function withDefaultEphemeral(
  options: CommandReplyOptions,
  defaultEphemeral?: boolean,
): CommandReplyOptions {
  if (!defaultEphemeral) return options;

  if (typeof options === 'string') {
    return { content: options, ephemeral: true };
  }

  if (options instanceof MessagePayload) {
    return options;
  }

  // Bare builder (EmbedBuilder / etc.) — wrap so we can set ephemeral
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
    return { embeds: [options.toJSON() as APIEmbed], ephemeral: true };
  }

  const obj = options as BuilderReplyOptions & InteractionReplyOptions;
  if (obj.ephemeral !== undefined) return options;
  return { ...obj, ephemeral: true };
}

function createServicesBag(
  container: Container | undefined,
): CommandContextServices | undefined {
  if (!container) return undefined;
  return {
    get<T>(token: ServiceToken<T>): T {
      return container.resolve(token);
    },
    tryGet<T>(token: ServiceToken<T>): T | undefined {
      if (!container.has(token)) return undefined;
      return container.resolve(token);
    },
  };
}

/**
 * Build a CommandContext from a chat-input interaction.
 *
 * @param interaction - Discord chat-input command interaction
 * @param client - Discord.js client
 * @param contextOptions - Optional ephemeral default, logger, cache, and DI container
 * @returns A typed {@link CommandContext} with reply helpers
 * @example
 * const ctx = createCommandContext(interaction, client, {
 *   ephemeral: true,
 *   logger,
 *   cache,
 *   container,
 * });
 * await ctx.reply('Hello!');
 */
export function createCommandContext(
  interaction: ChatInputCommandInteraction,
  client: Client,
  contextOptions?: CreateCommandContextOptions,
): CommandContext {
  const defaultEphemeral = contextOptions?.ephemeral;
  const container = contextOptions?.container;
  const logger = contextOptions?.logger;
  const cache = contextOptions?.cache;

  const reply = (options: CommandReplyOptions) =>
    interaction.reply(resolveReplyOptions(withDefaultEphemeral(options, defaultEphemeral)));

  return {
    interaction,
    client,
    user: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    channel: interaction.channel,
    guildId: interaction.guildId,
    logger,
    cache,
    container,
    services: createServicesBag(container),
    reply,
    embed: (embed) =>
      interaction.reply(
        resolveReplyOptions(withDefaultEphemeral({ embed }, defaultEphemeral)),
      ),
    componentsV2: (...components) =>
      interaction.reply(
        resolveReplyOptions(withDefaultEphemeral({ v2: components }, defaultEphemeral)),
      ),
    defer: (options) =>
      interaction.deferReply(
        defaultEphemeral && options?.ephemeral === undefined
          ? { ...options, ephemeral: true }
          : options,
      ),
    deferThen: (work, options) =>
      deferThenHelper(
        interaction,
        work,
        defaultEphemeral && options?.ephemeral === undefined
          ? { ...options, ephemeral: true }
          : options,
      ),
    editReply: (options) => interaction.editReply(resolveEditReply(options)),
    followUp: (options) =>
      interaction.followUp(
        resolveFollowUp(withDefaultEphemeral(options, defaultEphemeral)),
      ),
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
