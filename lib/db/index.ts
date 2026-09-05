import Database from 'better-sqlite3';
import path from 'path';
import { SCHEMA_SQL } from './schema';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Initialize schema
  db.exec(SCHEMA_SQL);
  
  console.log(`Database initialized at ${dbPath}`);
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
