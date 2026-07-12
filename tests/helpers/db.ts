import Database from 'better-sqlite3'
import { initializeDatabase } from '../../server/models/schema'
import { initializeUniversalDatabase, generateId } from '../../server/models/universal-schema'
import bcrypt from 'bcryptjs'

// 使用内存数据库，这样每个测试都是完全隔离的
let testDb: Database.Database | null = null

/**
 * 获取测试数据库实例
 */
export function getTestDb(): Database.Database {
  if (!testDb) {
    // 使用内存数据库
    testDb = new Database(':memory:')
    // 启用外键约束
    testDb.pragma('foreign_keys = ON')
    // 初始化所有表
    initializeDatabase(testDb)
    initializeUniversalDatabase(testDb)
  }
  return testDb
}

/**
 * 关闭并删除测试数据库
 */
export function closeTestDb(): void {
  if (testDb) {
    testDb.close()
    testDb = null
  }
}

/**
 * 确保测试数据库完全干净（对于内存数据库，这个操作等同于closeTestDb）
 */
export function freshTestDb(): void {
  // 关闭现有连接
  if (testDb) {
    testDb.close()
  }
  // 创建新内存数据库
  testDb = new Database(':memory:')
  // 启用外键约束
  testDb.pragma('foreign_keys = ON')
  // 初始化所有表
  initializeDatabase(testDb)
  initializeUniversalDatabase(testDb)
}

/**
 * 重置测试数据库（清空所有数据但保留表结构）
 */
export function resetTestDb(): void {
  const db = getTestDb()
  
  // 启用外键约束
  db.exec('PRAGMA foreign_keys = ON')
  
  // 获取所有表名（按依赖顺序排序，避免外键约束问题）
  // 先删除有外键依赖的表
  const dependentTables = [
    'record_values',
    'user_records', 
    'group_invitations',
    'invitation_responses',
    'group_members',
    'record_fields',
    'record_types',
    'groups',
    'record_categories',
    'menstrual_records',
    'stool_records',
    'users',
    'wedding_rsvps',
    'wedding_finances',
    'wedding_tasks',
    'wedding_timelines'
  ]

  // 禁用外键约束
  db.exec('PRAGMA foreign_keys = OFF')
  
  // 清空所有表
  for (const table of dependentTables) {
    try {
      db.exec(`DELETE FROM "${table}"`)
    } catch (e) {
      // 表可能不存在，忽略
    }
  }
  
  // 重新启用外键约束
  db.exec('PRAGMA foreign_keys = ON')
}

/**
 * 创建一个测试用户
 */
export function createTestUser(db: Database, overrides: Partial<{
  username: string
  email: string
  password: string
}> = {}): { id: number; username: string; email: string; password: string } {
  const now = new Date().toISOString()
  
  const username = overrides.username || `testuser_${Date.now()}`
  const email = overrides.email || `${username}@test.com`
  const password = overrides.password || 'testpassword123'
  const hashedPassword = bcrypt.hashSync(password, 10)

  const result = db.prepare(`
    INSERT INTO users (username, password, email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, hashedPassword, email, now, now)

  return {
    id: result.lastInsertRowid as number,
    username,
    email,
    password
  }
}

/**
 * 创建一个测试群组
 */
export function createTestGroup(db: Database, userId: number, overrides: Partial<{
  name: string
  description: string
}> = {}): { id: number; name: string; description: string | null } {
  const now = new Date().toISOString()
  
  const name = overrides.name || `testgroup_${Date.now()}`
  const description = overrides.description || null

  const result = db.prepare(`
    INSERT INTO groups (name, description, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description, userId, now, now)

  // 自动将创建者添加为管理员
  db.prepare(`
    INSERT INTO group_members (group_id, user_id, role, joined_at)
    VALUES (?, ?, 'admin', ?)
  `).run(result.lastInsertRowid, userId, now)

  return {
    id: result.lastInsertRowid as number,
    name,
    description
  }
}

/**
 * 添加用户到群组
 */
export function addUserToGroup(db: Database, groupId: number, userId: number, role: 'admin' | 'member' = 'member'): void {
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO group_members (group_id, user_id, role, joined_at)
    VALUES (?, ?, ?, ?)
  `).run(groupId, userId, role, now)
}

/**
 * 创建一个测试记录分类
 */
export function createTestCategory(db: Database, overrides: Partial<{
  name: string
  icon: string
  color: string
}> = {}): { id: string } {
  const now = new Date().toISOString()
  
  const id = generateId()
  const name = overrides.name || `测试分类_${Date.now()}`
  const icon = overrides.icon || '📝'
  const color = overrides.color || '#3B82F6'

  // 获取最大排序值
  const maxSort = db.prepare('SELECT MAX(sort_order) as max_sort FROM record_categories').get() as { max_sort: number | null }
  const sortOrder = (maxSort.max_sort || 0) + 1

  db.prepare(`
    INSERT INTO record_categories (id, name, icon, color, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, icon, color, sortOrder, now, now)

  return { id }
}

/**
 * 创建一个测试记录类型
 */
export function createTestRecordType(db: Database, categoryId: string, userId: number, overrides: Partial<{
  name: string
  desc: string
  icon: string
  color: string
  fields: any[]
}> = {}): { id: string; fields: any[] } {
  const now = new Date().toISOString()
  
  const id = generateId()
  const name = overrides.name || `测试记录类型_${Date.now()}`
  const desc = overrides.desc || '测试描述'
  const icon = overrides.icon || '📋'
  const color = overrides.color || '#10B981'
  const fields = overrides.fields || [
    {
      name: 'test_field',
      label: '测试字段',
      type: 'text',
      required: true,
      sortOrder: 1
    }
  ]

  db.prepare(`
    INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, desc, categoryId, icon, color, userId, now, now)

  // 插入字段
  for (const field of fields) {
    db.prepare(`
      INSERT INTO record_fields (id, record_type_id, name, label, type, required, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), id, field.name, field.label, field.type, field.required ? 1 : 0, field.sortOrder, now, now)
  }

  return { id, fields }
}

/**
 * 创建一个测试用户记录
 */
export function createTestUserRecord(db: Database, userId: number, recordTypeId: string, overrides: Partial<{
  recordDate: string
  recordTime: string
  notes: string
  groupId: number | null
  fieldValues: Record<string, any>
}> = {}): { id: string } {
  const now = new Date().toISOString()
  
  const id = generateId()
  const recordDate = overrides.recordDate || new Date().toISOString().split('T')[0]
  const recordTime = overrides.recordTime || '10:00:00'
  const notes = overrides.notes || null
  const groupId = overrides.groupId || null
  const fieldValues = overrides.fieldValues || { test_field: '测试值' }

  db.prepare(`
    INSERT INTO user_records (id, user_id, record_type_id, record_date, record_time, notes, group_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, recordTypeId, recordDate, recordTime, notes, groupId, now, now)

  // 插入字段值
  const fields = db.prepare('SELECT * FROM record_fields WHERE record_type_id = ?').all(recordTypeId) as any[]
  for (const field of fields) {
    const value = fieldValues[field.name]
    if (value !== undefined && value !== null) {
      db.prepare(`
        INSERT INTO record_values (id, user_record_id, field_id, value_type, value_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(generateId(), id, field.id, field.type, JSON.stringify(value), now, now)
    }
  }

  return { id }
}
