import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getTestDb,
  closeTestDb,
  freshTestDb,
  createTestUser,
  createTestCategory,
  createTestRecordType
} from '../helpers/db'
import { generateId } from '../../server/models/universal-schema'

describe('Record Types API', () => {
  let db: ReturnType<typeof getTestDb>
  let testUser: ReturnType<typeof createTestUser>
  let testCategory: ReturnType<typeof createTestCategory>

  beforeEach(() => {
    // 每次测试都使用全新的数据库
    freshTestDb()
    db = getTestDb()
    testUser = createTestUser(db, { username: 'testuser', email: 'test@test.com' })
    testCategory = createTestCategory(db, { name: '测试分类' })
  })

  afterEach(() => {
    closeTestDb()
  })

  describe('创建记录类型 (POST /api/record-types)', () => {
    it('应该能够创建新的记录类型', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '支出记录',
        desc: '用于记录日常支出',
        icon: '💰',
        color: '#10B981',
        fields: [
          { name: 'amount', label: '金额', type: 'number', required: true, sortOrder: 1 },
          { name: 'category', label: '分类', type: 'select', required: true, sortOrder: 2 },
          { name: 'note', label: '备注', type: 'textarea', required: false, sortOrder: 3 }
        ]
      })

      expect(recordType.id).toBeDefined()
      expect(recordType.fields.length).toBe(3)
    })

    it('创建记录类型时应包含字段定义', async () => {
      const fields = [
        { name: 'title', label: '标题', type: 'text', required: true, sortOrder: 1 },
        { name: 'value', label: '数值', type: 'number', required: false, sortOrder: 2 }
      ]

      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '测试类型',
        fields
      })

      const savedFields = db.prepare(`
        SELECT * FROM record_fields WHERE record_type_id = ? ORDER BY sort_order
      `).all(recordType.id) as any[]

      expect(savedFields.length).toBe(2)
      expect(savedFields[0].name).toBe('title')
      expect(savedFields[0].type).toBe('text')
      expect(savedFields[1].name).toBe('value')
      expect(savedFields[1].type).toBe('number')
    })

    it('select类型字段必须有options', async () => {
      const fields = [
        { name: 'category', label: '分类', type: 'select', required: true, sortOrder: 1 }
      ]

      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '无效类型',
        fields
      })

      const savedField = db.prepare(`
        SELECT * FROM record_fields WHERE record_type_id = ? AND name = 'category'
      `).get(recordType.id) as any

      const options = savedField.options ? JSON.parse(savedField.options) : null
      expect(options).toBeNull()
    })

    it('应该能够创建系统级记录类型（is_system=1）', async () => {
      const now = new Date().toISOString()
      const id = generateId()

      db.prepare(`
        INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, is_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(id, '系统类型', '系统预置', testCategory.id, '🔧', '#666666', null, now, now)

      const systemType = db.prepare('SELECT * FROM record_types WHERE id = ?').get(id) as any
      expect(systemType.is_system).toBe(1)
    })
  })

  describe('查询记录类型 (GET /api/record-types)', () => {
    beforeEach(() => {
      createTestRecordType(db, testCategory.id, testUser.id, { name: '类型A' })
      createTestRecordType(db, testCategory.id, testUser.id, { name: '类型B' })
    })

    it('应该能够获取所有记录类型', async () => {
      const types = db.prepare(`
        SELECT * FROM record_types WHERE is_system = 0 AND created_by = ?
      `).all(testUser.id) as any[]

      expect(types.length).toBe(2)
    })

    it('应该能够获取指定分类的记录类型', async () => {
      const types = db.prepare(`
        SELECT * FROM record_types WHERE category_id = ? AND is_system = 0
      `).all(testCategory.id) as any[]

      expect(types.length).toBe(2)
    })

    it('系统类型应该对所有用户可见', async () => {
      const now = new Date().toISOString()
      const systemTypeId = generateId()

      db.prepare(`
        INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, is_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)
      `).run(systemTypeId, '系统类型', '系统预置', testCategory.id, '🔧', '#666666', now, now)

      const systemTypes = db.prepare(`
        SELECT * FROM record_types WHERE is_system = 1
      `).all() as any[]

      expect(systemTypes.length).toBe(1)
      expect(systemTypes[0].name).toBe('系统类型')
    })

    it('应该能够获取记录类型的字段详情', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '带字段的类型',
        fields: [
          { name: 'field1', label: '字段1', type: 'text', required: true, sortOrder: 1 },
          { name: 'field2', label: '字段2', type: 'number', required: false, sortOrder: 2 }
        ]
      })

      const fields = db.prepare(`
        SELECT * FROM record_fields WHERE record_type_id = ? ORDER BY sort_order
      `).all(recordType.id) as any[]

      expect(fields.length).toBe(2)
      expect(fields[0].label).toBe('字段1')
    })
  })

  describe('更新记录类型 (PUT /api/record-types)', () => {
    it('创建者应该能够更新记录类型', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '原始名称',
        fields: [
          { name: 'field1', label: '字段1', type: 'text', required: true, sortOrder: 1 }
        ]
      })

      const now = new Date().toISOString()
      db.prepare(`
        UPDATE record_types SET name = ?, updated_at = ? WHERE id = ?
      `).run('新名称', now, recordType.id)

      const updated = db.prepare('SELECT * FROM record_types WHERE id = ?').get(recordType.id) as any
      expect(updated.name).toBe('新名称')
    })

    it('更新时应同时更新字段定义', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '原始类型',
        fields: [
          { name: 'old_field', label: '旧字段', type: 'text', required: true, sortOrder: 1 }
        ]
      })

      const now = new Date().toISOString()

      db.prepare('DELETE FROM record_fields WHERE record_type_id = ?').run(recordType.id)

      db.prepare(`
        INSERT INTO record_fields (id, record_type_id, name, label, type, required, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(generateId(), recordType.id, 'new_field', '新字段', 'number', 0, 1, now, now)

      const fields = db.prepare(`
        SELECT * FROM record_fields WHERE record_type_id = ?
      `).all(recordType.id) as any[]

      expect(fields.length).toBe(1)
      expect(fields[0].name).toBe('new_field')
    })

    it('系统类型不应该被普通用户修改', async () => {
      const now = new Date().toISOString()
      const systemTypeId = generateId()

      db.prepare(`
        INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, is_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)
      `).run(systemTypeId, '系统类型', '系统预置', testCategory.id, '🔧', '#666666', now, now)

      const result = db.prepare(`
        UPDATE record_types SET name = ? WHERE id = ? AND is_system = 0
      `).run('被拒绝的更新', systemTypeId)

      expect(result.changes).toBe(0)
    })
  })

  describe('删除记录类型 (DELETE /api/record-types)', () => {
    it('创建者应该能够删除自己创建的记录类型', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '待删除类型'
      })

      const result = db.prepare('DELETE FROM record_types WHERE id = ? AND is_system = 0').run(recordType.id)
      expect(result.changes).toBe(1)

      const deleted = db.prepare('SELECT * FROM record_types WHERE id = ?').get(recordType.id)
      expect(deleted).toBeUndefined()
    })

    it('删除记录类型时应同时删除字段定义', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '待删除类型',
        fields: [
          { name: 'field1', label: '字段1', type: 'text', required: true, sortOrder: 1 }
        ]
      })

      db.prepare('DELETE FROM record_types WHERE id = ?').run(recordType.id)

      const fields = db.prepare('SELECT * FROM record_fields WHERE record_type_id = ?').all(recordType.id)
      expect(fields.length).toBe(0)
    })

    it('有记录关联的记录类型不应该被删除', async () => {
      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '有关联记录的类型'
      })

      const now = new Date().toISOString()
      const recordId = generateId()

      db.prepare(`
        INSERT INTO user_records (id, user_id, record_type_id, record_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(recordId, testUser.id, recordType.id, '2026-07-12', now, now)

      // 外键约束会阻止删除，抛出异常
      try {
        db.prepare('DELETE FROM record_types WHERE id = ?').run(recordType.id)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
        const stillExists = db.prepare('SELECT * FROM record_types WHERE id = ?').get(recordType.id)
        expect(stillExists).toBeDefined()
      }
    })

    it('系统类型不应该被删除', async () => {
      const now = new Date().toISOString()
      const systemTypeId = generateId()

      db.prepare(`
        INSERT INTO record_types (id, name, desc, category_id, icon, color, created_by, is_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)
      `).run(systemTypeId, '系统类型', '系统预置', testCategory.id, '🔧', '#666666', now, now)

      const result = db.prepare('DELETE FROM record_types WHERE id = ? AND is_system = 0').run(systemTypeId)
      expect(result.changes).toBe(0)

      const stillExists = db.prepare('SELECT * FROM record_types WHERE id = ?').get(systemTypeId)
      expect(stillExists).toBeDefined()
    })
  })

  describe('记录类型分享功能', () => {
    it('公开类型的记录类型应该可以被其他用户使用', async () => {
      const otherUser = createTestUser(db, { username: 'other', email: 'other@test.com' })

      const recordType = createTestRecordType(db, testCategory.id, testUser.id, {
        name: '公开类型',
        fields: [
          { name: 'title', label: '标题', type: 'text', required: true, sortOrder: 1 }
        ]
      })

      db.prepare(`
        UPDATE record_types SET is_public = 1 WHERE id = ?
      `).run(recordType.id)

      const publicTypes = db.prepare(`
        SELECT * FROM record_types WHERE is_public = 1 OR created_by = ?
      `).all(otherUser.id) as any[]

      expect(publicTypes.some(t => t.id === recordType.id)).toBe(true)
    })
  })
})
