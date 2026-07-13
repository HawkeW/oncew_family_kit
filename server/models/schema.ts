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
  record_time: string; // 改为record_time，包含日期和时间信息
  flow_level: 'light' | 'medium' | 'heavy';
  pain_level: 'none' | 'mild' | 'moderate' | 'severe';
  notes?: string;
  created_at: string;
  updated_at: string;
  username: string;
}

export interface StoolRecord {
  id?: number;
  record_time: string; // 改为record_time，包含日期和时间信息
  comfort_level: 'uncomfortable' | 'normal' | 'comfortable';
  consistency: 'hard' | 'normal' | 'soft' | 'liquid';
  notes?: string;
  created_at: string;
  updated_at: string;

  user_id: number;
  username: string;
}

export interface Group {
  id?: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id?: number;
  group_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupInvitation {
  id?: number;
  group_id: number;
  invited_by: number;
  invite_token: string;
  status: 'pending' | 'accepted' | 'rejected';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationResponse {
  id?: number;
  invite_token: string;
  user_id: number;
  action: 'accept' | 'reject';
  responded_at: string;
}

export interface WeddingRsvp {
  id?: number;
  name: string;
  phone: string;
  count: number;
  remark?: string;
  created_at: string;
  updated_at: string;
  group_id?: number;
}

export interface WeddingFinance {
  id?: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  record_date: string;
  created_at: string;
  updated_at: string;
  group_id?: number;
}

export interface WeddingTask {
  id?: number;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed';
  category: 'preparation' | 'wedding_day';
  created_at: string;
  updated_at: string;
  group_id?: number;
}

export interface WeddingTimeline {
  id?: number;
  start_time: string;
  end_time?: string;
  title: string;
  description?: string;
  location?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
  group_id?: number;
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
    CREATE TABLE IF NOT EXISTS menstrual_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_time TEXT NOT NULL,
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
    CREATE TABLE IF NOT EXISTS stool_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_time TEXT NOT NULL,
      comfort_level TEXT NOT NULL,
      consistency TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建群组表
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 创建群组成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    )
  `);

  // 创建群组邀请表
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      invited_by INTEGER NOT NULL,
      invite_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 创建邀请响应记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS invitation_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invite_token TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      responded_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(invite_token, user_id)
    )
  `);

  // 迁移：为已存在的 wedding 表添加 group_id 字段
  const addGroupIdIfNotExists = (tableName: string) => {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN group_id INTEGER`);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column name')) {
        // ignore - column already exists
      }
    }
  };

  // 创建婚礼RSVP表
  db.exec(`
    CREATE TABLE IF NOT EXISTS wedding_rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      count INTEGER NOT NULL DEFAULT 1,
      remark TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      group_id INTEGER
    )
  `);

  addGroupIdIfNotExists('wedding_rsvps');

  // 创建婚礼财务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS wedding_finances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      record_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      group_id INTEGER
    )
  `);

  addGroupIdIfNotExists('wedding_finances');

  // 创建婚礼任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS wedding_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      group_id INTEGER
    )
  `);

  addGroupIdIfNotExists('wedding_tasks');

  // 创建婚礼流程时间轴表
  db.exec(`
    CREATE TABLE IF NOT EXISTS wedding_timelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      owner TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      group_id INTEGER
    )
  `);

  addGroupIdIfNotExists('wedding_timelines');
}