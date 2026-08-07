import type { Client, ClientEvents } from 'discord.js';
import type { Logger } from '@nexorajs/logger';
import type { CommandDefinition, MessageCommandDefinition } from './define.js';

/** Registered command with metadata */
export interface RegisteredCommand extends CommandDefinition {
  source?: string;
}

/** Command registry — holds all discovered commands */
export class CommandRegistry {
  private readonly commands = new Map<string, RegisteredCommand>();
  private readonly messageCommands = new Map<string, MessageCommandDefinition>();

  register(command: RegisteredCommand): void {
    this.commands.set(command.name, command);
  }

  registerMessage(command: MessageCommandDefinition): void {
    this.messageCommands.set(command.name.toLowerCase(), command);
    for (const alias of command.aliases ?? []) {
      this.messageCommands.set(alias.toLowerCase(), command);
    }
  }

  get(name: string): RegisteredCommand | undefined {
    return this.commands.get(name);
  }

  getMessage(name: string): MessageCommandDefinition | undefined {
    return this.messageCommands.get(name.toLowerCase());
  }

  getAll(): RegisteredCommand[] {
    return [...this.commands.values()];
  }

  get size(): number {
    return this.commands.size;
  }
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
        const commandDef = module.default as CommandDefinition | undefined;

        if (commandDef?.name && typeof commandDef.execute === 'function') {
          registry.register({ ...commandDef, source: file });
          logger.debug(`Registered command: ${commandDef.name}`, { file });
        }
      } catch (error) {
        logger.error(`Failed to load command: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  logger.info(`Discovered ${registry.size} command(s)`);
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

/** Attach command handlers to client */
export function attachCommandHandlers(
  client: Client,
  registry: CommandRegistry,
  logger: Logger,
): void {
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

    try {
      await cmd.execute({
        interaction,
        client,
        user: interaction.user,
        guildId: interaction.guildId,
      });
    } catch (error) {
      logger.error(`Command error: /${cmd.name}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      const reply = { content: 'An error occurred while executing this command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });
}

export type { CommandDefinition, CommandContext, MessageCommandDefinition } from './define.js';
export { command, messageCommand } from './define.js';
