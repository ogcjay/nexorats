import { PermissionFlagsBits, type PermissionResolvable } from 'discord.js';
import type { CommandContext } from './define.js';

/** `true` = allow, `false` = deny (generic message), `string` = deny with that message */
export type GuardResult = true | false | string;

/**
 * Composable command guard. Receives {@link CommandContext}.
 * Built-in helpers only read `user` / `guildId` / `interaction.memberPermissions`,
 * so they also work when invoked with a context-menu context via cast.
 */
export type Guard = (ctx: CommandContext) => GuardResult | Promise<GuardResult>;

const DEFAULT_GUILD_ONLY = 'This command can only be used in a server.';
const DEFAULT_ADMIN_ONLY = 'You need Administrator permission to use this command.';
const DEFAULT_OWNER_ONLY = 'Only the bot owner can use this command.';
const DEFAULT_PERMISSIONS = 'You lack the required permissions for this command.';
const DEFAULT_USER_IDS = 'You are not allowed to use this command.';

/** Reject DMs */
export function guildOnly(message: string = DEFAULT_GUILD_ONLY): Guard {
  return (ctx) => (ctx.guildId ? true : message);
}

/** Require Administrator permission */
export function adminOnly(message: string = DEFAULT_ADMIN_ONLY): Guard {
  return (ctx) => {
    const perms = ctx.interaction.memberPermissions;
    if (!perms?.has(PermissionFlagsBits.Administrator)) {
      return message;
    }
    return true;
  };
}

/** Allow only listed Discord user snowflakes (bot owners, etc.) */
export function ownerOnly(ownerIds: string[], message: string = DEFAULT_OWNER_ONLY): Guard {
  const set = new Set(ownerIds);
  return (ctx) => (set.has(ctx.user.id) ? true : message);
}

/** Require all listed Discord permissions */
export function hasPermissions(
  perms: PermissionResolvable[],
  message: string = DEFAULT_PERMISSIONS,
): Guard {
  return (ctx) => {
    const memberPerms = ctx.interaction.memberPermissions;
    if (!memberPerms?.has(perms)) {
      return message;
    }
    return true;
  };
}

/** Allow only users whose IDs are in the list */
export function userIds(ids: string[], message: string = DEFAULT_USER_IDS): Guard {
  const set = new Set(ids);
  return (ctx) => (set.has(ctx.user.id) ? true : message);
}

/** Pass only if every guard allows */
export function and(...guards: Guard[]): Guard {
  return async (ctx) => {
    for (const guard of guards) {
      const result = await guard(ctx);
      if (result !== true) return result;
    }
    return true;
  };
}

/** Pass if any guard allows; last deny message wins if all fail */
export function or(...guards: Guard[]): Guard {
  return async (ctx) => {
    let lastDeny: false | string = false;
    for (const guard of guards) {
      const result = await guard(ctx);
      if (result === true) return true;
      lastDeny = result;
    }
    return lastDeny;
  };
}

/** Named collection of composable guards */
export const Guards = {
  guildOnly,
  adminOnly,
  ownerOnly,
  hasPermissions,
  userIds,
  and,
  or,
} as const;

/**
 * Run guards in order. Returns the first deny result, or `true` if all pass.
 */
export async function runGuards(
  ctx: CommandContext,
  guards: readonly Guard[],
): Promise<GuardResult> {
  for (const guard of guards) {
    const result = await guard(ctx);
    if (result !== true) return result;
  }
  return true;
}
