export {
  command,
  messageCommand,
  createCommandContext,
  createMessageCommandContext,
  resolveReplyOptions,
  type CommandDefinition,
  type CommandContext,
  type CommandOption,
  type CommandModuleType,
  type MessageCommandDefinition,
  type MessageCommandContext,
  type CommandReplyOptions,
  type BuilderReplyOptions,
} from './define.js';

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
} from './guards.js';

export {
  composeCommandMiddleware,
  type CommandMiddleware,
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
  isCommandGroupClass,
  resolveCommandGroupExport,
  type SlashCommandConstructor,
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
