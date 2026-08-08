/** Default Nexora customId namespace */
export const CUSTOM_ID_NAMESPACE = 'nexora' as const;

/** Default delimiter for {@link packCustomId} / {@link parseCustomId} */
export const CUSTOM_ID_DELIMITER = ':' as const;

/** Discord custom_id hard limit */
export const CUSTOM_ID_MAX_LENGTH = 100 as const;

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
 * @param id - Raw custom id string
 * @param options - Optional prefix / namespace options
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

/**
 * Resolve customId from a builder method call.
 *
 * @param id - Raw custom id string
 * @param options - Optional prefix / namespace options
 * @example
 * resolveCustomId('confirm', { prefix: true }) // 'nexora:confirm'
 */
export function resolveCustomId(id: string, options?: CustomIdOptions): string {
  return customId(id, options);
}

/**
 * Join parts into a Discord custom id (max {@link CUSTOM_ID_MAX_LENGTH} chars).
 * Uses {@link CUSTOM_ID_DELIMITER} (`:`) between segments.
 *
 * @param parts - Segments to join (stringified)
 * @returns Packed custom id
 * @throws If the result exceeds {@link CUSTOM_ID_MAX_LENGTH}
 * @example
 * packCustomId('ban', userId, 'confirm') // 'ban:123:confirm'
 */
export function packCustomId(
  ...parts: Array<string | number | boolean>
): string {
  const id = parts.map(String).join(CUSTOM_ID_DELIMITER);

  if (id.length > CUSTOM_ID_MAX_LENGTH) {
    throw new Error(
      `customId exceeds Discord limit of ${CUSTOM_ID_MAX_LENGTH} characters (got ${id.length})`,
    );
  }

  return id;
}

/**
 * Split a custom id into segments.
 *
 * @param id - Raw custom id
 * @param delimiter - Segment delimiter — default {@link CUSTOM_ID_DELIMITER}
 * @returns Segments (empty string → `[]`)
 * @example
 * parseCustomId('ban:123:confirm') // ['ban', '123', 'confirm']
 */
export function parseCustomId(
  id: string,
  delimiter: string = CUSTOM_ID_DELIMITER,
): string[] {
  if (!id) return [];
  return id.split(delimiter);
}
