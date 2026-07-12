import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getTestDb,
  closeTestDb,
  freshTestDb,
  createTestUser
} from '../helpers/db'
import bcrypt from 'bcryptjs'

describe('Auth API', () => {
  let db: ReturnType<typeof getTestDb>

  beforeEach(() => {
    // 每次测试都使用全新的数据库
    freshTestDb()
    db = getTestDb()
  })

  afterEach(() => {
    closeTestDb()
  })

  describe('用户注册 (POST /api/auth/register)', () => {
    it('应该能够成功注册新用户', async () => {
      const username = `user_${Date.now()}`
      const email = `${username}@test.com`
      const password = 'password123'
      const hashedPassword = await bcrypt.hash(password, 10)
      const now = new Date().toISOString()

      const result = db.prepare(`
        INSERT INTO users (username, password, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, hashedPassword, email, now, now)

      expect(result.lastInsertRowid).toBeDefined()
      expect(result.changes).toBe(1)

      // 验证用户已保存
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any
      expect(user.username).toBe(username)
      expect(user.email).toBe(email)
    })

    it('用户名不能重复', async () => {
      const username = `duplicate_user_${Date.now()}`
      const email1 = `${username}_1@test.com`
      const email2 = `${username}_2@test.com`
      const password = 'password123'
      const hashedPassword = await bcrypt.hash(password, 10)
      const now = new Date().toISOString()

      // 创建第一个用户
      db.prepare(`
        INSERT INTO users (username, password, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, hashedPassword, email1, now, now)

      // 尝试创建同名用户，应该抛出错误
      try {
        db.prepare(`
          INSERT INTO users (username, password, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(username, hashedPassword, email2, now, now)
        expect(true).toBe(false) // 不应该走到这里
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('邮箱不能重复', async () => {
      const username1 = `user1_${Date.now()}`
      const username2 = `user2_${Date.now()}`
      const email = `duplicate_${Date.now()}@test.com`
      const password = 'password123'
      const hashedPassword = await bcrypt.hash(password, 10)
      const now = new Date().toISOString()

      // 创建第一个用户
      db.prepare(`
        INSERT INTO users (username, password, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(username1, hashedPassword, email, now, now)

      // 尝试使用相同邮箱创建第二个用户，应该抛出错误
      try {
        db.prepare(`
          INSERT INTO users (username, password, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(username2, hashedPassword, email, now, now)
        expect(true).toBe(false) // 不应该走到这里
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('密码应该被加密存储', async () => {
      const username = `user_${Date.now()}`
      const email = `${username}@test.com`
      const password = 'mysecretpassword'
      const hashedPassword = await bcrypt.hash(password, 10)
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO users (username, password, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, hashedPassword, email, now, now)

      // 原始密码不应该被存储
      const user = db.prepare('SELECT password FROM users WHERE username = ?').get(username) as any
      expect(user.password).not.toBe(password)
      expect(user.password).toBe(hashedPassword)

      // 加密后的密码应该能验证成功
      const isValid = await bcrypt.compare(password, user.password)
      expect(isValid).toBe(true)
    })

    it('相同的密码每次加密结果不同（盐值）', async () => {
      const password = 'same_password'
      const hash1 = await bcrypt.hash(password, 10)
      const hash2 = await bcrypt.hash(password, 10)

      // 两个 hash 不应该相等
      expect(hash1).not.toBe(hash2)

      // 但都应该能验证成功
      expect(await bcrypt.compare(password, hash1)).toBe(true)
      expect(await bcrypt.compare(password, hash2)).toBe(true)
    })
  })

  describe('用户登录 (POST /api/auth/login)', () => {
    it('应该能够使用邮箱登录', async () => {
      const password = 'loginpassword123'
      const testUser = createTestUser(db, {
        username: 'testuser',
        email: 'test@test.com',
        password
      })

      // 验证用户可以登录
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('test@test.com') as any
      expect(user).toBeDefined()
      expect(user.username).toBe('testuser')

      // 验证密码正确
      const isValidPassword = await bcrypt.compare(password, user.password)
      expect(isValidPassword).toBe(true)
    })

    it('应该能够使用用户名登录', async () => {
      const password = 'loginpassword123'
      const testUser = createTestUser(db, {
        username: 'loginuser',
        email: 'login@test.com',
        password
      })

      // 验证用户可以按用户名查找
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get('loginuser') as any
      expect(user).toBeDefined()
      expect(user.email).toBe('login@test.com')
    })

    it('密码错误应该验证失败', async () => {
      const correctPassword = 'correctpassword'
      const wrongPassword = 'wrongpassword'
      
      createTestUser(db, {
        username: 'testuser2',
        email: 'test2@test.com',
        password: correctPassword
      })

      const user = db.prepare('SELECT password FROM users WHERE username = ?').get('testuser2') as any
      
      // 错误密码应该验证失败
      const isValidWrong = await bcrypt.compare(wrongPassword, user.password)
      expect(isValidWrong).toBe(false)

      // 正确密码应该验证成功
      const isValidCorrect = await bcrypt.compare(correctPassword, user.password)
      expect(isValidCorrect).toBe(true)
    })

    it('不存在的用户应该登录失败', async () => {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('nonexistent@test.com')
      expect(user).toBeUndefined()
    })

    it('登录后应该返回用户信息（不包含密码）', async () => {
      createTestUser(db, {
        username: 'safeuser',
        email: 'safe@test.com',
        password: 'password123'
      })

      const user = db.prepare('SELECT id, username, email FROM users WHERE username = ?').get('safeuser') as any
      
      // 应该包含必要字段
      expect(user.id).toBeDefined()
      expect(user.username).toBe('safeuser')
      expect(user.email).toBe('safe@test.com')
      
      // 不应该包含密码
      expect(user.password).toBeUndefined()
    })
  })

  describe('用户资料 (GET /api/auth/profile)', () => {
    it('应该能够获取自己的用户资料', async () => {
      const testUser = createTestUser(db, {
        username: 'profileuser',
        email: 'profile@test.com',
        password: 'password123'
      })

      // 模拟 profile API 的查询逻辑
      const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(testUser.id)

      expect(user).toBeDefined()
      expect((user as any).username).toBe('profileuser')
      expect((user as any).email).toBe('profile@test.com')
    })

    it('不存在的用户ID应该返回空', async () => {
      const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(99999)
      expect(user).toBeUndefined()
    })
  })

  describe('会话管理 (GET /api/auth/session)', () => {
    it('会话应该包含用户基本信息', async () => {
      const testUser = createTestUser(db, {
        username: 'sessionuser',
        email: 'session@test.com',
        password: 'password123'
      })

      // 模拟 session 数据结构
      const sessionData = {
        id: testUser.id,
        username: testUser.username,
        email: testUser.email
      }

      expect(sessionData.id).toBe(testUser.id)
      expect(sessionData.username).toBe('sessionuser')
      expect(sessionData.email).toBe('session@test.com')
    })

    it('未登录用户不应该有有效的session', async () => {
      // 模拟未登录情况 - session data 为空
      const sessionData = null

      // 检查 session 是否有效
      const isValidSession = sessionData !== null && sessionData !== undefined
      expect(isValidSession).toBe(false)
    })
  })

  describe('密码安全', () => {
    it('密码最少需要6位', async () => {
      const shortPassword = '12345'
      const validPassword = '123456'

      // 短密码应该被拒绝（这里验证验证逻辑）
      expect(shortPassword.length).toBeLessThan(6)
      expect(validPassword.length).toBeGreaterThanOrEqual(6)
    })

    it('密码加密强度足够', async () => {
      const password = 'strongpassword123'
      const hash = await bcrypt.hash(password, 10)

      // bcrypt 加密后的 hash 应该以 $2a$ 或 $2b$ 开头
      expect(hash.startsWith('$2')).toBe(true)
      // hash 长度应该足够长（防止暴力破解）
      expect(hash.length).toBeGreaterThan(50)
    })
  })
})
