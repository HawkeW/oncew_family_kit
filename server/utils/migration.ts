import { Database } from 'better-sqlite3';
import { getDatabase } from './database';
import { initializeUniversalDatabase, generateId } from '../models/universal-schema';

// 迁移脚本接口
interface Migration {
  version: string;
  description: string;
  up: (db: Database) => void;
  down?: (db: Database) => void;
}

// 迁移版本管理表
function initializeMigrationTable(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      executed_at TEXT NOT NULL
    )
  `);
}

// 检查迁移是否已执行
function isMigrationExecuted(db: Database, version: string): boolean {
  const result = db.prepare('SELECT version FROM migrations WHERE version = ?').get(version);
  return !!result;
}

// 记录迁移执行
function recordMigration(db: Database, version: string, description: string) {
  db.prepare('INSERT INTO migrations (version, description, executed_at) VALUES (?, ?, ?)').run(
    version,
    description,
    new Date().toISOString()
  );
}

// 迁移列表
const migrations: Migration[] = [
  {
    version: '001_create_universal_tables',
    description: '创建通用记录系统表结构',
    up: (db: Database) => {
      initializeUniversalDatabase(db);
    }
  },

  {
    version: '001_1_alter_record_types_created_by',
    description: '修改record_types表的created_by字段允许NULL',
    up: (db: Database) => {
      // 检查表是否存在
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='record_types'
      `).get();

      if (tableExists) {
        // 创建临时表
        db.exec(`
          CREATE TABLE record_types_temp (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            desc TEXT NOT NULL,
            category_id TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            created_by TEXT,
            tags TEXT NOT NULL DEFAULT '[]',
            is_system BOOLEAN NOT NULL DEFAULT 0,
            is_public BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES record_categories(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `);

        // 复制数据
        db.exec(`
          INSERT INTO record_types_temp 
          SELECT * FROM record_types
        `);

        // 删除原表
        db.exec('DROP TABLE record_types');

        // 重命名临时表
        db.exec('ALTER TABLE record_types_temp RENAME TO record_types');
      }
    }
  },
  
  {
    version: '002_insert_default_categories',
    description: '插入默认记录分类',
    up: (db: Database) => {
      const now = new Date().toISOString();
      
      const categories = [
        {
          id: 'health',
          name: '生理健康',
          description: '身体健康相关的记录',
          icon: 'heart',
          color: '#ef4444',
          sortOrder: 1
        },
        {
          id: 'mental',
          name: '心理情感',
          description: '情绪和心理状态记录',
          icon: 'brain',
          color: '#8b5cf6',
          sortOrder: 2
        },
        {
          id: 'work',
          name: '工作学习',
          description: '工作和学习相关记录',
          icon: 'briefcase',
          color: '#3b82f6',
          sortOrder: 3
        },
        {
          id: 'life',
          name: '生活品质',
          description: '日常生活质量记录',
          icon: 'home',
          color: '#10b981',
          sortOrder: 4
        },
        {
          id: 'growth',
          name: '个人成长',
          description: '个人发展和成长记录',
          icon: 'trending-up',
          color: '#f59e0b',
          sortOrder: 5
        }
      ];

      const insertCategory = db.prepare(`
        INSERT INTO record_categories (id, name, description, icon, color, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const category of categories) {
        insertCategory.run(
          category.id,
          category.name,
          category.description,
          category.icon,
          category.color,
          category.sortOrder,
          now,
          now
        );
      }
    }
  },

  {
    version: '003_create_system_record_types',
    description: '创建系统预置记录类型（便便记录和经期记录）',
    up: (db: Database) => {
      const now = new Date().toISOString();
      
      // 便便记录类型
      const stoolRecordTypeId = generateId();
      db.prepare(`
        INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, tags, is_system, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        stoolRecordTypeId,
        '便便记录',
        '记录排便情况，包括舒适度、便便形状等信息，帮助了解肠道健康状况',
        'health',
        'activity',
        '#f97316',
        null, // created_by 设为 null 表示系统创建
        JSON.stringify(['健康', '排便', '肠道']),
        1, // is_system
        1, // is_public
        now,
        now
      );

      // 便便记录字段定义
      const stoolFields = [
        {
          id: generateId(),
          name: 'record_time',
          label: '记录时间',
          type: 'date-time',
          required: true,
          placeholder: '选择记录时间',
          sortOrder: 1
        },
        {
          id: generateId(),
          name: 'comfort_level',
          label: '舒适度',
          type: 'select',
          required: true,
          validation: JSON.stringify({
            options: ['uncomfortable', 'normal', 'comfortable']
          }),
          sortOrder: 2
        },
        {
          id: generateId(),
          name: 'consistency',
          label: '便便形状',
          type: 'select',
          required: true,
          validation: JSON.stringify({
            options: ['hard', 'normal', 'soft', 'liquid']
          }),
          sortOrder: 3
        },
        {
          id: generateId(),
          name: 'notes',
          label: '备注',
          type: 'textarea',
          required: false,
          placeholder: '记录其他相关信息...',
          sortOrder: 4
        }
      ];

      const insertField = db.prepare(`
        INSERT INTO record_fields (id, record_type_id, name, label, type, required, placeholder, default_value, validation, description, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const field of stoolFields) {
        insertField.run(
          field.id,
          stoolRecordTypeId,
          field.name,
          field.label,
          field.type,
          field.required ? 1 : 0,
          field.placeholder || null,
          null,
          field.validation || null,
          null,
          field.sortOrder,
          now,
          now
        );
      }

      // 经期记录类型
      const menstrualRecordTypeId = generateId();
      db.prepare(`
        INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, tags, is_system, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        menstrualRecordTypeId,
        '经期记录',
        '记录月经周期情况，包括流量、疼痛程度等信息，帮助了解生理健康状况',
        'health',
        'calendar',
        '#ec4899',
        null, // created_by 设为 null 表示系统创建
        JSON.stringify(['健康', '经期', '月经']),
        1, // is_system
        1, // is_public
        now,
        now
      );

      // 经期记录字段定义
      const menstrualFields = [
        {
          id: generateId(),
          name: 'record_time',
          label: '记录时间',
          type: 'date-time',
          required: true,
          placeholder: '选择记录时间',
          sortOrder: 1
        },
        {
          id: generateId(),
          name: 'flow_level',
          label: '流量',
          type: 'select',
          required: true,
          validation: JSON.stringify({
            options: ['light', 'medium', 'heavy']
          }),
          sortOrder: 2
        },
        {
          id: generateId(),
          name: 'pain_level',
          label: '疼痛程度',
          type: 'select',
          required: true,
          validation: JSON.stringify({
            options: ['none', 'mild', 'moderate', 'severe']
          }),
          sortOrder: 3
        },
        {
          id: generateId(),
          name: 'notes',
          label: '备注',
          type: 'textarea',
          required: false,
          placeholder: '记录其他相关信息...',
          sortOrder: 4
        }
      ];

      for (const field of menstrualFields) {
        insertField.run(
          field.id,
          menstrualRecordTypeId,
          field.name,
          field.label,
          field.type,
          field.required ? 1 : 0,
          field.placeholder || null,
          null,
          field.validation || null,
          null,
          field.sortOrder,
          now,
          now
        );
      }
    }
  }
];

// 执行迁移
export function runMigrations() {
  const db = getDatabase();
  
  // 初始化迁移表
  initializeMigrationTable(db);
  
  console.log('开始执行数据库迁移...');
  
  for (const migration of migrations) {
    if (!isMigrationExecuted(db, migration.version)) {
      console.log(`执行迁移: ${migration.version} - ${migration.description}`);
      
      try {
        // 开始事务
        db.exec('BEGIN TRANSACTION');
        
        // 执行迁移
        migration.up(db);
        
        // 记录迁移
        recordMigration(db, migration.version, migration.description);
        
        // 提交事务
        db.exec('COMMIT');
        
        console.log(`迁移 ${migration.version} 执行成功`);
      } catch (error) {
        // 回滚事务
        db.exec('ROLLBACK');
        console.error(`迁移 ${migration.version} 执行失败:`, error);
        throw error;
      }
    } else {
      console.log(`迁移 ${migration.version} 已执行，跳过`);
    }
  }
  
  console.log('数据库迁移完成');
}

// 数据迁移：将现有数据转换到新结构
export function migrateExistingData() {
  const db = getDatabase();
  
  console.log('开始迁移现有数据...');
  
  try {
    db.exec('BEGIN TRANSACTION');
    
    // 获取系统记录类型ID
    const stoolRecordType = db.prepare(`
      SELECT id FROM record_types 
      WHERE name = '便便记录' AND is_system = 1
    `).get() as { id: string } | undefined;
    
    const menstrualRecordType = db.prepare(`
      SELECT id FROM record_types 
      WHERE name = '经期记录' AND is_system = 1
    `).get() as { id: string } | undefined;
    
    if (!stoolRecordType || !menstrualRecordType) {
      throw new Error('系统记录类型未找到，请先执行迁移脚本');
    }
    
    // 获取字段ID映射
    const getFieldId = (recordTypeId: string, fieldName: string): string => {
      const field = db.prepare(`
        SELECT id FROM record_fields 
        WHERE record_type_id = ? AND name = ?
      `).get(recordTypeId, fieldName) as { id: string } | undefined;
      
      if (!field) {
        throw new Error(`字段 ${fieldName} 未找到`);
      }
      
      return field.id;
    };
    
    // 迁移便便记录
    const stoolRecords = db.prepare('SELECT * FROM stool_records').all();
    console.log(`找到 ${stoolRecords.length} 条便便记录`);
    
    for (const record of stoolRecords) {
      const userRecordId = generateId();
      const now = new Date().toISOString();
      
      // 插入用户记录
      db.prepare(`
        INSERT INTO user_records (id, user_id, record_type_id, record_date, record_time, notes, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userRecordId,
        record.user_id,
        stoolRecordType.id,
        record.record_time.split('T')[0], // 提取日期部分
        record.record_time.split('T')[1]?.split('.')[0] || '00:00:00', // 提取时间部分
        record.notes,
        JSON.stringify([]),
        record.created_at,
        record.updated_at
      );
      
      // 插入字段值
      const fieldValues = [
        { fieldName: 'record_time', value: record.record_time },
        { fieldName: 'comfort_level', value: record.comfort_level },
        { fieldName: 'consistency', value: record.consistency },
        { fieldName: 'notes', value: record.notes || '' }
      ];
      
      for (const fieldValue of fieldValues) {
        if (fieldValue.value !== null && fieldValue.value !== '') {
          db.prepare(`
            INSERT INTO record_values (id, user_record_id, field_id, value_type, value_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateId(),
            userRecordId,
            getFieldId(stoolRecordType.id, fieldValue.fieldName),
            fieldValue.fieldName === 'record_time' ? 'date-time' : 
            (fieldValue.fieldName === 'notes' ? 'textarea' : 'select'),
            JSON.stringify(fieldValue.value),
            now,
            now
          );
        }
      }
    }
    
    // 迁移经期记录
    const menstrualRecords = db.prepare('SELECT * FROM menstrual_records').all();
    console.log(`找到 ${menstrualRecords.length} 条经期记录`);
    
    for (const record of menstrualRecords) {
      const userRecordId = generateId();
      const now = new Date().toISOString();
      
      // 插入用户记录
      db.prepare(`
        INSERT INTO user_records (id, user_id, record_type_id, record_date, record_time, notes, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userRecordId,
        record.user_id,
        menstrualRecordType.id,
        record.record_time.split('T')[0], // 提取日期部分
        record.record_time.split('T')[1]?.split('.')[0] || '00:00:00', // 提取时间部分
        record.notes,
        JSON.stringify([]),
        record.created_at,
        record.updated_at
      );
      
      // 插入字段值
      const fieldValues = [
        { fieldName: 'record_time', value: record.record_time },
        { fieldName: 'flow_level', value: record.flow_level },
        { fieldName: 'pain_level', value: record.pain_level },
        { fieldName: 'notes', value: record.notes || '' }
      ];
      
      for (const fieldValue of fieldValues) {
        if (fieldValue.value !== null && fieldValue.value !== '') {
          db.prepare(`
            INSERT INTO record_values (id, user_record_id, field_id, value_type, value_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateId(),
            userRecordId,
            getFieldId(menstrualRecordType.id, fieldValue.fieldName),
            fieldValue.fieldName === 'record_time' ? 'date-time' : 
            (fieldValue.fieldName === 'notes' ? 'textarea' : 'select'),
            JSON.stringify(fieldValue.value),
            now,
            now
          );
        }
      }
    }
    
    db.exec('COMMIT');
    console.log('现有数据迁移完成');
    
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('数据迁移失败:', error);
    throw error;
  }
}

// 验证迁移结果
export function validateMigration() {
  const db = getDatabase();
  
  console.log('验证迁移结果...');
  
  // 检查表是否存在
  const tables = [
    'record_categories',
    'record_types', 
    'record_fields',
    'user_records',
    'record_values',
    'record_relations'
  ];
  
  for (const table of tables) {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(table);
    
    if (!result) {
      throw new Error(`表 ${table} 不存在`);
    }
    console.log(`✓ 表 ${table} 存在`);
  }
  
  // 检查数据迁移结果
  const originalStoolCount = db.prepare('SELECT COUNT(*) as count FROM stool_records').get() as { count: number };
  const originalMenstrualCount = db.prepare('SELECT COUNT(*) as count FROM menstrual_records').get() as { count: number };
  
  const newStoolCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_records ur
    JOIN record_types rt ON ur.record_type_id = rt.id
    WHERE rt.name = '便便记录'
  `).get() as { count: number };
  
  const newMenstrualCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_records ur
    JOIN record_types rt ON ur.record_type_id = rt.id
    WHERE rt.name = '经期记录'
  `).get() as { count: number };
  
  console.log(`原始便便记录: ${originalStoolCount.count}, 迁移后: ${newStoolCount.count}`);
  console.log(`原始经期记录: ${originalMenstrualCount.count}, 迁移后: ${newMenstrualCount.count}`);
  
  if (originalStoolCount.count !== newStoolCount.count) {
    throw new Error('便便记录迁移数量不匹配');
  }
  
  if (originalMenstrualCount.count !== newMenstrualCount.count) {
    throw new Error('经期记录迁移数量不匹配');
  }
  
  console.log('✓ 迁移验证通过');
}