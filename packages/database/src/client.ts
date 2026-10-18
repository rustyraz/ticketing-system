import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseClient {
  db: Database;
  sql: postgres.Sql;
  close: () => Promise<void>;
}

export function createDatabase(
  connectionString: string,
  options?: postgres.Options<Record<string, never>>,
): DatabaseClient {
  const sql = postgres(connectionString, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    ...options,
  });

  const db = drizzle(sql, { schema });

  return {
    db,
    sql,
    close: async () => {
      await sql.end();
    },
  };
}

