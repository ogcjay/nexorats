import type { PermissionResolvable } from 'discord.js';
import type { SlashCommand } from './command-class.js';

/** Constructable {@link SlashCommand} subclass (zero-arg constructor) */
export type SlashCommandConstructor = new (...args: never[]) => SlashCommand;

/**
 * Instantiates slash command classes for use in groups.
 *
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
}

/** True when `value` is a constructable SlashCommandGroup subclass */
export function isCommandGroupClass(
  value: unknown,
): value is new (...args: never[]) => SlashCommandGroup {
  return typeof value === 'function' && value.prototype instanceof SlashCommandGroup;
}

/**
 * Normalize a module default export into a {@link SlashCommandGroup}.
 * Supports: class extending SlashCommandGroup, or a pre-built instance.
 */
export function resolveCommandGroupExport(exported: unknown): SlashCommandGroup | null {
  if (exported == null) return null;

  if (isCommandGroupClass(exported)) {
    return new exported();
  }

  if (exported instanceof SlashCommandGroup) {
    return exported;
  }

  return null;
}
