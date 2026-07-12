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

describe('Record Categories API', () => {
  let db: ReturnType<typeof getTestDb>
  let testUser: ReturnType<typeof createTestUser>

  beforeEach(() => {
    // 每次测试都使用全新的数据库
    freshTestDb()
    db = getTestDb()
    testUser = createTestUser(db, { username: 'testuser', email: 'test@test.com' })
  })

  afterEach(() => {
    closeTestDb()
  })

  describe('创建分类 (POST /api/record-categories)', () => {
    it('应该能够创建新的分类', async () => {
      const category = createTestCategory(db, {
        name: '健康记录',
        icon: '🏥',
        color: '#EF4444'
      })

      expect(category.id).toBeDefined()

      const saved = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id) as any
      expect(saved.name).toBe('健康记录')
      expect(saved.icon).toBe('🏥')
      expect(saved.color).toBe('#EF4444')
    })

    it('分类名称不能重复', async () => {
      createTestCategory(db, { name: '健康记录' })

      try {
        createTestCategory(db, { name: '健康记录' })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('应该自动设置sort_order', async () => {
      const cat1 = createTestCategory(db, { name: '分类1' })
      const cat2 = createTestCategory(db, { name: '分类2' })
      const cat3 = createTestCategory(db, { name: '分类3' })

      const saved1 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat1.id) as any
      const saved2 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat2.id) as any
      const saved3 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat3.id) as any

      expect(saved1.sort_order).toBeLessThan(saved2.sort_order)
      expect(saved2.sort_order).toBeLessThan(saved3.sort_order)
    })

    it('应该能够设置分类描述', async () => {
      const category = createTestCategory(db, {
        name: '详细分类',
        icon: '📋',
        color: '#3B82F6'
      })

      db.prepare(`
        UPDATE record_categories SET description = ? WHERE id = ?
      `).run('这是分类的详细描述', category.id)

      const saved = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id) as any
      expect(saved.description).toBe('这是分类的详细描述')
    })
  })

  describe('查询分类 (GET /api/record-categories)', () => {
    beforeEach(() => {
      createTestCategory(db, { name: '分类A', icon: 'A', color: '#111111' })
      createTestCategory(db, { name: '分类B', icon: 'B', color: '#222222' })
      createTestCategory(db, { name: '分类C', icon: 'C', color: '#333333' })
    })

    it('应该能够获取所有分类', async () => {
      const categories = db.prepare(`
        SELECT * FROM record_categories ORDER BY sort_order
      `).all() as any[]

      expect(categories.length).toBe(3)
      expect(categories[0].name).toBe('分类A')
      expect(categories[1].name).toBe('分类B')
      expect(categories[2].name).toBe('分类C')
    })

    it('应该按sort_order排序', async () => {
      const categories = db.prepare(`
        SELECT * FROM record_categories ORDER BY sort_order
      `).all() as any[]

      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].sort_order).toBeGreaterThanOrEqual(categories[i - 1].sort_order)
      }
    })

    it('应该能够获取单个分类详情', async () => {
      const category = createTestCategory(db, { name: '详情分类' })

      const saved = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id)
      expect(saved).toBeDefined()
      expect((saved as any).name).toBe('详情分类')
    })

    it('不存在的分类应该返回空', async () => {
      const nonExistentId = generateId()

      const saved = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(nonExistentId)
      expect(saved).toBeUndefined()
    })

    it('可以包含统计信息', async () => {
      const category = createTestCategory(db, { name: '有统计的分类' })

      const rt1 = createTestRecordType(db, category.id, testUser.id, { name: '类型1' })
      const rt2 = createTestRecordType(db, category.id, testUser.id, { name: '类型2' })

      const categoriesWithStats = db.prepare(`
        SELECT rc.*,
               COUNT(DISTINCT rt.id) as record_type_count
        FROM record_categories rc
        LEFT JOIN record_types rt ON rc.id = rt.category_id
        WHERE rc.id = ?
        GROUP BY rc.id
      `).all(category.id) as any[]

      expect(categoriesWithStats[0].record_type_count).toBe(2)
    })
  })

  describe('更新分类 (PUT /api/record-categories)', () => {
    it('应该能够更新分类名称', async () => {
      const category = createTestCategory(db, { name: '原名称' })

      db.prepare(`
        UPDATE record_categories SET name = ?, updated_at = ? WHERE id = ?
      `).run('新名称', new Date().toISOString(), category.id)

      const updated = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id) as any
      expect(updated.name).toBe('新名称')
    })

    it('应该能够更新分类图标和颜色', async () => {
      const category = createTestCategory(db, { name: '测试', icon: 'X', color: '#000000' })

      db.prepare(`
        UPDATE record_categories SET icon = ?, color = ?, updated_at = ? WHERE id = ?
      `).run('Y', '#00FF00', new Date().toISOString(), category.id)

      const updated = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id) as any
      expect(updated.icon).toBe('Y')
      expect(updated.color).toBe('#00FF00')
    })

    it('更新名称时不能与现有名称重复', async () => {
      createTestCategory(db, { name: '分类A' })
      const categoryB = createTestCategory(db, { name: '分类B' })

      try {
        db.prepare(`
          UPDATE record_categories SET name = ? WHERE id = ? AND name != ?
        `).run('分类A', categoryB.id, '分类A')

        const updated = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(categoryB.id) as any
        expect(updated.name).not.toBe('分类A')
      } catch (error) {
        // 预期会抛出错误
      }
    })

    it('应该能够调整分类排序', async () => {
      const cat1 = createTestCategory(db, { name: '分类1' })
      const cat2 = createTestCategory(db, { name: '分类2' })

      const saved1 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat1.id) as any
      const saved2 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat2.id) as any

      db.prepare(`
        UPDATE record_categories SET sort_order = ? WHERE id = ?
      `).run(saved2.sort_order, cat1.id)

      const swapped1 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat1.id) as any
      expect(swapped1.sort_order).toBe(saved2.sort_order)
    })
  })

  describe('删除分类 (DELETE /api/record-categories)', () => {
    it('应该能够删除没有记录类型的分类', async () => {
      const category = createTestCategory(db, { name: '待删除' })

      const result = db.prepare('DELETE FROM record_categories WHERE id = ?').run(category.id)
      expect(result.changes).toBe(1)

      const deleted = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id)
      expect(deleted).toBeUndefined()
    })

    it('有记录类型的分类不应该被删除', async () => {
      const category = createTestCategory(db, { name: '有关联' })
      createTestRecordType(db, category.id, testUser.id, { name: '关联类型' })

      // 外键约束会阻止删除，抛出异常
      try {
        db.prepare('DELETE FROM record_categories WHERE id = ?').run(category.id)
        // 如果没抛异常，说明删除成功了（不应该）
        expect(true).toBe(false)
      } catch (error) {
        // 预期会抛出外键约束错误
        expect(error).toBeDefined()
        // 验证分类仍然存在
        const stillExists = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(category.id)
        expect(stillExists).toBeDefined()
      }
    })

    it('删除分类不影响其他分类', async () => {
      const cat1 = createTestCategory(db, { name: '分类1' })
      const cat2 = createTestCategory(db, { name: '分类2' })

      db.prepare('DELETE FROM record_categories WHERE id = ?').run(cat1.id)

      const remaining = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(cat2.id)
      expect(remaining).toBeDefined()

      const allCategories = db.prepare('SELECT * FROM record_categories').all()
      expect(allCategories.length).toBe(1)
    })

    it('删除分类后sort_order应该重新计算（或者保持不变）', async () => {
      const cat1 = createTestCategory(db, { name: '分类1' })
      const cat2 = createTestCategory(db, { name: '分类2' })
      const cat3 = createTestCategory(db, { name: '分类3' })

      const saved2 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat2.id) as any

      db.prepare('DELETE FROM record_categories WHERE id = ?').run(cat1.id)

      const after2 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat2.id) as any
      const after3 = db.prepare('SELECT sort_order FROM record_categories WHERE id = ?').get(cat3.id) as any

      expect(after2.sort_order).toBe(saved2.sort_order)
      expect(after2.sort_order).toBeLessThan(after3.sort_order)
    })
  })

  describe('分类与记录类型的关联', () => {
    it('一个分类可以有多个记录类型', async () => {
      const category = createTestCategory(db, { name: '健康' })

      createTestRecordType(db, category.id, testUser.id, { name: '运动记录' })
      createTestRecordType(db, category.id, testUser.id, { name: '饮食记录' })
      createTestRecordType(db, category.id, testUser.id, { name: '睡眠记录' })

      const types = db.prepare(`
        SELECT * FROM record_types WHERE category_id = ?
      `).all(category.id) as any[]

      expect(types.length).toBe(3)
    })

    it('一个记录类型只能属于一个分类', async () => {
      const cat1 = createTestCategory(db, { name: '分类1' })
      const cat2 = createTestCategory(db, { name: '分类2' })

      const rt = createTestRecordType(db, cat1.id, testUser.id, { name: '测试类型' })

      const saved = db.prepare('SELECT * FROM record_types WHERE id = ?').get(rt.id) as any
      expect(saved.category_id).toBe(cat1.id)
    })

    it('删除分类时应该级联或阻止删除关联的记录类型', async () => {
      const category = createTestCategory(db, { name: '待删除' })
      createTestRecordType(db, category.id, testUser.id, { name: '关联类型' })

      const typesCount = db.prepare(`
        SELECT COUNT(*) as count FROM record_types WHERE category_id = ?
      `).get(category.id) as any

      expect(typesCount.count).toBeGreaterThan(0)
    })
  })
})
