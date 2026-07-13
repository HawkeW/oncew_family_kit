/**
 * 数据库迁移：给健康记录表添加 group_id 字段
 * 
 * 功能：
 * 1. 给 menstrual_records 和 stool_records 表添加 group_id 字段
 * 2. 将历史数据迁移到用户的主家庭（根据用户所在的第一个群组）
 * 
 * 运行方式：cd D:\projects\oncew_family_kit && npx tsx server/migrations/001_add_group_id_to_health_records.ts
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

// 1. 添加 group_id 字段（如果不存在）
try {
  db.exec(`
    ALTER TABLE menstrual_records ADD COLUMN group_id INTEGER;
  `);
  console.log('✓ menstrual_records 表已添加 group_id 字段');
} catch (e: any) {
  if (e.message.includes('duplicate column name') || e.message.includes('Duplicate column name')) {
    console.log('- menstrual_records 表 group_id 字段已存在，跳过');
  } else {
    throw e;
  }
}

try {
  db.exec(`
    ALTER TABLE stool_records ADD COLUMN group_id INTEGER;
  `);
  console.log('✓ stool_records 表已添加 group_id 字段');
} catch (e: any) {
  if (e.message.includes('duplicate column name') || e.message.includes('Duplicate column name')) {
    console.log('- stool_records 表 group_id 字段已存在，跳过');
  } else {
    throw e;
  }
}

// 2. 迁移历史数据：为每条记录找到用户的主家庭
console.log('\n开始迁移历史数据...');

// 获取每个用户的第一个（最老的）群组作为主家庭
const userMainGroup = new Map<number, number>();
const groupMembers = db.prepare(`
  SELECT user_id, group_id, MIN(joined_at) as earliest_join
  FROM group_members
  GROUP BY user_id
`).all() as { user_id: number; group_id: number; earliest_join: string }[];

for (const gm of groupMembers) {
  userMainGroup.set(gm.user_id, gm.group_id);
}

console.log(`找到 ${userMainGroup.size} 个用户的主家庭映射`);

// 迁移经期记录
const menstrualRecords = db.prepare(`
  SELECT id, user_id FROM menstrual_records WHERE group_id IS NULL
`).all() as { id: number; user_id: number }[];

if (menstrualRecords.length > 0) {
  const updateMenstrual = db.prepare(`
    UPDATE menstrual_records SET group_id = ? WHERE id = ?
  `);
  
  let updated = 0;
  for (const record of menstrualRecords) {
    const groupId = userMainGroup.get(record.user_id);
    if (groupId) {
      updateMenstrual.run(groupId, record.id);
      updated++;
    }
  }
  console.log(`✓ 经期记录迁移完成：${updated}/${menstrualRecords.length} 条`);
} else {
  console.log('- 无需迁移经期记录');
}

// 迁移大便记录
const stoolRecords = db.prepare(`
  SELECT id, user_id FROM stool_records WHERE group_id IS NULL
`).all() as { id: number; user_id: number }[];

if (stoolRecords.length > 0) {
  const updateStool = db.prepare(`
    UPDATE stool_records SET group_id = ? WHERE id = ?
  `);
  
  let updated = 0;
  for (const record of stoolRecords) {
    const groupId = userMainGroup.get(record.user_id);
    if (groupId) {
      updateStool.run(groupId, record.id);
      updated++;
    }
  }
  console.log(`✓ 大便记录迁移完成：${updated}/${stoolRecords.length} 条`);
} else {
  console.log('- 无需迁移大便记录');
}

// 3. 创建索引（加速查询）
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_menstrual_group ON menstrual_records(group_id);
    CREATE INDEX IF NOT EXISTS idx_stool_group ON stool_records(group_id);
  `);
  console.log('✓ 索引创建完成');
} catch (e) {
  console.log('- 索引已存在或创建失败:', e);
}

console.log('\n迁移完成！');

db.close();