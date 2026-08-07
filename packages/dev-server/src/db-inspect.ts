/**
 * Safe read-only DB introspection for Studio.
 * Never executes client-supplied SQL. Table names are allowlisted.
 */

/** Built-in Nexora schema table names (mirrors @nexora.ts/database schema). */
export const KNOWN_DB_TABLES = [
  'users',
  'sessions',
  'guild_settings',
  'guild_members',
  'plugin_states',
  'audit_logs',
  'statistics',
] as const;

export type KnownDbTable = (typeof KNOWN_DB_TABLES)[number];

export interface StudioDbTablesResponse {
  available: boolean;
  provider?: string;
  tables?: Array<{ name: string; source: 'schema' | 'probe' }>;
  note?: string;
}

export interface StudioDbQueryResponse {
  available: boolean;
  table?: string;
  limit?: number;
  rows?: Record<string, unknown>[];
  note?: string;
  error?: string;
}

const TABLE_RE = /^[a-z][a-z0-9_]*$/;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

export function isKnownTable(name: string): name is KnownDbTable {
  return (KNOWN_DB_TABLES as readonly string[]).includes(name);
}

export function sanitizeTableName(raw: string | null): KnownDbTable | null {
  if (!raw) return null;
  const name = raw.trim().toLowerCase();
  if (!TABLE_RE.test(name)) return null;
  if (!isKnownTable(name)) return null;
  return name;
}

export function clampQueryLimit(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_LIMIT;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, n);
}

/**
 * List tables. Without a live DB adapter this returns schema names + available:false
 * for query, or available:true with schema-only listing when probe says connected.
 */
export function listStudioTables(opts: {
  connected: boolean;
  provider?: string;
  message?: string;
}): StudioDbTablesResponse {
  const tables = KNOWN_DB_TABLES.map((name) => ({
    name,
    source: 'schema' as const,
  }));

  if (!opts.connected) {
    return {
      available: false,
      provider: opts.provider,
      tables,
      note:
        opts.message ??
        'No live DB adapter wired to Studio. Showing known @nexora.ts/database schema table names only. Row queries unavailable.',
    };
  }

  return {
    available: true,
    provider: opts.provider,
    tables,
    note:
      'Live query adapter not registered on DevServer. Tables listed from known schema; use createDevServer({ databaseQuery }) for row previews.',
  };
}

export type StudioDbQueryFn = (
  table: KnownDbTable,
  limit: number,
) => Promise<Record<string, unknown>[]>;

export async function runSafeTableQuery(
  tableRaw: string | null,
  limitRaw: string | null,
  queryFn: StudioDbQueryFn | undefined,
  connected: boolean,
): Promise<StudioDbQueryResponse> {
  const table = sanitizeTableName(tableRaw);
  if (!table) {
    return {
      available: false,
      error: 'Invalid or non-allowlisted table. Use GET /api/studio/db/tables for allowed names.',
    };
  }

  const limit = clampQueryLimit(limitRaw);

  if (!queryFn) {
    return {
      available: false,
      table,
      limit,
      note:
        'No read-only DB query adapter configured. Pass `databaseQuery` to createDevServer to enable SELECT previews. Arbitrary SQL is never accepted.',
    };
  }

  if (!connected) {
    return {
      available: false,
      table,
      limit,
      note: 'Database probe reports disconnected.',
    };
  }

  try {
    const rows = await queryFn(table, limit);
    return {
      available: true,
      table,
      limit,
      rows: Array.isArray(rows) ? rows.slice(0, limit) : [],
    };
  } catch (error) {
    return {
      available: false,
      table,
      limit,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
