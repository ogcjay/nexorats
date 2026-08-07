/** Default Nexora customId namespace */
export const CUSTOM_ID_NAMESPACE = 'nexora' as const;

export interface CustomIdOptions {
  /**
   * Prefix the id with a namespace.
   * - `true` → `nexora:<id>`
   * - `string` → `<string>:<id>` (colon added if missing)
   * - `false` / omitted → raw id
   */
  prefix?: boolean | string;
}

/**
 * Build a typed customId, optionally namespaced as `nexora:<id>`.
 *
 * @example
 * customId('confirm')                    // 'confirm'
 * customId('confirm', { prefix: true })  // 'nexora:confirm'
 * customId('ban', { prefix: 'mod' })     // 'mod:ban'
 */
export function customId(id: string, options?: CustomIdOptions): string {
  if (!options?.prefix) return id;

  const ns =
    options.prefix === true
      ? CUSTOM_ID_NAMESPACE
      : options.prefix.endsWith(':')
        ? options.prefix.slice(0, -1)
        : options.prefix;

  if (id.startsWith(`${ns}:`)) return id;
  return `${ns}:${id}`;
}

/** Resolve customId from a builder method call */
export function resolveCustomId(id: string, options?: CustomIdOptions): string {
  return customId(id, options);
}
