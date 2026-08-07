import type { DatabaseConfig } from '@nexorajs/config';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

export type Database = PostgresJsDatabase<typeof schema>;

/** Create database connection based on config */
export async function createDatabase(config: DatabaseConfig): Promise<Database> {
  if (config.provider === 'sqlite') {
    try {
      // @ts-expect-error optional peer dependency
      const SqliteDatabase = (await import('better-sqlite3')).default;
      const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
      const sqlite = new SqliteDatabase(config.url.replace('sqlite:', ''));
      return drizzleSqlite(sqlite, { schema }) as unknown as Database;
    } catch {
      throw new Error(
        'SQLite requires the optional "better-sqlite3" package. Install it with: pnpm add better-sqlite3',
      );
    }
  }

  const postgres = (await import('postgres')).default;
  const client = postgres(config.url);
  return drizzlePg(client, { schema });
}

export { schema };
