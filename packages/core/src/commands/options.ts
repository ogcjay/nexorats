import type { CommandOption } from './define.js';

/** Choice entry for string / integer / number options */
export interface OptionChoice<T extends string | number = string | number> {
  name: string;
  value: T;
}

/** Shared option flags */
export interface BaseOptionConfig {
  required?: boolean;
}

/** Config for {@link stringOpt} */
export interface StringOptionConfig extends BaseOptionConfig {
  choices?: OptionChoice<string>[];
  autocomplete?: boolean;
  minLength?: number;
  maxLength?: number;
}

/** Config for {@link integerOpt} */
export interface IntegerOptionConfig extends BaseOptionConfig {
  choices?: OptionChoice<number>[];
  autocomplete?: boolean;
  minValue?: number;
  maxValue?: number;
}

/** Config for {@link numberOpt} */
export interface NumberOptionConfig extends BaseOptionConfig {
  choices?: OptionChoice<number>[];
  autocomplete?: boolean;
  minValue?: number;
  maxValue?: number;
}

/** Config for {@link booleanOpt} */
export interface BooleanOptionConfig extends BaseOptionConfig {}

/** Config for {@link userOpt} */
export interface UserOptionConfig extends BaseOptionConfig {}

/** Config for {@link channelOpt} */
export interface ChannelOptionConfig extends BaseOptionConfig {
  /** Discord channel type ints (see builders `ChannelType`) */
  channelTypes?: number[];
}

/** Config for {@link roleOpt} */
export interface RoleOptionConfig extends BaseOptionConfig {}

/** Config for {@link mentionableOpt} */
export interface MentionableOptionConfig extends BaseOptionConfig {}

/** Config for {@link attachmentOpt} */
export interface AttachmentOptionConfig extends BaseOptionConfig {}

/**
 * Build a string slash-command option.
 *
 * @param name - Option name (lowercase, Discord rules)
 * @param description - Option description shown in Discord
 * @param config - Optional required, choices, autocomplete, length limits
 * @example
 * options = [
 *   stringOpt('reason', 'Reason', { required: true, maxLength: 200 }),
 * ];
 */
export function stringOpt(
  name: string,
  description: string,
  config?: StringOptionConfig,
): CommandOption & { type: 'string' } {
  return {
    name,
    description,
    type: 'string',
    required: config?.required,
    choices: config?.choices,
    autocomplete: config?.autocomplete,
    minLength: config?.minLength,
    maxLength: config?.maxLength,
  };
}

/**
 * Build an integer slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional required, choices, autocomplete, min/max value
 * @example
 * integerOpt('days', 'Delete message days', { minValue: 0, maxValue: 7 })
 */
export function integerOpt(
  name: string,
  description: string,
  config?: IntegerOptionConfig,
): CommandOption & { type: 'integer' } {
  return {
    name,
    description,
    type: 'integer',
    required: config?.required,
    choices: config?.choices,
    autocomplete: config?.autocomplete,
    minValue: config?.minValue,
    maxValue: config?.maxValue,
  };
}

/**
 * Build a number (double) slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional required, choices, autocomplete, min/max value
 * @example
 * numberOpt('amount', 'Amount', { minValue: 0.01, maxValue: 1000 })
 */
export function numberOpt(
  name: string,
  description: string,
  config?: NumberOptionConfig,
): CommandOption & { type: 'number' } {
  return {
    name,
    description,
    type: 'number',
    required: config?.required,
    choices: config?.choices,
    autocomplete: config?.autocomplete,
    minValue: config?.minValue,
    maxValue: config?.maxValue,
  };
}

/**
 * Build a boolean slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional `required` flag
 * @example
 * booleanOpt('silent', 'Suppress notifications')
 */
export function booleanOpt(
  name: string,
  description: string,
  config?: BooleanOptionConfig,
): CommandOption & { type: 'boolean' } {
  return {
    name,
    description,
    type: 'boolean',
    required: config?.required,
  };
}

/**
 * Build a user slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional `required` flag
 * @example
 * userOpt('target', 'User to ban', { required: true })
 */
export function userOpt(
  name: string,
  description: string,
  config?: UserOptionConfig,
): CommandOption & { type: 'user' } {
  return {
    name,
    description,
    type: 'user',
    required: config?.required,
  };
}

/**
 * Build a channel slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional required flag and channel type filter
 * @example
 * channelOpt('channel', 'Target channel', { channelTypes: [0, 5] })
 */
export function channelOpt(
  name: string,
  description: string,
  config?: ChannelOptionConfig,
): CommandOption & { type: 'channel' } {
  return {
    name,
    description,
    type: 'channel',
    required: config?.required,
    channelTypes: config?.channelTypes,
  };
}

/**
 * Build a role slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional `required` flag
 * @example
 * roleOpt('role', 'Role to assign', { required: true })
 */
export function roleOpt(
  name: string,
  description: string,
  config?: RoleOptionConfig,
): CommandOption & { type: 'role' } {
  return {
    name,
    description,
    type: 'role',
    required: config?.required,
  };
}

/**
 * Build a mentionable (user or role) slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional `required` flag
 * @example
 * mentionableOpt('who', 'User or role')
 */
export function mentionableOpt(
  name: string,
  description: string,
  config?: MentionableOptionConfig,
): CommandOption & { type: 'mentionable' } {
  return {
    name,
    description,
    type: 'mentionable',
    required: config?.required,
  };
}

/**
 * Build an attachment slash-command option.
 *
 * @param name - Option name
 * @param description - Option description shown in Discord
 * @param config - Optional `required` flag
 * @example
 * attachmentOpt('file', 'File to upload', { required: true })
 */
export function attachmentOpt(
  name: string,
  description: string,
  config?: AttachmentOptionConfig,
): CommandOption & { type: 'attachment' } {
  return {
    name,
    description,
    type: 'attachment',
    required: config?.required,
  };
}
