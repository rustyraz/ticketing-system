import * as dotenv from 'dotenv';
import * as path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/ticketing';

async function runMigrations(): Promise<void> {
  console.log(`[Migrate] Running migrations against: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    const migrationsFolder = path.resolve(__dirname, '../drizzle');
    await migrate(db, { migrationsFolder });
    console.log('[Migrate] Migrations applied successfully.');
  } catch (error) {
    console.error('[Migrate] Failed to apply migrations:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

void runMigrations();

