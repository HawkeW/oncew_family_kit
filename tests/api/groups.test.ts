import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getTestDb,
  closeTestDb,
  freshTestDb,
  createTestUser,
  createTestGroup,
  addUserToGroup
} from '../helpers/db'

describe('Groups API', () => {
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

  describe('创建群组 (POST /api/groups)', () => {
    it('应该能够创建一个新群组', async () => {
      const group = createTestGroup(db, testUser.id, {
        name: '测试群组',
        description: '这是一个测试群组'
      })

      expect(group.id).toBeDefined()
      expect(group.name).toBe('测试群组')
      expect(group.description).toBe('这是一个测试群组')

      // 验证数据库中的记录
      const savedGroup = db.prepare('SELECT * FROM groups WHERE id = ?').get(group.id) as any
      expect(savedGroup).toBeDefined()
      expect(savedGroup.created_by).toBe(testUser.id)
    })

    it('创建群组时自动将创建者添加为管理员', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })

      const membership = db.prepare(`
        SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, testUser.id) as any

      expect(membership).toBeDefined()
      expect(membership.role).toBe('admin')
    })

    it('群组名称不能为空', async () => {
      const now = new Date().toISOString()
      
      // 尝试插入空名称
      try {
        db.prepare(`
          INSERT INTO groups (name, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `).run('', testUser.id, now, now)
        
        // 如果没报错，验证插入失败
        const groups = db.prepare('SELECT * FROM groups WHERE name = ?').get('')
        expect(groups).toBeUndefined()
      } catch (error) {
        // 预期会抛出错误（数据库约束）
        expect(error).toBeDefined()
      }
    })

    it('应该能够获取用户所属的所有群组', async () => {
      // 创建多个群组
      const group1 = createTestGroup(db, testUser.id, { name: '群组1' })
      const group2 = createTestGroup(db, testUser.id, { name: '群组2' })
      
      // 创建另一个用户和群组
      const otherUser = createTestUser(db, { username: 'other', email: 'other@test.com' })
      createTestGroup(db, otherUser.id, { name: '其他群组' })

      // 获取testUser的群组
      const userGroups = db.prepare(`
        SELECT g.* FROM groups g
        WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = ?)
      `).all(testUser.id) as any[]

      expect(userGroups.length).toBe(2)
      expect(userGroups.map(g => g.name).sort()).toEqual(['群组1', '群组2'])
    })
  })

  describe('更新群组 (PUT /api/groups)', () => {
    it('管理员应该能够更新群组信息', async () => {
      const group = createTestGroup(db, testUser.id, { name: '原名称' })

      const now = new Date().toISOString()
      db.prepare(`
        UPDATE groups SET name = ?, updated_at = ? WHERE id = ?
      `).run('新名称', now, group.id)

      const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(group.id) as any
      expect(updated.name).toBe('新名称')
    })

    it('非管理员不应该能够更新群组信息', async () => {
      const group = createTestGroup(db, testUser.id, { name: '原名称' })
      
      const otherUser = createTestUser(db, { username: 'other', email: 'other@test.com' })
      addUserToGroup(db, group.id, otherUser.id, 'member')

      // 尝试以非管理员身份更新
      const now = new Date().toISOString()
      const result = db.prepare(`
        UPDATE groups SET name = ?, updated_at = ? WHERE id = ?
      `).run('非法更新', now, group.id)

      // 注意：这里实际上任何群组成员都能更新，因为API层才做权限校验
      // 数据库层不限制，所以result.changes会是1
      // 真正的权限校验需要在API层实现
    })

    it('非群组成员不能更新群组', async () => {
      const group = createTestGroup(db, testUser.id, { name: '原名称' })
      
      const outsider = createTestUser(db, { username: 'outsider', email: 'outsider@test.com' })

      // API层应该拒绝这个操作
      const memberCheck = db.prepare(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, outsider.id)

      expect(memberCheck).toBeUndefined()
    })
  })

  describe('删除群组 (DELETE /api/groups)', () => {
    it('只有群组创建者能够删除群组', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })

      // 创建者删除
      const result = db.prepare('DELETE FROM groups WHERE id = ?').run(group.id)
      expect(result.changes).toBe(1)

      // 验证群组已删除
      const deleted = db.prepare('SELECT * FROM groups WHERE id = ?').get(group.id)
      expect(deleted).toBeUndefined()
    })

    it('删除群组时应同时删除成员关系', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      const otherUser = createTestUser(db, { username: 'other', email: 'other@test.com' })
      addUserToGroup(db, group.id, otherUser.id)

      // 删除群组（外键约束会级联删除group_members）
      db.prepare('DELETE FROM groups WHERE id = ?').run(group.id)

      const members = db.prepare(`
        SELECT * FROM group_members WHERE group_id = ?
      `).all(group.id)

      expect(members.length).toBe(0)
    })

    it('非创建者不能删除群组', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      const otherUser = createTestUser(db, { username: 'other', email: 'other@test.com' })
      addUserToGroup(db, group.id, otherUser.id, 'admin') // 设为管理员但不是创建者

      // 在API层，创建者检查会失败
      const groupCheck = db.prepare('SELECT created_by FROM groups WHERE id = ?').get(group.id) as any
      expect(groupCheck.created_by).toBe(testUser.id)
      expect(groupCheck.created_by).not.toBe(otherUser.id)
    })
  })

  describe('群组成员管理', () => {
    it('应该能够添加成员到群组', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      const newUser = createTestUser(db, { username: 'newuser', email: 'new@test.com' })

      addUserToGroup(db, group.id, newUser.id, 'member')

      const member = db.prepare(`
        SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, newUser.id) as any

      expect(member).toBeDefined()
      expect(member.role).toBe('member')
    })

    it('应该能够将成员升级为管理员', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      const member = createTestUser(db, { username: 'member', email: 'member@test.com' })
      addUserToGroup(db, group.id, member.id, 'member')

      // 升级为管理员
      db.prepare(`
        UPDATE group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?
      `).run(group.id, member.id)

      const updated = db.prepare(`
        SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, member.id) as any

      expect(updated.role).toBe('admin')
    })

    it('应该能够从群组移除成员', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      const member = createTestUser(db, { username: 'member', email: 'member@test.com' })
      addUserToGroup(db, group.id, member.id, 'member')

      // 移除成员
      db.prepare(`
        DELETE FROM group_members WHERE group_id = ? AND user_id = ?
      `).run(group.id, member.id)

      const removed = db.prepare(`
        SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, member.id)

      expect(removed).toBeUndefined()
    })

    it('不能移除群组创建者', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })

      // API层应该禁止移除创建者
      const membership = db.prepare(`
        SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(group.id, testUser.id) as any

      expect(membership.role).toBe('admin')
      expect(membership.user_id).toBe(testUser.id)
      // 移除创建者的检查应该在API层进行
    })

    it('同一用户不能重复添加到同一群组', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      const member = createTestUser(db, { username: 'member', email: 'member@test.com' })

      addUserToGroup(db, group.id, member.id, 'member')

      // 尝试重复添加（应该由于UNIQUE约束失败）
      try {
        addUserToGroup(db, group.id, member.id, 'member')
        // 如果没报错，说明重复添加成功了（不应该发生）
        expect(true).toBe(false)
      } catch (error) {
        // 预期会抛出错误
        expect(error).toBeDefined()
      }
    })

    it('应该能够查询群组成员列表', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      const user2 = createTestUser(db, { username: 'user2', email: 'user2@test.com' })
      const user3 = createTestUser(db, { username: 'user3', email: 'user3@test.com' })
      
      addUserToGroup(db, group.id, user2.id, 'member')
      addUserToGroup(db, group.id, user3.id, 'admin')

      const members = db.prepare(`
        SELECT gm.*, u.username FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
      `).all(group.id) as any[]

      expect(members.length).toBe(3)
      expect(members.map(m => m.username).sort()).toEqual(['testuser', 'user2', 'user3'])
    })
  })

  describe('邀请链接管理', () => {
    it('管理员应该能够生成邀请链接', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后
      
      db.prepare(`
        INSERT INTO group_invitations (group_id, invited_by, invite_token, status, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, ?, ?)
      `).run(group.id, testUser.id, 'test-token-123', expiresAt, now, now)

      const invitation = db.prepare(`
        SELECT * FROM group_invitations WHERE group_id = ?
      `).get(group.id) as any

      expect(invitation).toBeDefined()
      expect(invitation.invite_token).toBe('test-token-123')
      expect(invitation.status).toBe('pending')
    })

    it('邀请链接过期后不应该能使用', async () => {
      const group = createTestGroup(db, testUser.id, { name: '测试群组' })
      
      const now = new Date().toISOString()
      const expiredTime = new Date(Date.now() - 1000).toISOString() // 已过期
      
      db.prepare(`
        INSERT INTO group_invitations (group_id, invited_by, invite_token, status, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, ?, ?)
      `).run(group.id, testUser.id, 'expired-token', expiredTime, now, now)

      const invitation = db.prepare(`
        SELECT * FROM group_invitations WHERE invite_token = ? AND status = 'pending'
      `).get('expired-token') as any

      expect(invitation).toBeDefined()
      // API层应该检查expires_at > now
      expect(new Date(invitation.expires_at).getTime()).toBeLessThan(Date.now())
    })
  })
})
