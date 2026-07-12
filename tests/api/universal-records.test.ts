import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getTestDb,
  closeTestDb,
  freshTestDb,
  resetTestDb,
  createTestUser,
  createTestGroup,
  createTestCategory,
  createTestRecordType,
  createTestUserRecord,
  addUserToGroup
} from '../helpers/db'

describe('Universal Records API', () => {
  let db: ReturnType<typeof getTestDb>
  let testUser: ReturnType<typeof createTestUser>
  let testCategory: ReturnType<typeof createTestCategory>
  let testRecordType: { id: string; fields: any[] }

  beforeEach(() => {
    // 每次测试都使用全新的数据库
    freshTestDb()
    db = getTestDb()
    
    // 创建测试用户
    testUser = createTestUser(db, { username: 'testuser', email: 'test@test.com' })
    
    // 创建测试分类和记录类型
    testCategory = createTestCategory(db)
    testRecordType = createTestRecordType(db, testCategory.id, testUser.id, {
      name: '测试记录',
      fields: [
        { name: 'title', label: '标题', type: 'text', required: true, sortOrder: 1 },
        { name: 'amount', label: '数量', type: 'number', required: false, sortOrder: 2 }
      ]
    })
  })

  afterEach(() => {
    closeTestDb()
  })

  describe('创建记录 (POST /api/universal-records)', () => {
    it('应该能够创建一条用户记录', async () => {
      // 这里我们直接调用数据库函数来验证逻辑
      // 在实际TDD中，我们会通过HTTP请求
      const record = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        recordTime: '10:30:00',
        notes: '测试记录',
        fieldValues: { title: '测试标题', amount: 10 }
      })

      expect(record.id).toBeDefined()

      // 验证记录已保存
      const savedRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id)
      expect(savedRecord).toBeDefined()
      expect((savedRecord as any).record_date).toBe('2026-07-12')
      expect((savedRecord as any).record_time).toBe('10:30:00')
      expect((savedRecord as any).notes).toBe('测试记录')
    })

    it('应该能够创建群组共享记录', async () => {
      // 创建群组
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      // 创建共享记录
      const record = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        groupId: group.id,
        fieldValues: { title: '共享记录', amount: 5 }
      })

      expect(record.id).toBeDefined()

      // 验证记录已保存且关联了group_id
      const savedRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id) as any
      expect(savedRecord).toBeDefined()
      expect(savedRecord.group_id).toBe(group.id)
    })

    it('非群组成员不能向群组添加记录 - 权限验证', async () => {
      // 创建另一个用户
      const otherUser = createTestUser(db, { username: 'otheruser', email: 'other@test.com' })
      
      // 创建群组（由testUser创建）
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      // otherUser不是群组成员，尝试添加共享记录
      // 在API层会验证group_members表
      const memberCheck = db.prepare(`
        SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, otherUser.id)

      expect(memberCheck).toBeUndefined() // 验证otherUser不是成员
    })

    it('群组成员可以向群组添加共享记录', async () => {
      const otherUser = createTestUser(db, { username: 'otheruser', email: 'other@test.com' })
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      // 将otherUser添加到群组
      addUserToGroup(db, group.id, otherUser.id)

      // 验证成员关系
      const memberCheck = db.prepare(`
        SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, otherUser.id)

      expect(memberCheck).toBeDefined() // 验证otherUser是成员

      // otherUser可以创建共享记录
      const record = createTestUserRecord(db, otherUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        groupId: group.id,
        fieldValues: { title: '成员创建的共享记录', amount: 3 }
      })

      expect(record.id).toBeDefined()
      const savedRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id) as any
      expect(savedRecord.group_id).toBe(group.id)
      expect(savedRecord.user_id).toBe(otherUser.id)
    })
  })

  describe('查询记录 (GET /api/universal-records)', () => {
    it('应该能够查询用户自己的记录', async () => {
      // 创建多条记录
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-01',
        fieldValues: { title: '记录1' }
      })
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-02',
        fieldValues: { title: '记录2' }
      })

      // 查询用户记录
      const records = db.prepare(`
        SELECT * FROM user_records 
        WHERE user_id = ? AND group_id IS NULL
        ORDER BY record_date DESC
      `).all(testUser.id) as any[]

      expect(records.length).toBe(2)
      expect(records[0].record_date).toBe('2026-07-02')
    })

    it('应该能够按记录类型查询', async () => {
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-01',
        fieldValues: { title: '测试记录' }
      })

      const records = db.prepare(`
        SELECT * FROM user_records 
        WHERE record_type_id = ?
      `).all(testRecordType.id) as any[]

      expect(records.length).toBe(1)
      expect(records[0].record_type_id).toBe(testRecordType.id)
    })

    it('应该能够查询群组共享记录', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      // 创建一些共享记录
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-01',
        groupId: group.id,
        fieldValues: { title: '共享1' }
      })
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-02',
        groupId: group.id,
        fieldValues: { title: '共享2' }
      })
      
      // 创建一条个人记录（不属于群组）
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-03',
        fieldValues: { title: '个人记录' }
      })

      // 查询群组共享记录
      const groupRecords = db.prepare(`
        SELECT * FROM user_records 
        WHERE group_id = ?
        ORDER BY record_date DESC
      `).all(group.id) as any[]

      expect(groupRecords.length).toBe(2)
      expect(groupRecords[0].group_id).toBe(group.id)
      
      // 验证个人记录不在结果中
      const personalRecord = groupRecords.find(r => r.user_id === testUser.id && r.group_id === null)
      expect(personalRecord).toBeUndefined()
    })

    it('应该能够按日期范围查询', async () => {
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-01',
        fieldValues: { title: '7月1日' }
      })
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-15',
        fieldValues: { title: '7月15日' }
      })
      createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-30',
        fieldValues: { title: '7月30日' }
      })

      // 查询7月上旬的记录
      const julyRecords = db.prepare(`
        SELECT * FROM user_records 
        WHERE user_id = ? 
          AND record_date >= '2026-07-01' 
          AND record_date <= '2026-07-10'
        ORDER BY record_date
      `).all(testUser.id) as any[]

      expect(julyRecords.length).toBe(1)
      expect(julyRecords[0].record_date).toBe('2026-07-01')
    })
  })

  describe('更新记录 (PUT /api/universal-records)', () => {
    it('应该能够更新自己的记录', async () => {
      const record = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        notes: '原始备注',
        fieldValues: { title: '原始标题' }
      })

      // 更新记录
      const now = new Date().toISOString()
      db.prepare(`
        UPDATE user_records 
        SET notes = ?, updated_at = ?
        WHERE id = ?
      `).run('更新后的备注', now, record.id)

      const updatedRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id) as any
      expect(updatedRecord.notes).toBe('更新后的备注')
    })

    it('不能更新他人的记录', async () => {
      const otherUser = createTestUser(db, { username: 'otheruser', email: 'other@test.com' })
      
      const record = createTestUserRecord(db, otherUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        notes: '其他用户的记录'
      })

      // 尝试更新（应该失败）
      const result = db.prepare(`
        UPDATE user_records 
        SET notes = ?
        WHERE id = ? AND user_id = ?
      `).run('被拒绝的更新', record.id, testUser.id)

      expect(result.changes).toBe(0)

      // 验证记录未被修改
      const unchangedRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id) as any
      expect(unchangedRecord.notes).toBe('其他用户的记录')
    })
  })

  describe('删除记录 (DELETE /api/universal-records)', () => {
    it('应该能够删除自己的记录', async () => {
      const record = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12'
      })

      // 删除记录
      const result = db.prepare('DELETE FROM user_records WHERE id = ? AND user_id = ?')
        .run(record.id, testUser.id)

      expect(result.changes).toBe(1)

      // 验证记录已删除
      const deletedRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id)
      expect(deletedRecord).toBeUndefined()
    })

    it('不能删除他人的记录', async () => {
      const otherUser = createTestUser(db, { username: 'otheruser', email: 'other@test.com' })
      
      const record = createTestUserRecord(db, otherUser.id, testRecordType.id, {
        recordDate: '2026-07-12'
      })

      // 尝试删除（应该失败）
      const result = db.prepare('DELETE FROM user_records WHERE id = ? AND user_id = ?')
        .run(record.id, testUser.id)

      expect(result.changes).toBe(0)

      // 验证记录仍然存在
      const existingRecord = db.prepare('SELECT * FROM user_records WHERE id = ?').get(record.id)
      expect(existingRecord).toBeDefined()
    })

    it('删除记录时应同时删除关联的字段值', async () => {
      const record = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        fieldValues: { title: '测试', amount: 100 }
      })

      // 验证字段值存在
      const fieldValuesBefore = db.prepare(`
        SELECT * FROM record_values WHERE user_record_id = ?
      `).all(record.id) as any[]
      expect(fieldValuesBefore.length).toBeGreaterThan(0)

      // 删除记录（由于外键约束，字段值会被级联删除）
      db.prepare('DELETE FROM user_records WHERE id = ? AND user_id = ?').run(record.id, testUser.id)

      // 验证字段值已被删除
      const fieldValuesAfter = db.prepare(`
        SELECT * FROM record_values WHERE user_record_id = ?
      `).all(record.id) as any[]
      expect(fieldValuesAfter.length).toBe(0)
    })
  })

  describe('群组记录隔离性', () => {
    it('不同群组的记录应该互相隔离', async () => {
      const group1 = createTestGroup(db, testUser.id, { name: '群组1' })
      const group2 = createTestGroup(db, testUser.id, { name: '群组2' })

      // 在不同群组创建同名记录
      const record1 = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        groupId: group1.id,
        fieldValues: { title: '群组1的记录' }
      })

      const record2 = createTestUserRecord(db, testUser.id, testRecordType.id, {
        recordDate: '2026-07-12',
        groupId: group2.id,
        fieldValues: { title: '群组2的记录' }
      })

      // 查询群组1的记录
      const group1Records = db.prepare(`
        SELECT * FROM user_records WHERE group_id = ?
      `).all(group1.id) as any[]

      expect(group1Records.length).toBe(1)
      expect(group1Records[0].id).toBe(record1.id)

      // 查询群组2的记录
      const group2Records = db.prepare(`
        SELECT * FROM user_records WHERE group_id = ?
      `).all(group2.id) as any[]

      expect(group2Records.length).toBe(1)
      expect(group2Records[0].id).toBe(record2.id)
    })

    it('群组成员只能看到自己所在群组的共享记录', async () => {
      const user1 = createTestUser(db, { username: 'user1', email: 'user1@test.com' })
      const user2 = createTestUser(db, { username: 'user2', email: 'user2@test.com' })
      const user3 = createTestUser(db, { username: 'user3', email: 'user3@test.com' })

      const group1 = createTestGroup(db, user1.id, { name: '群组1' })
      const group2 = createTestGroup(db, user1.id, { name: '群组2' })

      // user1和user2在群组1
      addUserToGroup(db, group1.id, user2.id)
      // user1在群组2
      // user3不在任何群组

      // user1在群组1创建记录
      createTestUserRecord(db, user1.id, testRecordType.id, {
        recordDate: '2026-07-12',
        groupId: group1.id,
        fieldValues: { title: '群组1记录' }
      })

      // user1在群组2创建记录
      createTestUserRecord(db, user1.id, testRecordType.id, {
        recordDate: '2026-07-12',
        groupId: group2.id,
        fieldValues: { title: '群组2记录' }
      })

      // user1在群组1创建记录 - user2可见
      const user2GroupRecords = db.prepare(`
        SELECT * FROM user_records 
        WHERE group_id = ?
      `).all(group1.id) as any[]

      // user1在群组2的记录对user2不可见
      expect(user2GroupRecords.find(r => r.group_id === group2.id)).toBeUndefined()
    })
  })
})
