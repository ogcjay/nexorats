export { Nexora } from './nexora.js';
export type { NexoraOptions, LifecyclePhase } from './nexora.js';

export { Container, TOKENS } from './container/index.js';
export type { ServiceToken, ServiceFactory } from './container/index.js';

export {
  command,
  messageCommand,
  createCommandContext,
  createMessageCommandContext,
  SlashCommand,
  BaseCommand,
  isCommandClass,
  resolveCommandExport,
  CommandRegistry,
  discoverCommands,
  deployCommands,
  attachCommandHandlers,
} from './commands/index.js';
export type {
  CommandDefinition,
  CommandContext,
  CommandOption,
  CommandModuleType,
  MessageCommandDefinition,
  MessageCommandContext,
  RegisteredCommand,
  AttachCommandHandlersOptions,
} from './commands/index.js';

export { event, EventRegistry, discoverEvents, attachEventHandlers } from './events/index.js';
export type { EventDefinition, EventHandler, RegisteredEvent } from './events/index.js';

export { EventBus, FrameworkEvents } from './event-bus/index.js';
export type { HookPhase, Middleware } from './event-bus/index.js';

export { Cache, MemoryCacheAdapter } from './cache/index.js';
export type { CacheAdapter } from './cache/index.js';

export { Scheduler } from './scheduler/index.js';
export type { ScheduledJob } from './scheduler/index.js';

export { Service, createService, registerService } from './services/index.js';
export type { ServiceContext } from './services/index.js';
