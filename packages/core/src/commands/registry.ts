import {
  MessageFlags,
  PermissionFlagsBits,
  type Client,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Logger } from '@nexorajs/logger';
import type { EventBus } from '../event-bus/index.js';
import { FrameworkEvents } from '../event-bus/index.js';
import type { CommandDefinition, MessageCommandDefinition } from './define.js';
import {
  createCommandContext,
  createMessageCommandContext,
} from './define.js';
import { resolveCommandExport } from './command-class.js';

/** Registered command with metadata */
export interface RegisteredCommand extends CommandDefinition {
  source?: string;
}

/** Command registry — holds all discovered commands */
export class CommandRegistry {
  private readonly commands = new Map<string, RegisteredCommand>();
  /** Primary name → definition (aliases live only in lookup map) */
  private readonly messageCommandDefs = new Map<string, MessageCommandDefinition>();
  private readonly messageLookup = new Map<string, MessageCommandDefinition>();

  register(command: RegisteredCommand): void {
    this.commands.set(command.name, command);
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

  getMessage(name: string): MessageCommandDefinition | undefined {
    return this.messageLookup.get(name.toLowerCase());
  }

  getAll(): RegisteredCommand[] {
    return [...this.commands.values()];
  }

  getAllMessage(): MessageCommandDefinition[] {
    return [...this.messageCommandDefs.values()];
  }

  get size(): number {
    return this.commands.size;
  }

  get messageCommandCount(): number {
    return this.messageCommandDefs.size;
  }
}

/** Options for {@link attachCommandHandlers} */
export interface AttachCommandHandlersOptions {
  eventBus?: EventBus;
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
    `Discovered ${registry.size} slash command(s), ${registry.messageCommandCount} message command(s)`,
  );
}

function resolveMessageExport(exported: unknown): MessageCommandDefinition | null {
  if (exported == null || typeof exported !== 'object') return null;
  const obj = exported as Record<string, unknown>;
  if (obj.type !== 'message') return null;
  if (typeof obj.name !== 'string' || typeof obj.execute !== 'function') return null;
  return exported as MessageCommandDefinition;
}

/** Register slash commands with Discord API */
export async function deployCommands(
  client: Client,
  registry: CommandRegistry,
  guildIds?: string[],
  logger?: Logger,
): Promise<void> {
  const payload = registry.getAll().map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options?.map((opt) => ({
      name: opt.name,
      description: opt.description,
      type: mapOptionType(opt.type),
      required: opt.required ?? false,
      choices: opt.choices,
      autocomplete: opt.autocomplete,
    })),
  }));

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
  };
  return types[type] ?? 3;
}

/** Attach slash + message command handlers to the client */
export function attachCommandHandlers(
  client: Client,
  registry: CommandRegistry,
  logger: Logger,
  options?: AttachCommandHandlersOptions,
): void {
  const eventBus = options?.eventBus;
  /** key: `${commandName}:${userId}` → cooldown expiry timestamp (ms) */
  const cooldowns = new Map<string, number>();

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete()) {
      const cmd = registry.get(interaction.commandName);
      if (cmd?.autocomplete) {
        await cmd.autocomplete(interaction);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const cmd = registry.get(interaction.commandName);
    if (!cmd) return;

    const blocked = await enforceGuards(interaction, cmd, cooldowns);
    if (blocked) return;

    const ctx = createCommandContext(interaction, client);
    const started = Date.now();

    try {
      await cmd.execute(ctx);
      const duration = Date.now() - started;

      logger.command(`/${cmd.name}`, {
        name: cmd.name,
        user: interaction.user.tag,
        duration,
      });

      await eventBus?.emit(FrameworkEvents.COMMAND_EXECUTED, {
        command: cmd.name,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        interaction,
        duration,
      });
    } catch (error) {
      logger.error(
        `Command error: /${cmd.name}`,
        error instanceof Error ? error : { error: String(error) },
      );

      await eventBus?.emit(FrameworkEvents.COMMAND_ERROR, {
        command: cmd.name,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        error,
        interaction,
      });

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

    const started = Date.now();
    try {
      const ctx = createMessageCommandContext(message, client, args);
      await cmd.execute(ctx);
      const duration = Date.now() - started;

      logger.command(cmd.name, {
        name: cmd.name,
        user: message.author.tag,
        duration,
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
      logger.error(
        `Message command error: ${cmd.name}`,
        error instanceof Error ? error : { error: String(error) },
      );

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

/** @returns true if execution should abort */
async function enforceGuards(
  interaction: ChatInputCommandInteraction,
  cmd: CommandDefinition,
  cooldowns: Map<string, number>,
): Promise<boolean> {
  if (cmd.guildOnly && !interaction.guildId) {
    await replyEphemeral(interaction, 'This command can only be used in a server.');
    return true;
  }

  if (cmd.adminOnly) {
    const perms = interaction.memberPermissions;
    if (!perms?.has(PermissionFlagsBits.Administrator)) {
      await replyEphemeral(interaction, 'You need Administrator permission to use this command.');
      return true;
    }
  }

  if (cmd.permissions?.length) {
    const perms = interaction.memberPermissions;
    if (!perms?.has(cmd.permissions)) {
      await replyEphemeral(interaction, 'You lack the required permissions for this command.');
      return true;
    }
  }

  if (cmd.cooldown != null && cmd.cooldown > 0) {
    const key = `${cmd.name}:${interaction.user.id}`;
    const now = Date.now();
    const expiresAt = cooldowns.get(key);

    if (expiresAt != null && now < expiresAt) {
      const remainingSec = Math.ceil((expiresAt - now) / 1000);
      await replyEphemeral(
        interaction,
        `Please wait ${remainingSec}s before using this command again.`,
      );
      return true;
    }

    cooldowns.set(key, now + cmd.cooldown);
  }

  return false;
}

async function replyEphemeral(
  interaction: ChatInputCommandInteraction,
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
