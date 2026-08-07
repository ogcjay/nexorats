import {
  ApplicationCommandType,
  MessageFlags,
  PermissionFlagsBits,
  type ApplicationCommandDataResolvable,
  type Client,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction,
} from 'discord.js';
import type { Logger } from '@nexora.ts/logger';
import type { Cache } from '../cache/index.js';
import type { Container } from '../container/index.js';
import type { EventBus } from '../event-bus/index.js';
import { FrameworkEvents } from '../event-bus/index.js';
import {
  PipelineTraceBuilder,
  studioTelemetry,
} from '../studio-telemetry/index.js';
import type { CommandContext, CommandDefinition, MessageCommandDefinition } from './define.js';
import {
  createCommandContext,
  createMessageCommandContext,
} from './define.js';
import { resolveCommandExport } from './command-class.js';
import {
  resolveCommandGroupExport,
  type SlashCommandGroup,
  type SlashCommandSubGroup,
} from './command-group.js';
import type { SlashCommand } from './command-class.js';
import {
  createContextMenuContext,
  resolveContextMenuExport,
  type ContextMenuCommandDefinition,
  type ContextMenuType,
} from './context-menu.js';
import { runGuards } from './guards.js';
import {
  composeCommandMiddleware,
  type CommandMiddleware,
} from './middleware.js';

/** Registered command with metadata */
export interface RegisteredCommand extends CommandDefinition {
  source?: string;
}

/** Registered nested subcommand group (Discord option type 2) */
export interface RegisteredSubGroup {
  name: string;
  description: string;
  commands: CommandDefinition[];
}

/** Registered slash command group (top-level + flat and/or nested subcommands) */
export interface RegisteredCommandGroup {
  name: string;
  description: string;
  /** Flat type-1 subcommands under the parent */
  commands: CommandDefinition[];
  /** Nested type-2 subcommand groups */
  groups?: RegisteredSubGroup[];
  source?: string;
}

/** Registered context-menu command with metadata */
export interface RegisteredContextMenu extends ContextMenuCommandDefinition {
  source?: string;
}

/** Command registry — holds all discovered commands */
export class CommandRegistry {
  private readonly commands = new Map<string, RegisteredCommand>();
  private readonly groups = new Map<string, RegisteredCommandGroup>();
  private readonly contextMenus = new Map<string, RegisteredContextMenu>();
  /** Primary name → definition (aliases live only in lookup map) */
  private readonly messageCommandDefs = new Map<string, MessageCommandDefinition>();
  private readonly messageLookup = new Map<string, MessageCommandDefinition>();

  register(command: RegisteredCommand): void {
    this.commands.set(command.name, command);
  }

  registerGroup(group: RegisteredCommandGroup): void {
    this.groups.set(group.name, group);
  }

  registerContextMenu(command: RegisteredContextMenu): void {
    this.contextMenus.set(contextMenuKey(command.type, command.name), command);
  }

  registerMessage(command: MessageCommandDefinition): void {
    this.messageCommandDefs.set(command.name.toLowerCase(), command);
    this.messageLookup.set(command.name.toLowerCase(), command);
    for (const alias of command.aliases ?? []) {
      this.messageLookup.set(alias.toLowerCase(), command);
    }
  }

  get(name: string): RegisteredCommand | undefined {
    return this.commands.get(name);
  }

  getGroup(name: string): RegisteredCommandGroup | undefined {
    return this.groups.get(name);
  }

  getContextMenu(
    type: ContextMenuType,
    name: string,
  ): RegisteredContextMenu | undefined {
    return this.contextMenus.get(contextMenuKey(type, name));
  }

  getMessage(name: string): MessageCommandDefinition | undefined {
    return this.messageLookup.get(name.toLowerCase());
  }

  getAll(): RegisteredCommand[] {
    return [...this.commands.values()];
  }

  getAllGroups(): RegisteredCommandGroup[] {
    return [...this.groups.values()];
  }

  getAllContextMenus(): RegisteredContextMenu[] {
    return [...this.contextMenus.values()];
  }

  getAllMessage(): MessageCommandDefinition[] {
    return [...this.messageCommandDefs.values()];
  }

  /** Top-level chat-input commands (standalone + groups) */
  get size(): number {
    return this.commands.size + this.groups.size;
  }

  get groupCount(): number {
    return this.groups.size;
  }

  get contextMenuCount(): number {
    return this.contextMenus.size;
  }

  get messageCommandCount(): number {
    return this.messageCommandDefs.size;
  }
}

function contextMenuKey(type: ContextMenuType, name: string): string {
  return `${type}:${name}`;
}

/** Options for {@link attachCommandHandlers} */
export interface AttachCommandHandlersOptions {
  eventBus?: EventBus;
  /**
   * Onion middleware (first-registered = outermost, Express-style).
   * Prefer passing the live array from {@link import('../nexora.js').Nexora.useCommand}.
   */
  middlewares?: readonly CommandMiddleware[];
  /** Optional DI container — wired into {@link CommandContext} */
  container?: Container;
  /** Optional logger — also exposed as `ctx.logger` */
  logger?: Logger;
  /** Optional cache — exposed as `ctx.cache` */
  cache?: Cache;
}

/** Auto-discover and register commands from glob patterns */
export async function discoverCommands(
  patterns: string[],
  registry: CommandRegistry,
  logger: Logger,
): Promise<void> {
  const { glob } = await import('glob');
  const { pathToFileURL } = await import('node:url');

  for (const pattern of patterns) {
    const files = await glob(pattern, { absolute: true });

    for (const file of files) {
      try {
        const module = await import(pathToFileURL(file).href);
        const exported = module.default as unknown;

        const messageDef = resolveMessageExport(exported);
        if (messageDef) {
          registry.registerMessage(messageDef);
          logger.debug(`Registered message command: ${messageDef.name}`, { file });
          continue;
        }

        const contextMenuDef = resolveContextMenuExport(exported);
        if (contextMenuDef) {
          registry.registerContextMenu(
            Object.assign(contextMenuDef, { source: file }),
          );
          logger.debug(
            `Registered context menu (${contextMenuDef.type}): ${contextMenuDef.name}`,
            { file },
          );
          continue;
        }

        const groupDef = resolveCommandGroupExport(exported);
        if (groupDef) {
          registry.registerGroup(toRegisteredGroup(groupDef, file));
          logger.debug(`Registered command group: ${groupDef.name}`, {
            file,
            subcommands: (groupDef.commands ?? []).map((c) => c.name),
            groups: (groupDef.groups ?? []).map((g) => g.name),
          });
          continue;
        }

        const commandDef = resolveCommandExport(exported);
        if (commandDef) {
          registry.register(Object.assign(commandDef, { source: file }));
          logger.debug(`Registered command: ${commandDef.name}`, { file });
        }
      } catch (error) {
        logger.error(`Failed to load command: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  logger.info(
    `Discovered ${registry.size} slash command(s)` +
      (registry.groupCount ? ` (${registry.groupCount} group(s))` : '') +
      `, ${registry.contextMenuCount} context menu(s)` +
      `, ${registry.messageCommandCount} message command(s)`,
  );
}

function toRegisteredGroup(
  group: SlashCommandGroup,
  source: string,
): RegisteredCommandGroup {
  return {
    name: group.name,
    description: group.description,
    commands: (group.commands ?? []).map((cmd) => mapSubCommand(cmd, group)),
    groups: (group.groups ?? []).map((subGroup) => mapSubGroup(subGroup, group)),
    source,
  };
}

function mapSubGroup(
  subGroup: SlashCommandSubGroup,
  parent: SlashCommandGroup,
): RegisteredSubGroup {
  return {
    name: subGroup.name,
    description: subGroup.description,
    commands: subGroup.commands.map((cmd) => mapSubCommand(cmd, parent)),
  };
}

/** Map a SlashCommand onto a CommandDefinition, merging parent group defaults (sub wins). */
function mapSubCommand(cmd: SlashCommand, group: SlashCommandGroup): CommandDefinition {
  return {
    name: cmd.name,
    description: cmd.description,
    options: cmd.options,
    guildOnly: cmd.guildOnly ?? group.guildOnly,
    adminOnly: cmd.adminOnly ?? group.adminOnly,
    permissions: cmd.permissions ?? group.permissions,
    cooldown: cmd.cooldown ?? group.cooldown,
    ephemeral: cmd.ephemeral,
    type: 'slash' as const,
    execute: (ctx) => cmd.execute(ctx),
    autocomplete: cmd.autocomplete
      ? (interaction) => cmd.autocomplete!(interaction)
      : undefined,
  };
}

/** Resolve a flat or nested subcommand from a registered group */
function resolveGroupSubcommand(
  group: RegisteredCommandGroup,
  interaction: {
    options: {
      getSubcommandGroup(required?: boolean): string | null;
      getSubcommand(required?: boolean): string | null;
    };
  },
): { sub: CommandDefinition; label: string; cooldownKey: string } | undefined {
  const subGroupName = interaction.options.getSubcommandGroup(false);
  const subName = interaction.options.getSubcommand(false);
  if (!subName) return undefined;

  if (subGroupName) {
    const nested = group.groups?.find((g) => g.name === subGroupName);
    const sub = nested?.commands.find((c) => c.name === subName);
    if (!sub) return undefined;
    return {
      sub,
      label: `${group.name} ${subGroupName} ${sub.name}`,
      cooldownKey: `${group.name}:${subGroupName}:${sub.name}`,
    };
  }

  const sub = group.commands.find((c) => c.name === subName);
  if (!sub) return undefined;
  return {
    sub,
    label: `${group.name} ${sub.name}`,
    cooldownKey: `${group.name}:${sub.name}`,
  };
}

function resolveMessageExport(exported: unknown): MessageCommandDefinition | null {
  if (exported == null || typeof exported !== 'object') return null;
  const obj = exported as Record<string, unknown>;
  // Context menus also use type: 'message' — exclude them
  if (obj.kind === 'context-menu') return null;
  if (obj.type !== 'message') return null;
  if (typeof obj.name !== 'string' || typeof obj.execute !== 'function') return null;
  return exported as MessageCommandDefinition;
}

/** Discord Application Command option type: SUB_COMMAND */
const OPTION_TYPE_SUB_COMMAND = 1;
/** Discord Application Command option type: SUB_COMMAND_GROUP */
const OPTION_TYPE_SUB_COMMAND_GROUP = 2;

/** Register slash + context-menu commands with Discord API */
export async function deployCommands(
  client: Client,
  registry: CommandRegistry,
  guildIds?: string[],
  logger?: Logger,
): Promise<void> {
  const payload = [
    ...registry.getAll().map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options?.map(mapCommandOption),
    })),
    ...registry.getAllGroups().map((group) => ({
      name: group.name,
      description: group.description,
      options: [
        ...group.commands.map((sub) => ({
          type: OPTION_TYPE_SUB_COMMAND,
          name: sub.name,
          description: sub.description,
          options: sub.options?.map(mapCommandOption),
        })),
        ...(group.groups ?? []).map((subGroup) => ({
          type: OPTION_TYPE_SUB_COMMAND_GROUP,
          name: subGroup.name,
          description: subGroup.description,
          options: subGroup.commands.map((sub) => ({
            type: OPTION_TYPE_SUB_COMMAND,
            name: sub.name,
            description: sub.description,
            options: sub.options?.map(mapCommandOption),
          })),
        })),
      ],
    })),
    ...registry.getAllContextMenus().map((cmd) =>
      cmd.type === 'user'
        ? { name: cmd.name, type: ApplicationCommandType.User as const }
        : { name: cmd.name, type: ApplicationCommandType.Message as const },
    ),
  ] as ApplicationCommandDataResolvable[];

  if (guildIds?.length) {
    for (const guildId of guildIds) {
      const guild = await client.guilds.fetch(guildId);
      await guild.commands.set(payload);
      logger?.info(`Deployed ${payload.length} command(s) to guild ${guildId}`);
    }
  } else {
    await client.application?.commands.set(payload);
    logger?.info(`Deployed ${payload.length} global command(s)`);
  }
}

function mapCommandOption(opt: NonNullable<CommandDefinition['options']>[number]) {
  return {
    name: opt.name,
    description: opt.description,
    type: mapOptionType(opt.type),
    required: opt.required ?? false,
    choices: opt.choices,
    autocomplete: opt.autocomplete,
    min_value: opt.minValue,
    max_value: opt.maxValue,
    min_length: opt.minLength,
    max_length: opt.maxLength,
    channel_types: opt.channelTypes,
  };
}

function mapOptionType(type: string): number {
  const types: Record<string, number> = {
    string: 3,
    integer: 4,
    boolean: 5,
    user: 6,
    channel: 7,
    role: 8,
    mentionable: 9,
    number: 10,
    attachment: 11,
  };
  return types[type] ?? 3;
}

/** Attach slash + context-menu + message command handlers to the client */
export function attachCommandHandlers(
  client: Client,
  registry: CommandRegistry,
  logger: Logger,
  options?: AttachCommandHandlersOptions,
): void {
  const eventBus = options?.eventBus;
  const middlewares = options?.middlewares ?? [];
  const container = options?.container;
  const cache = options?.cache;
  /** key: `${commandName}:${userId}` → cooldown expiry timestamp (ms) */
  const cooldowns = new Map<string, number>();

  const ctxExtras = {
    logger: options?.logger ?? logger,
    cache,
    container,
  };

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete()) {
      const group = registry.getGroup(interaction.commandName);
      if (group) {
        const resolved = resolveGroupSubcommand(group, interaction);
        if (resolved?.sub.autocomplete) {
          await resolved.sub.autocomplete(interaction);
        }
        return;
      }

      const cmd = registry.get(interaction.commandName);
      if (cmd?.autocomplete) {
        await cmd.autocomplete(interaction);
      }
      return;
    }

    if (interaction.isUserContextMenuCommand()) {
      await runContextMenu(
        interaction,
        registry.getContextMenu('user', interaction.commandName),
        client,
        logger,
        eventBus,
      );
      return;
    }

    if (interaction.isMessageContextMenuCommand()) {
      await runContextMenu(
        interaction,
        registry.getContextMenu('message', interaction.commandName),
        client,
        logger,
        eventBus,
      );
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const group = registry.getGroup(interaction.commandName);
    if (group) {
      const resolved = resolveGroupSubcommand(group, interaction);
      if (!resolved) return;

      const { sub, label: commandLabel, cooldownKey } = resolved;
      await runSlashCommand({
        interaction,
        client,
        cmd: sub,
        commandLabel,
        cooldownKey,
        cooldowns,
        middlewares,
        logger,
        eventBus,
        ctxExtras,
      });
      return;
    }

    const cmd = registry.get(interaction.commandName);
    if (!cmd) return;

    await runSlashCommand({
      interaction,
      client,
      cmd,
      commandLabel: cmd.name,
      cooldownKey: undefined,
      cooldowns,
      middlewares,
      logger,
      eventBus,
      ctxExtras,
    });
  });

  // Content-match message commands (first token = name/alias, no prefix)
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content) return;

    const trimmed = message.content.trim();
    if (!trimmed) return;

    const [rawName, ...args] = trimmed.split(/\s+/);
    if (!rawName) return;

    const cmd = registry.getMessage(rawName);
    if (!cmd) return;

    const pipe = new PipelineTraceBuilder(
      cmd.name,
      message.author.id,
      message.guildId,
    );
    const started = Date.now();

    try {
      const ctx = createMessageCommandContext(message, client, args);
      await pipe.timed('execute', 'command', () => cmd.execute(ctx));

      const duration = Date.now() - started;
      const logStart = performance.now();
      logger.command(cmd.name, {
        name: cmd.name,
        user: message.author.tag,
        duration,
      });
      pipe.push({
        name: 'logger',
        kind: 'logger',
        status: 'ok',
        durationMs: performance.now() - logStart,
      });

      studioTelemetry.recordPipelineTrace(pipe.finish('ok'));
      studioTelemetry.recordCommandResult({
        name: cmd.name,
        durationMs: duration,
        outcome: 'ok',
      });

      await eventBus?.emit(FrameworkEvents.COMMAND_EXECUTED, {
        command: cmd.name,
        userId: message.author.id,
        guildId: message.guildId,
        message,
        kind: 'message' as const,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - started;
      const errMsg = error instanceof Error ? error.message : String(error);

      logger.error(`Message command error: ${cmd.name}`, {
        error: errMsg,
      });

      studioTelemetry.recordPipelineTrace(pipe.finish('error', errMsg));
      studioTelemetry.recordCommandResult({
        name: cmd.name,
        durationMs: duration,
        outcome: 'error',
        error: errMsg,
      });

      await eventBus?.emit(FrameworkEvents.COMMAND_ERROR, {
        command: cmd.name,
        userId: message.author.id,
        guildId: message.guildId,
        error,
        message,
        kind: 'message' as const,
      });
    }
  });
}

interface RunSlashCommandArgs {
  interaction: ChatInputCommandInteraction;
  client: Client;
  cmd: CommandDefinition;
  commandLabel: string;
  cooldownKey: string | undefined;
  cooldowns: Map<string, number>;
  middlewares: readonly CommandMiddleware[];
  logger: Logger;
  eventBus?: EventBus;
  ctxExtras: {
    logger: Logger;
    cache?: Cache;
    container?: Container;
  };
}

async function runSlashCommand(args: RunSlashCommandArgs): Promise<void> {
  const {
    interaction,
    client,
    cmd,
    commandLabel,
    cooldownKey,
    cooldowns,
    middlewares,
    logger,
    eventBus,
    ctxExtras,
  } = args;

  const pipe = new PipelineTraceBuilder(
    commandLabel,
    interaction.user.id,
    interaction.guildId,
  );

  const ctx = createCommandContext(interaction, client, {
    ephemeral: cmd.ephemeral,
    ...ctxExtras,
  });

  const blocked = await enforceGuards(
    interaction,
    cmd,
    cooldowns,
    ctx,
    pipe,
    cooldownKey,
  );
  if (blocked) {
    const trace = pipe.finish('denied');
    studioTelemetry.recordPipelineTrace(trace);
    studioTelemetry.recordCommandResult({
      name: commandLabel,
      durationMs: trace.totalMs,
      outcome: 'denied',
    });
    return;
  }

  const started = Date.now();
  const run = composeCommandMiddleware(
    middlewares,
    (c) => cmd.execute(c),
    { onStep: (step) => pipe.push(step) },
  );

  try {
    await run(ctx);
    const duration = Date.now() - started;

    const logStart = performance.now();
    logger.command(`/${commandLabel}`, {
      name: commandLabel,
      user: interaction.user.tag,
      duration,
    });
    pipe.push({
      name: 'logger',
      kind: 'logger',
      status: 'ok',
      durationMs: performance.now() - logStart,
    });

    studioTelemetry.recordPipelineTrace(pipe.finish('ok'));
    studioTelemetry.recordCommandResult({
      name: commandLabel,
      durationMs: duration,
      outcome: 'ok',
    });

    await eventBus?.emit(FrameworkEvents.COMMAND_EXECUTED, {
      command: commandLabel,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      interaction,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - started;
    const errMsg = error instanceof Error ? error.message : String(error);

    logger.error(`Command error: /${commandLabel}`, {
      error: errMsg,
    });

    studioTelemetry.recordPipelineTrace(pipe.finish('error', errMsg));
    studioTelemetry.recordCommandResult({
      name: commandLabel,
      durationMs: duration,
      outcome: 'error',
      error: errMsg,
    });

    await eventBus?.emit(FrameworkEvents.COMMAND_ERROR, {
      command: commandLabel,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error,
      interaction,
    });

    await replyCommandError(interaction);
  }
}

async function runContextMenu(
  interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction,
  cmd: RegisteredContextMenu | undefined,
  client: Client,
  logger: Logger,
  eventBus?: EventBus,
): Promise<void> {
  if (!cmd) return;

  const label = `ctx:${cmd.type}:${cmd.name}`;
  const pipe = new PipelineTraceBuilder(
    label,
    interaction.user.id,
    interaction.guildId,
  );
  const ctx = createContextMenuContext(interaction, client);

  if (cmd.guards?.length) {
    const result = await runGuards(ctx as unknown as CommandContext, cmd.guards, {
      onGuard: ({ index, durationMs, result: guardResult }) => {
        const denied = guardResult !== true;
        pipe.push({
          name: `guard[${index}]`,
          kind: 'guard',
          status: denied ? 'deny' : 'ok',
          durationMs,
          detail:
            typeof guardResult === 'string'
              ? guardResult
              : denied
                ? 'denied'
                : undefined,
        });
      },
    });
    if (result !== true) {
      const message =
        typeof result === 'string' ? result : 'You cannot use this command.';
      await replyEphemeral(interaction, message);
      const trace = pipe.finish('denied');
      studioTelemetry.recordPipelineTrace(trace);
      studioTelemetry.recordCommandResult({
        name: label,
        durationMs: trace.totalMs,
        outcome: 'denied',
      });
      return;
    }
  }

  const started = Date.now();

  try {
    await pipe.timed('execute', 'command', () => cmd.execute(ctx));
    const duration = Date.now() - started;

    const logStart = performance.now();
    logger.command(label, {
      name: cmd.name,
      user: interaction.user.tag,
      duration,
    });
    pipe.push({
      name: 'logger',
      kind: 'logger',
      status: 'ok',
      durationMs: performance.now() - logStart,
    });

    studioTelemetry.recordPipelineTrace(pipe.finish('ok'));
    studioTelemetry.recordCommandResult({
      name: label,
      durationMs: duration,
      outcome: 'ok',
    });

    await eventBus?.emit(FrameworkEvents.COMMAND_EXECUTED, {
      command: cmd.name,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      interaction,
      kind: 'context-menu' as const,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - started;
    const errMsg = error instanceof Error ? error.message : String(error);

    logger.error(`Context menu error: ${cmd.name}`, {
      error: errMsg,
    });

    studioTelemetry.recordPipelineTrace(pipe.finish('error', errMsg));
    studioTelemetry.recordCommandResult({
      name: label,
      durationMs: duration,
      outcome: 'error',
      error: errMsg,
    });

    await eventBus?.emit(FrameworkEvents.COMMAND_ERROR, {
      command: cmd.name,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error,
      interaction,
      kind: 'context-menu' as const,
    });

    await replyCommandError(interaction);
  }
}

async function replyCommandError(
  interaction:
    | ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction,
): Promise<void> {
  const reply = {
    content: 'An error occurred while executing this command.',
    flags: MessageFlags.Ephemeral as const,
  };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(reply);
  } else {
    await interaction.reply(reply);
  }
}

/** @returns true if execution should abort */
async function enforceGuards(
  interaction: ChatInputCommandInteraction,
  cmd: CommandDefinition,
  cooldowns: Map<string, number>,
  ctx: CommandContext,
  pipe: PipelineTraceBuilder,
  cooldownKeyPrefix?: string,
): Promise<boolean> {
  if (cmd.guildOnly) {
    const t0 = performance.now();
    const denied = !interaction.guildId;
    pipe.push({
      name: 'guildOnly',
      kind: 'validation',
      status: denied ? 'deny' : 'ok',
      durationMs: performance.now() - t0,
      detail: denied ? 'DM rejected' : undefined,
    });
    if (denied) {
      await replyEphemeral(interaction, 'This command can only be used in a server.');
      return true;
    }
  }

  if (cmd.adminOnly) {
    const t0 = performance.now();
    const perms = interaction.memberPermissions;
    const denied = !perms?.has(PermissionFlagsBits.Administrator);
    pipe.push({
      name: 'adminOnly',
      kind: 'permission',
      status: denied ? 'deny' : 'ok',
      durationMs: performance.now() - t0,
    });
    if (denied) {
      await replyEphemeral(interaction, 'You need Administrator permission to use this command.');
      return true;
    }
  }

  if (cmd.permissions?.length) {
    const t0 = performance.now();
    const perms = interaction.memberPermissions;
    const denied = !perms?.has(cmd.permissions);
    pipe.push({
      name: 'permissions',
      kind: 'permission',
      status: denied ? 'deny' : 'ok',
      durationMs: performance.now() - t0,
    });
    if (denied) {
      await replyEphemeral(interaction, 'You lack the required permissions for this command.');
      return true;
    }
  }

  if (cmd.cooldown != null && cmd.cooldown > 0) {
    const t0 = performance.now();
    const key = `${cooldownKeyPrefix ?? cmd.name}:${interaction.user.id}`;
    const now = Date.now();
    const expiresAt = cooldowns.get(key);

    if (expiresAt != null && now < expiresAt) {
      const remainingSec = Math.ceil((expiresAt - now) / 1000);
      pipe.push({
        name: 'cooldown',
        kind: 'rateLimit',
        status: 'deny',
        durationMs: performance.now() - t0,
        detail: `${remainingSec}s remaining`,
      });
      await replyEphemeral(
        interaction,
        `Please wait ${remainingSec}s before using this command again.`,
      );
      return true;
    }

    cooldowns.set(key, now + cmd.cooldown);
    pipe.push({
      name: 'cooldown',
      kind: 'rateLimit',
      status: 'ok',
      durationMs: performance.now() - t0,
    });
  }

  if (cmd.guards?.length) {
    const result = await runGuards(ctx, cmd.guards, {
      onGuard: ({ index, durationMs, result: guardResult }) => {
        const denied = guardResult !== true;
        pipe.push({
          name: `guard[${index}]`,
          kind: 'guard',
          status: denied ? 'deny' : 'ok',
          durationMs,
          detail:
            typeof guardResult === 'string'
              ? guardResult
              : denied
                ? 'denied'
                : undefined,
        });
      },
    });
    if (result !== true) {
      const message =
        typeof result === 'string' ? result : 'You cannot use this command.';
      await replyEphemeral(interaction, message);
      return true;
    }
  }

  return false;
}

async function replyEphemeral(
  interaction:
    | ChatInputCommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction,
  content: string,
): Promise<void> {
  const options = { content, flags: MessageFlags.Ephemeral as const };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(options);
  } else {
    await interaction.reply(options);
  }
}

export type { CommandDefinition, CommandContext, MessageCommandDefinition } from './define.js';
export { command, messageCommand } from './define.js';
