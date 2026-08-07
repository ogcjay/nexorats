import { Client, GatewayIntentBits, Partials, type ClientOptions } from 'discord.js';
import type { NexoraConfig } from '@nexora.ts/config';
import { createLiveLogger, printStartupBanner, type Logger } from '@nexora.ts/logger';
import { Container, TOKENS } from './container/index.js';
import {
  CommandRegistry,
  discoverCommands,
  deployCommands,
  attachCommandHandlers,
} from './commands/index.js';
import type { CommandMiddleware } from './commands/middleware.js';
import { EventRegistry, discoverEvents, attachEventHandlers } from './events/index.js';
import {
  InteractionRegistry,
  discoverInteractions,
  attachInteractionHandlers,
} from './interactions/index.js';
import { EventBus, FrameworkEvents } from './event-bus/index.js';
import { Cache, MemoryCacheAdapter } from './cache/index.js';
import { Scheduler } from './scheduler/index.js';
import { checkForCoreUpdate, getInstalledCoreVersion } from './update-check.js';

/** Nexora bootstrap options */
export interface NexoraOptions {
  config: NexoraConfig;
  commandsPath?: string | string[];
  eventsPath?: string | string[];
  /** Glob(s) for button/select/modal handlers — default `./interactions/` + recursive `*.ts` */
  interactionsPath?: string | string[];
  clientOptions?: Partial<ClientOptions>;
}

/** Bot lifecycle phases */
export type LifecyclePhase = 'idle' | 'starting' | 'ready' | 'stopping' | 'stopped';

/**
 * Main Nexora bot class.
 * Orchestrates DI container, Discord client, commands, events, cache, and scheduler.
 */
export class Nexora {
  readonly container: Container;
  readonly logger: Logger;
  readonly client: Client;
  readonly commandRegistry: CommandRegistry;
  readonly eventRegistry: EventRegistry;
  readonly interactionRegistry: InteractionRegistry;
  readonly eventBus: EventBus;
  readonly cache: Cache;
  readonly scheduler: Scheduler;
  /** Bot config passed at construction (also registered as TOKENS.Config). */
  readonly config: NexoraConfig;

  private readonly commandsPath: string[];
  private readonly eventsPath: string[];
  private readonly interactionsPath: string[];
  private readonly commandMiddlewares: CommandMiddleware[] = [];
  private phase: LifecyclePhase = 'idle';

  constructor(options: NexoraOptions) {
    this.config = options.config;
    this.commandsPath = normalizePaths(options.commandsPath ?? './commands/**/*.ts');
    this.eventsPath = normalizePaths(options.eventsPath ?? './events/**/*.ts');
    this.interactionsPath = normalizePaths(
      options.interactionsPath ?? './interactions/**/*.ts',
    );

    this.container = new Container();
    this.logger = createLiveLogger({
      level: options.config.logger?.level ?? 'info',
      context: 'nexora',
      console: options.config.logger?.console,
      file: options.config.logger?.file,
    });

    this.client = new Client({
      intents: resolveIntents(options.config.bot.intents),
      partials: [Partials.Channel, Partials.Message],
      ...options.clientOptions,
    });

    this.commandRegistry = new CommandRegistry();
    this.eventRegistry = new EventRegistry();
    this.interactionRegistry = new InteractionRegistry();
    this.eventBus = new EventBus();
    this.cache = new Cache(new MemoryCacheAdapter(), options.config.cache?.defaultTtl);
    this.scheduler = new Scheduler();

    this.registerServices();
  }

  /** Current lifecycle phase */
  get lifecycle(): LifecyclePhase {
    return this.phase;
  }

  /**
   * Register onion-style command middleware (Express order: first = outermost).
   * Call before {@link start}. The same array reference is passed to handlers.
   */
  useCommand(mw: CommandMiddleware): this {
    this.commandMiddlewares.push(mw);
    return this;
  }

  private registerServices(): void {
    this.container.registerInstance(TOKENS.Logger, this.logger);
    this.container.registerInstance(TOKENS.Config, this.config);
    this.container.registerInstance(TOKENS.Client, this.client);
    this.container.registerInstance(TOKENS.CommandRegistry, this.commandRegistry);
    this.container.registerInstance(TOKENS.EventRegistry, this.eventRegistry);
    this.container.registerInstance(TOKENS.InteractionRegistry, this.interactionRegistry);
    this.container.registerInstance(TOKENS.EventBus, this.eventBus);
    this.container.registerInstance(TOKENS.Cache, this.cache);
    this.container.registerInstance(TOKENS.Scheduler, this.scheduler);
  }

  /** Start the bot — discover, register, login */
  async start(): Promise<void> {
    if (this.phase !== 'idle' && this.phase !== 'stopped') {
      throw new Error(`Cannot start bot in phase: ${this.phase}`);
    }

    this.phase = 'starting';
    this.logger.info('Starting Nexora...');

    if (!this.config.bot.token?.trim()) {
      throw new Error(
        'DISCORD_TOKEN fehlt oder ist leer. Lege eine .env im Projektroot an und starte mit --env-file=.env (oder nutze @nexora.ts/config loadEnv).',
      );
    }

    await discoverCommands(this.commandsPath, this.commandRegistry, this.logger);
    await discoverEvents(this.eventsPath, this.eventRegistry, this.logger);
    await discoverInteractions(this.interactionsPath, this.interactionRegistry, this.logger);

    attachCommandHandlers(this.client, this.commandRegistry, this.logger, {
      eventBus: this.eventBus,
      middlewares: this.commandMiddlewares,
    });
    attachEventHandlers(this.client, this.eventRegistry);
    attachInteractionHandlers(this.client, this.interactionRegistry, this.logger);

    this.client.once('ready', (readyClient) => {
      this.phase = 'ready';
      const dashboardEnabled = this.config.dashboard?.enabled === true;

      printStartupBanner({
        name: 'Nexora',
        version: getInstalledCoreVersion(),
        userTag: readyClient.user.tag,
        commands: this.commandRegistry.size,
        events: this.eventRegistry.size,
        // Only show Studio when createDevServer (or CLI) advertised a live URL.
        // Never reuse dashboard.url for Studio — different app on :3000.
        studioUrl: process.env.NEXORA_STUDIO_URL || undefined,
        // Dashboard UI is unreleased — soft teaser only, no localhost URL promise.
        dashboardUrl: dashboardEnabled
          ? 'experimental / unreleased — coming soon'
          : undefined,
      });

      void this.eventBus.emit(FrameworkEvents.BOT_READY, { client: readyClient });
      void this.maybeCheckForUpdates();
    });

    await this.client.login(this.config.bot.token);

    if (this.commandRegistry.size > 0) {
      await deployCommands(
        this.client,
        this.commandRegistry,
        this.config.bot.guildIds,
        this.logger,
      );
    }
  }

  /** Non-blocking npm update notice (opt-out via config / env). */
  private async maybeCheckForUpdates(): Promise<void> {
    const envDisabled =
      process.env.NEXORA_UPDATE_CHECK === '0' ||
      process.env.NEXORA_UPDATE_CHECK === 'false';
    const enabled = this.config.updateCheck !== false && !envDisabled;
    if (!enabled) return;

    await checkForCoreUpdate(this.logger);
  }

  /** Gracefully stop the bot */
  async stop(): Promise<void> {
    if (this.phase === 'stopped' || this.phase === 'idle') return;

    this.phase = 'stopping';
    this.logger.info('Shutting down...');

    await this.eventBus.emit(FrameworkEvents.BOT_SHUTDOWN, { client: this.client });

    this.scheduler.destroy();
    this.client.destroy();
    this.phase = 'stopped';
    this.logger.info('Nexora stopped.');
  }
}

function normalizePaths(paths: string | string[]): string[] {
  return Array.isArray(paths) ? paths : [paths];
}

function resolveIntents(intents?: string[]): number[] {
  if (!intents?.length) {
    return [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ];
  }

  const map: Record<string, number> = {
    Guilds: GatewayIntentBits.Guilds,
    GuildMessages: GatewayIntentBits.GuildMessages,
    GuildMembers: GatewayIntentBits.GuildMembers,
    MessageContent: GatewayIntentBits.MessageContent,
    DirectMessages: GatewayIntentBits.DirectMessages,
    GuildVoiceStates: GatewayIntentBits.GuildVoiceStates,
    GuildPresences: GatewayIntentBits.GuildPresences,
  };

  return intents.map((i) => map[i] ?? GatewayIntentBits.Guilds);
}
