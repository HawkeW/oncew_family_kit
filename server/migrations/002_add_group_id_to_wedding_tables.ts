/**
 * 数据库迁移：为婚礼相关表添加 group_id 字段
 * 
 * 功能：
 * 1. 创建婚礼相关表（如果不存在），包含 group_id 字段
 * 2. 将历史数据迁移到默认群组
 * 
 * 运行方式：cd D:\projects\oncew_family_kit && npx tsx server/migrations/002_add_group_id_to_wedding_tables.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置 db 路径为项目根目录
const dbPath = path.join(__dirname, '..', '..', 'data.db');
console.log('数据库路径:', dbPath);

const db = new Database(dbPath);

console.log('开始迁移...');

const DEFAULT_GROUP_ID = 1;

// 创建婚礼 RSVP 表
try {
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
  console.log('✓ wedding_rsvps 表已创建/已存在');
} catch (e) {
  console.log('wedding_rsvps 表错误:', e);
}

// 创建婚礼财务表
try {
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
  console.log('✓ wedding_finances 表已创建/已存在');
} catch (e) {
  console.log('wedding_finances 表错误:', e);
}

// 创建婚礼任务表
try {
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
  console.log('✓ wedding_tasks 表已创建/已存在');
} catch (e) {
  console.log('wedding_tasks 表错误:', e);
}

// 创建婚礼时间轴表
try {
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
  console.log('✓ wedding_timelines 表已创建/已存在');
} catch (e) {
  console.log('wedding_timelines 表错误:', e);
}

// 2. 迁移历史数据（为没有 group_id 的记录设置默认值）
console.log('\n开始迁移历史数据...');

const tables = [
  { name: 'wedding_rsvps', displayName: 'RSVP' },
  { name: 'wedding_finances', displayName: '财务' },
  { name: 'wedding_tasks', displayName: '任务' },
  { name: 'wedding_timelines', displayName: '时间轴' }
];

for (const table of tables) {
  const records = db.prepare(`
    SELECT id FROM ${table.name} WHERE group_id IS NULL
  `).all() as { id: number }[];

  if (records.length > 0) {
    const update = db.prepare(`UPDATE ${table.name} SET group_id = ? WHERE id = ?`);
    
    let updated = 0;
    for (const record of records) {
      update.run(DEFAULT_GROUP_ID, record.id);
      updated++;
    }
    console.log(`✓ ${table.displayName} 表迁移完成：${updated}/${records.length} 条`);
  } else {
    console.log(`- ${table.displayName} 表无需迁移`);
  }
}

// 3. 创建索引
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wedding_rsvp_group ON wedding_rsvps(group_id);
    CREATE INDEX IF NOT EXISTS idx_wedding_finance_group ON wedding_finances(group_id);
    CREATE INDEX IF NOT EXISTS idx_wedding_tasks_group ON wedding_tasks(group_id);
    CREATE INDEX IF NOT EXISTS idx_wedding_timeline_group ON wedding_timelines(group_id);
  `);
  console.log('✓ 索引创建完成');
} catch (e) {
  console.log('- 索引已存在或创建失败:', e);
}

console.log('\n迁移完成！');

db.close();