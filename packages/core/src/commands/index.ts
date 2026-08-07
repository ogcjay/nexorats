export {
  command,
  slash,
  messageCommand,
  createCommandContext,
  createMessageCommandContext,
  resolveReplyOptions,
  withDefaultEphemeral,
  type CommandDefinition,
  type CommandContext,
  type CommandContextServices,
  type CommandOption,
  type CommandModuleType,
  type MessageCommandDefinition,
  type MessageCommandContext,
  type CommandReplyOptions,
  type BuilderReplyOptions,
  type CreateCommandContextOptions,
  type StatusReplyOptions,
} from './define.js';

export { buildStatusReply } from './reply-presets.js';

export {
  Guards,
  guildOnly,
  adminOnly,
  ownerOnly,
  hasPermissions,
  userIds,
  and,
  or,
  runGuards,
  type Guard,
  type GuardResult,
  type RunGuardsOptions,
} from './guards.js';

export {
  composeCommandMiddleware,
  type CommandMiddleware,
  type ComposeCommandMiddlewareOptions,
} from './middleware.js';

export {
  SlashCommand,
  BaseCommand,
  isCommandClass,
  resolveCommandExport,
} from './command-class.js';

export {
  SlashCommandGroup,
  SlashCommandSubGroup,
  subcommands,
  group,
  isCommandGroupClass,
  resolveCommandGroupExport,
  type SlashCommandConstructor,
  type GroupOptions,
} from './command-group.js';

export {
  ContextMenuCommand,
  createContextMenuContext,
  isContextMenuClass,
  resolveContextMenuExport,
  type ContextMenuType,
  type ContextMenuContext,
  type ContextMenuCommandDefinition,
} from './context-menu.js';

export {
  CommandRegistry,
  discoverCommands,
  deployCommands,
  attachCommandHandlers,
  type RegisteredCommand,
  type RegisteredCommandGroup,
  type RegisteredSubGroup,
  type RegisteredContextMenu,
  type AttachCommandHandlersOptions,
} from './registry.js';

export {
  stringOpt,
  integerOpt,
  numberOpt,
  booleanOpt,
  userOpt,
  channelOpt,
  roleOpt,
  mentionableOpt,
  attachmentOpt,
  type OptionChoice,
  type BaseOptionConfig,
  type StringOptionConfig,
  type IntegerOptionConfig,
  type NumberOptionConfig,
  type BooleanOptionConfig,
  type UserOptionConfig,
  type ChannelOptionConfig,
  type RoleOptionConfig,
  type MentionableOptionConfig,
  type AttachmentOptionConfig,
} from './options.js';

export {
  autocomplete,
  AutocompleteHandler,
  createAutocompleteContext,
  choicesFrom,
  AUTOCOMPLETE_MAX_CHOICES,
  type AutocompleteChoice,
  type AutocompleteContext,
} from './autocomplete.js';
