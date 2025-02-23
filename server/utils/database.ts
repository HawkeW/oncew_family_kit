import Database from 'better-sqlite3';
import { initializeDatabase } from '../models/schema';

let db: Database.Database;

export function getDatabase() {
  if (!db) {
    db = new Database('data.db');
    initializeDatabase(db);
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
  }
}