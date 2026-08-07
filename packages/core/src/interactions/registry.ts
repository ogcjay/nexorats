import { CUSTOM_ID_NAMESPACE } from '../builders/custom-id.js';
import type { ButtonHandler } from './button-handler.js';
import type { SelectHandler } from './select-handler.js';
import type { ModalHandler } from './modal-handler.js';

/** Handler kind discriminator */
export type InteractionHandlerKind = 'button' | 'select' | 'modal';

/** Any registered interaction handler instance */
export type AnyInteractionHandler = ButtonHandler | SelectHandler | ModalHandler;

/** Registered handler with optional discovery source path */
export interface RegisteredInteraction {
  handler: AnyInteractionHandler;
  kind: InteractionHandlerKind;
  customId: string | RegExp;
  source?: string;
}

export interface InteractionRegistryGetOptions {
  /** Restrict match to a specific handler kind */
  kind?: InteractionHandlerKind;
  /**
   * When true (default), also match after stripping `nexora:` from the
   * incoming customId so builder `{ prefix: true }` ids work with plain handlers.
   */
  stripNamespace?: boolean;
}

/**
 * Registry for button / select / modal handlers.
 * Lookup supports exact string, prefix string, and RegExp customIds.
 */
export class InteractionRegistry {
  private readonly entries: RegisteredInteraction[] = [];

  register(handler: AnyInteractionHandler, source?: string): void {
    this.entries.push({
      handler,
      kind: handler.kind,
      customId: handler.customId,
      source,
    });
  }

  /**
   * Resolve a handler for an incoming customId.
   * Match order: exact → RegExp → longest prefix.
   */
  get(
    customId: string,
    options?: InteractionRegistryGetOptions,
  ): RegisteredInteraction | undefined {
    const strip = options?.stripNamespace !== false;
    const kind = options?.kind;
    const candidates = kind
      ? this.entries.filter((e) => e.kind === kind)
      : this.entries;

    const ids = expandCustomIdVariants(customId, strip);

    // 1. Exact string
    for (const id of ids) {
      for (let i = 0; i < candidates.length; i++) {
        const entry = candidates[i]!;
        if (typeof entry.customId === 'string' && entry.customId === id) {
          return entry;
        }
      }
    }

    // 2. RegExp
    for (const id of ids) {
      for (let i = 0; i < candidates.length; i++) {
        const entry = candidates[i]!;
        if (entry.customId instanceof RegExp && entry.customId.test(id)) {
          return entry;
        }
      }
    }

    // 3. Longest prefix (string customIds only)
    let best: RegisteredInteraction | undefined;
    let bestLen = -1;

    for (const id of ids) {
      for (let i = 0; i < candidates.length; i++) {
        const entry = candidates[i]!;
        if (typeof entry.customId !== 'string') continue;
        if (!isPrefixMatch(entry.customId, id)) continue;
        if (entry.customId.length > bestLen) {
          best = entry;
          bestLen = entry.customId.length;
        }
      }
    }

    return best;
  }

  getAll(): RegisteredInteraction[] {
    return [...this.entries];
  }

  getByKind(kind: InteractionHandlerKind): RegisteredInteraction[] {
    return this.entries.filter((e) => e.kind === kind);
  }

  get size(): number {
    return this.entries.length;
  }
}

/** Build id variants used during matching (`raw`, optional stripped `nexora:`) */
export function expandCustomIdVariants(customId: string, stripNamespace = true): string[] {
  const ids = [customId];
  if (!stripNamespace) return ids;

  const prefix = `${CUSTOM_ID_NAMESPACE}:`;
  if (customId.startsWith(prefix)) {
    ids[ids.length] = customId.slice(prefix.length);
  }
  return ids;
}

/**
 * Prefix match: registered id is a proper prefix of incoming.
 * Prefer `foo:` style ids; also allows `foo` → `foo:bar`.
 */
export function isPrefixMatch(registered: string, incoming: string): boolean {
  if (registered.length === 0 || registered === incoming) return false;
  if (registered.endsWith(':')) {
    return incoming.startsWith(registered);
  }
  return incoming.startsWith(`${registered}:`);
}
