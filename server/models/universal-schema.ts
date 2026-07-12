import { Database } from 'better-sqlite3';

// 记录字段类型定义
export type RecordFieldType = 'date' | 'time' | 'date-time' | 'number' | 'text' | 'textarea' | 'select';

// 记录字段接口
export interface RecordField {
  id?: string;
  name: string;
  label: string;
  type: RecordFieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // 用于select类型
  };
  description?: string;
  sortOrder: number;
}

// 记录类型分类
export interface RecordCategory {
  id?: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 自定义记录类型
export interface CustomRecordType {
  id?: string;
  name: string;
  desc: string; // 记录类型的详细描述。可以辅助AI评估数据
  categoryId: string;
  icon: string; // 预定义的icon
  color: string;  // 预定义的icon颜色
  fields: RecordField[];
  createdBy: string;
  tags: string[];
  isSystem: boolean; // 是否为系统预置类型
  isPublic: boolean; // 是否为公开类型（可被其他用户使用）
  createdAt: string;
  updatedAt: string;
}

// 用户记录实例
export interface UserRecord {
  id?: string;
  userId: string;
  recordTypeId: string;
  recordDate: string; // YYYY-MM-DD
  recordTime?: string; // HH:mm:ss
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  moodContext?: {
    emotion: string;
    intensity: number; // 1-10
  };
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 动态数据存储
export interface RecordValue {
  id?: string;
  userRecordId: string;
  fieldId: string;
  valueType: RecordFieldType;
  valueData: string; // JSON字符串存储各种类型的值
  confidenceScore?: number; // AI分析的置信度
  createdAt: string;
  updatedAt: string;
}

// 记录关联关系
export interface RecordRelation {
  id?: string;
  fromRecordId: string;
  toRecordId: string;
  relationType: 'cause' | 'effect' | 'correlation' | 'sequence';
  strength: number; // 关联强度 0-1
  description?: string;
  createdAt: string;
}

// 初始化通用数据库结构
export function initializeUniversalDatabase(db: Database) {
  // 记录类型分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 自定义记录类型表
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT NOT NULL,
      category_id TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_by TEXT,
      tags TEXT NOT NULL DEFAULT '[]', -- JSON数组
      is_system BOOLEAN NOT NULL DEFAULT 0,
      is_public BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES record_categories(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 记录字段定义表
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_fields (
      id TEXT PRIMARY KEY,
      record_type_id TEXT NOT NULL,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      required BOOLEAN NOT NULL DEFAULT 0,
      placeholder TEXT,
      default_value TEXT, -- JSON字符串
      validation TEXT, -- JSON字符串存储验证规则
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
    )
  `);

  // 用户记录实例表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_records (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      record_type_id TEXT NOT NULL,
      record_date TEXT NOT NULL, -- YYYY-MM-DD
      record_time TEXT, -- HH:mm:ss
      location TEXT, -- JSON字符串存储位置信息
      mood_context TEXT, -- JSON字符串存储情绪上下文
      notes TEXT,
      tags TEXT NOT NULL DEFAULT '[]', -- JSON数组
      group_id INTEGER, -- 所属群组ID，用于群组内共享记录
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (record_type_id) REFERENCES record_types(id)
    )
  `);

  // 迁移：为已存在的 user_records 表添加 group_id 字段（如果不存在）
  try {
    db.exec(`
      ALTER TABLE user_records ADD COLUMN group_id INTEGER
    `);
  } catch (e: any) {
    // 字段已存在，忽略错误
    if (!e.message?.includes('duplicate column name')) {
      console.log('group_id 字段添加跳过或已完成');
    }
  }

  // 动态数据存储表
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_values (
      id TEXT PRIMARY KEY,
      user_record_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      value_type TEXT NOT NULL,
      value_data TEXT NOT NULL, -- JSON字符串存储实际值
      confidence_score REAL, -- AI分析置信度 0-1
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_record_id) REFERENCES user_records(id) ON DELETE CASCADE,
      FOREIGN KEY (field_id) REFERENCES record_fields(id)
    )
  `);

  // 记录关联关系表
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_relations (
      id TEXT PRIMARY KEY,
      from_record_id TEXT NOT NULL,
      to_record_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      strength REAL NOT NULL DEFAULT 0.5,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (from_record_id) REFERENCES user_records(id) ON DELETE CASCADE,
      FOREIGN KEY (to_record_id) REFERENCES user_records(id) ON DELETE CASCADE
    )
  `);

  // 创建索引以提高查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_records_user_date 
    ON user_records(user_id, record_date DESC);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_records_type 
    ON user_records(record_type_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_record_values_record 
    ON record_values(user_record_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_record_fields_type 
    ON record_fields(record_type_id, sort_order);
  `);
}

// 生成UUID的辅助函数
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 数据验证辅助函数
export function validateFieldValue(field: RecordField, value: any): boolean {
  if (field.required && (value === null || value === undefined || value === '')) {
    return false;
  }

  if (!field.required && (value === null || value === undefined || value === '')) {
    return true;
  }

  switch (field.type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) return false;
      if (field.validation?.min !== undefined && num < field.validation.min) return false;
      if (field.validation?.max !== undefined && num > field.validation.max) return false;
      break;
    
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') return false;
      if (field.validation?.min !== undefined && value.length < field.validation.min) return false;
      if (field.validation?.max !== undefined && value.length > field.validation.max) return false;
      if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) return false;
      break;
    
    case 'select':
      if (field.validation?.options && !field.validation.options.includes(value)) return false;
      break;
    
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      break;
    
    case 'time':
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return false;
      break;
    
    case 'date-time':
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?$/.test(value)) return false;
      break;
  }

  return true;
}