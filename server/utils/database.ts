import Database from 'better-sqlite3';
import { resolve } from 'path';
import { initializeDatabase } from '../models/schema';
import { initializeUniversalDatabase } from '../models/universal-schema';

let db: Database.Database;

export function getDatabase() {
  if (!db) {
    // 使用绝对路径，确保在不同环境下都能找到数据库文件
    // 优先使用环境变量 DATABASE_PATH，否则默认为当前工作目录下的 data.db
    const dbPath = process.env.DATABASE_PATH || resolve(process.cwd(), 'data.db');
    console.log(`Database path: ${dbPath}`);
    
    db = new Database(dbPath);
    initializeDatabase(db);
    initializeUniversalDatabase(db);
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
  }
}