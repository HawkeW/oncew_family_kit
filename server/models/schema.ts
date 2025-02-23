import { Database } from 'better-sqlite3';

export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface MenstrualRecord {
  id?: number;
  record_date: string;
  flow_level: 'light' | 'medium' | 'heavy';
  pain_level: 'none' | 'mild' | 'moderate' | 'severe';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StoolRecord {
  id?: number;
  date: string;
  comfort_level: 'uncomfortable' | 'normal' | 'comfortable';
  consistency: 'hard' | 'normal' | 'soft' | 'liquid';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function initializeDatabase(db: Database) {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 创建经期记录表
  db.exec(`
    DROP TABLE IF EXISTS menstrual_records;
    CREATE TABLE menstrual_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date TEXT NOT NULL,
      flow_level TEXT NOT NULL,
      pain_level TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建便便记录表
  db.exec(`
    DROP TABLE IF EXISTS stool_records;
    CREATE TABLE stool_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      comfort_level TEXT NOT NULL,
      consistency TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}