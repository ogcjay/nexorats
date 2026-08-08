import { Client, GatewayIntentBits, Partials, type ClientOptions } from 'discord.js';
import {
  validateConfig,
  type NexoraConfig,
} from '@nexora.ts/config';
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
import type {
  ErrorBoundaryConfig,
  NexoraErrorHandler,
} from './errors/handler.js';

/**
 * Bootstrap options for {@link Nexora}.
 *
 * @example
 * const options: NexoraOptions = {
 *   config,
 *   commandsPath: './commands',
 *   eventsPath: './events',
 *   interactionsPath: './interactions',
 *   onError: ({ error, source, command }) => {
 *     console.error(source, command, error);
 *   },
 *   errorMessage: 'Etwas ist schiefgelaufen.',
 * };
 */
export interface NexoraOptions {
  /** Loaded bot config (`@nexora.ts/config`) */
  config: NexoraConfig;
  /** Glob(s) for slash/message/context commands — default `./commands` recursive `*.ts` */
  commandsPath?: string | string[];
  /** Glob(s) for Discord event handlers — default `./events` recursive `*.ts` */
  eventsPath?: string | string[];
  /** Glob(s) for button/select/modal handlers — default `./interactions` recursive `*.ts` */
  interactionsPath?: string | string[];
  /** Extra discord.js {@link ClientOptions} merged into the client */
  clientOptions?: Partial<ClientOptions>;
  /**
   * Global error hook for command / autocomplete / interaction / event failures.
   * @see Nexora.onError
   */
  onError?: NexoraErrorHandler;
  /**
   * User-facing ephemeral message when a command or interaction fails.
   * @default 'An error occurred while executing this command.'
   */
  errorMessage?: string;
  /** Override for button / select / modal failure replies */
  interactionErrorMessage?: string;
  /** Override for `ctx.deferThen` failure replies */
  deferErrorMessage?: string;
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
  private errorBoundary: ErrorBoundaryConfig;
  private phase: LifecyclePhase = 'idle';

  /**
   * Creates a Nexora bot instance.
   *
   * @param options - Bot config and optional discovery paths
   * @example
   * const bot = new Nexora({
   *   config,
   *   commandsPath: './commands',
   *   eventsPath: './events',
   * });
   * await bot.start();
   */
  constructor(options: NexoraOptions) {
    this.config = validateConfig(options.config);
    this.commandsPath = normalizePaths(options.commandsPath ?? './commands/**/*.ts');
    this.eventsPath = normalizePaths(options.eventsPath ?? './events/**/*.ts');
    this.interactionsPath = normalizePaths(
      options.interactionsPath ?? './interactions/**/*.ts',
    );
    this.errorBoundary = {
      onError: options.onError,
      errorMessage: options.errorMessage,
      interactionErrorMessage: options.interactionErrorMessage,
      deferErrorMessage: options.deferErrorMessage,
    };

    this.container = new Container();
    this.logger = createLiveLogger({
      level: this.config.logger?.level ?? 'info',
      context: 'nexora',
      console: this.config.logger?.console,
      file: this.config.logger?.file,
    });

    this.client = new Client({
      intents: resolveIntents(this.config.bot.intents),
      partials: [Partials.Channel, Partials.Message],
      ...options.clientOptions,
    });

    this.commandRegistry = new CommandRegistry();
    this.eventRegistry = new EventRegistry();
    this.interactionRegistry = new InteractionRegistry();
    this.eventBus = new EventBus();
    this.cache = new Cache(new MemoryCacheAdapter(), this.config.cache?.defaultTtl);
    this.scheduler = new Scheduler();

    this.registerServices();
  }

  /** Current lifecycle phase */
  get lifecycle(): LifecyclePhase {
    return this.phase;
  }

  /**
   * Register a global error handler (commands, autocomplete, interactions, events).
   * Call before {@link start}. Overwrites any handler from {@link NexoraOptions.onError}.
   *
   * @param handler - Async-capable error hook
   * @returns This bot instance for chaining
   * @example
   * bot.onError(async ({ error, source, command }) => {
   *   bot.logger.error('Unhandled', { source, command, error: String(error) });
   * });
   */
  onError(handler: NexoraErrorHandler): this {
    this.errorBoundary = { ...this.errorBoundary, onError: handler };
    return this;
  }

  /**
   * Set the user-facing ephemeral error message for failed commands / interactions.
   *
   * @param message - Message shown to Discord users
   * @returns This bot instance for chaining
   */
  setErrorMessage(message: string): this {
    this.errorBoundary = { ...this.errorBoundary, errorMessage: message };
    return this;
  }

  /**
   * Register onion-style command middleware (Express order: first = outermost).
   * Call before {@link start}. The same array reference is passed to handlers.
   *
   * @param mw - Middleware function
   * @returns This bot instance for chaining
   * @example
   * bot.useCommand(async (ctx, next) => {
   *   console.log(ctx.interaction.commandName);
   *   await next();
   * });
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

  /**
   * Start the bot — discover modules, attach handlers, login, and deploy commands.
   *
   * @example
   * await bot.start();
   */
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
      container: this.container,
      logger: this.logger,
      cache: this.cache,
      errorBoundary: this.errorBoundary,
    });
    attachEventHandlers(this.client, this.eventRegistry, this.logger, {
      errorBoundary: this.errorBoundary,
    });
    attachInteractionHandlers(this.client, this.interactionRegistry, this.logger, {
      errorBoundary: this.errorBoundary,
    });

    this.client.once('ready', (readyClient) => {
      this.phase = 'ready';
      const studioUrl = process.env.NEXORA_STUDIO_URL || undefined;

      printStartupBanner({
        name: 'Nexora',
        version: getInstalledCoreVersion(),
        userTag: readyClient.user.tag,
        commands: this.commandRegistry.size,
        events: this.eventRegistry.size,
        // Only show Studio when createDevServer (or CLI) advertised a live URL.
        studioUrl,
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

  /**
   * Gracefully stop the bot (scheduler, client, lifecycle phase).
   *
   * @example
   * await bot.stop();
   */
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
