import type { PermissionResolvable } from 'discord.js';
import type { SlashCommand } from './command-class.js';

/** Constructable {@link SlashCommand} subclass (zero-arg constructor) */
export type SlashCommandConstructor = new (...args: never[]) => SlashCommand;

/**
 * Instantiates slash command classes for use in groups.
 *
 * @param ctors - Zero-arg {@link SlashCommand} constructors
 * @returns Instantiated command instances
 * @example
 * commands = subcommands(CreateCmd, CloseCmd);
 */
export function subcommands(...ctors: SlashCommandConstructor[]): SlashCommand[] {
  return ctors.map((Ctor) => new Ctor());
}

/**
 * Nested Discord subcommand group (application command option type 2).
 * Appears as `/parent group sub` in Discord.
 *
 * @example
 * // Via constructor
 * new SlashCommandSubGroup({
 *   name: 'admin',
 *   description: 'Admin tools',
 *   commands: subcommands(BanCmd, KickCmd),
 * });
 *
 * @example
 * // Via subclass
 * class AdminGroup extends SlashCommandSubGroup {
 *   name = 'admin';
 *   description = 'Admin tools';
 *   commands = subcommands(BanCmd, KickCmd);
 * }
 */
export class SlashCommandSubGroup {
  name!: string;
  description!: string;
  commands!: SlashCommand[];

  /**
   * Creates a nested subcommand group.
   *
   * @param options - Group name, description, and subcommands (optional when subclassing)
   * @example
   * new SlashCommandSubGroup({
   *   name: 'admin',
   *   description: 'Admin tools',
   *   commands: subcommands(BanCmd, KickCmd),
   * });
   */
  constructor(options?: {
    name: string;
    description: string;
    commands: SlashCommand[];
  }) {
    if (options) {
      this.name = options.name;
      this.description = options.description;
      this.commands = options.commands;
    }
  }
}

/**
 * Groups slash subcommands under one top-level command name.
 * Supports flat subcommands (type 1), nested groups (type 2), or both.
 *
 * Group-level `guildOnly` / `adminOnly` / `permissions` / `cooldown` are
 * merged onto each subcommand unless the sub sets its own value (sub wins).
 *
 * @example
 * // Flat subcommands only (backward compatible)
 * export default class TicketGroup extends SlashCommandGroup {
 *   name = 'ticket';
 *   description = 'Ticket system';
 *   commands = [new CreateSub(), new CloseSub()];
 * }
 *
 * @example
 * // Nested groups: /moderation admin ban
 * export default class ModerationGroup extends SlashCommandGroup {
 *   name = 'moderation';
 *   description = 'Moderation tools';
 *   guildOnly = true;
 *   groups = [
 *     new SlashCommandSubGroup({
 *       name: 'admin',
 *       description: 'Admin actions',
 *       commands: subcommands(BanCmd, KickCmd),
 *     }),
 *   ];
 *   commands = subcommands(WarnCmd); // /moderation warn (flat sibling)
 * }
 */
export abstract class SlashCommandGroup {
  abstract name: string;
  abstract description: string;

  /** Flat subcommands under the parent (`/parent sub`) */
  commands?: SlashCommand[];

  /** Nested subcommand groups (`/parent group sub`) */
  groups?: SlashCommandSubGroup[];

  /** When true, all subs are guild-only unless a sub overrides */
  guildOnly?: boolean;
  /** When true, all subs require Administrator unless a sub overrides */
  adminOnly?: boolean;
  /** Default permission list merged onto each sub unless overridden */
  permissions?: PermissionResolvable[];
  /** Default per-user cooldown (ms) merged onto each sub unless overridden */
  cooldown?: number;
  /** Top-level default member permissions for Discord registration */
  defaultMemberPermissions?: PermissionResolvable | bigint | null;
  /** Whether the group command is usable in DMs (global deploy) */
  dmPermission?: boolean;
}

/** Optional flags for {@link group} */
export interface GroupOptions {
  guildOnly?: boolean;
  adminOnly?: boolean;
  permissions?: PermissionResolvable[];
  cooldown?: number;
  groups?: SlashCommandSubGroup[];
  defaultMemberPermissions?: PermissionResolvable | bigint | null;
  dmPermission?: boolean;
}

type GroupCommandInput = SlashCommand | SlashCommandConstructor;

function resolveGroupCommands(commands: GroupCommandInput[]): SlashCommand[] {
  return commands.map((entry) => (typeof entry === 'function' ? new entry() : entry));
}

/** Concrete group used by {@link group} */
class FunctionalSlashCommandGroup extends SlashCommandGroup {
  name: string;
  description: string;

  constructor(
    name: string,
    description: string,
    commands: SlashCommand[],
    options?: GroupOptions,
  ) {
    super();
    this.name = name;
    this.description = description;
    this.commands = commands;
    if (options?.guildOnly !== undefined) this.guildOnly = options.guildOnly;
    if (options?.adminOnly !== undefined) this.adminOnly = options.adminOnly;
    if (options?.permissions !== undefined) this.permissions = options.permissions;
    if (options?.cooldown !== undefined) this.cooldown = options.cooldown;
    if (options?.groups !== undefined) this.groups = options.groups;
    if (options?.defaultMemberPermissions !== undefined) {
      this.defaultMemberPermissions = options.defaultMemberPermissions;
    }
    if (options?.dmPermission !== undefined) this.dmPermission = options.dmPermission;
  }
}

/**
 * Functional slash-command group — same discovery as `extends SlashCommandGroup`.
 *
 * @param name - Top-level command name
 * @param description - Command description shown in Discord
 * @param commands - Subcommand classes or instances
 * @param options - Optional group-level flags and nested groups
 * @returns A discoverable {@link SlashCommandGroup}
 * @example
 * export default group('ticket', 'Ticket system', [CreateCmd, CloseCmd]);
 *
 * @example
 * export default group('ticket', 'Ticket system', subcommands(CreateCmd, CloseCmd), {
 *   guildOnly: true,
 * });
 */
export function group(
  name: string,
  description: string,
  commands: GroupCommandInput[],
  options?: GroupOptions,
): SlashCommandGroup {
  return new FunctionalSlashCommandGroup(
    name,
    description,
    resolveGroupCommands(commands),
    options,
  );
}

/** True when `value` is a constructable SlashCommandGroup subclass */
export function isCommandGroupClass(
  value: unknown,
): value is new (...args: never[]) => SlashCommandGroup {
  return typeof value === 'function' && value.prototype instanceof SlashCommandGroup;
}

function isGroupLike(value: unknown): value is SlashCommandGroup {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    (Array.isArray(obj.commands) || Array.isArray(obj.groups))
  );
}

/**
 * Normalize a module default export into a {@link SlashCommandGroup}.
 * Supports: class extending SlashCommandGroup, `group(...)`, or a pre-built instance.
 */
export function resolveCommandGroupExport(exported: unknown): SlashCommandGroup | null {
  if (exported == null) return null;

  if (isCommandGroupClass(exported)) {
    return new exported();
  }

  if (exported instanceof SlashCommandGroup) {
    return exported;
  }

  // Duck-typed group from plain objects
  if (isGroupLike(exported)) {
    return exported;
  }

  return null;
}
