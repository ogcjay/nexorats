import type { SlashCommand } from './command-class.js';

/**
 * Groups slash subcommands under one top-level command name.
 *
 * @example
 * export default class TicketGroup extends SlashCommandGroup {
 *   name = 'ticket';
 *   description = 'Ticket system';
 *   commands = [new CreateSub(), new CloseSub()];
 * }
 */
export abstract class SlashCommandGroup {
  abstract name: string;
  abstract description: string;
  /** Subcommands — each {@link SlashCommand.name} becomes the Discord subcommand name */
  abstract commands: SlashCommand[];
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
