import type {
  AutocompleteInteraction,
  PermissionResolvable,
} from 'discord.js';
import type {
  CommandContext,
  CommandDefinition,
  CommandModuleType,
  CommandOption,
} from './define.js';

/**
 * Abstract slash command class — additive alternative to `command({})`.
 *
 * @example
 * export default class PingCommand extends SlashCommand {
 *   name = 'ping';
 *   description = 'Check latency';
 *   async execute(ctx) {
 *     await ctx.reply('Pong!');
 *   }
 * }
 */
export abstract class SlashCommand implements CommandDefinition {
  abstract name: string;
  abstract description: string;

  options?: CommandOption[];
  guildOnly?: boolean;
  adminOnly?: boolean;
  permissions?: PermissionResolvable[];
  /** Per-user cooldown in milliseconds */
  cooldown?: number;
  readonly type: CommandModuleType = 'slash';

  abstract execute(ctx: CommandContext): Promise<void> | void;

  autocomplete?(interaction: AutocompleteInteraction): Promise<void> | void;
}

/** Alias for {@link SlashCommand} */
export abstract class BaseCommand extends SlashCommand {}

/** True when `value` is a constructable command class (not a plain definition object) */
export function isCommandClass(
  value: unknown,
): value is new (...args: never[]) => CommandDefinition {
  if (typeof value !== 'function') return false;
  // Prefer SlashCommand subclasses; fall back to duck-typed execute for custom classes
  if (value.prototype instanceof SlashCommand) return true;
  const proto = value.prototype as { execute?: unknown; description?: unknown } | undefined;
  return (
    proto != null &&
    typeof proto.execute === 'function' &&
    // Exclude ContextMenuCommand (has execute, no slash description on prototype)
    !('kind' in proto && (proto as { kind?: unknown }).kind === 'context-menu')
  );
}

/**
 * Normalize a module default export into a CommandDefinition.
 * Supports: `command({})`, class extending SlashCommand, or a pre-built instance.
 */
export function resolveCommandExport(exported: unknown): CommandDefinition | null {
  if (exported == null) return null;

  if (isCommandClass(exported)) {
    const instance = new exported();
    return isSlashDefinition(instance) ? instance : null;
  }

  if (isSlashDefinition(exported)) {
    return exported;
  }

  return null;
}

function isSlashDefinition(value: unknown): value is CommandDefinition {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.type === 'message') return false;
  return (
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.execute === 'function'
  );
}
