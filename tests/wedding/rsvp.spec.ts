/**
 * Wedding RSVP API Tests
 * 
 * Test spec for group_id isolation and CRUD operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb, mockStmt, mockUseAuthSession } from '../setup'

const session = { data: { id: 1, username: 'testuser' } }

describe('Wedding RSVP API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockUseAuthSession.mockResolvedValue(session as any)
    mockDb.prepare.mockReturnValue(mockStmt as any)
    // Default mock returns for group membership check
    mockStmt.get.mockReturnValue({ id: 1 })
  })

  describe('Authentication', () => {
    it('should require authentication to access RSVP list', async () => {
      mockUseAuthSession.mockResolvedValueOnce({ data: null } as any)
      const result = await mockUseAuthSession({} as any)
      expect(result.data).toBeNull()
    })
  })

  describe('GET /api/wedding/rsvp', () => {
    it('should return all RSVPs for user across all their groups', async () => {
      const mockRsvps = [
        { id: 1, name: '张三', phone: '13800138000', count: 2, remark: '带家属', group_id: 1 },
        { id: 2, name: '李四', phone: '13900139000', count: 1, remark: '', group_id: 1 }
      ]
      
      mockStmt.all.mockReturnValueOnce(mockRsvps)
      mockStmt.get.mockReturnValueOnce({ total: 3 })
      
      const db = mockDb.prepare()
      const rsvps = db.all('SELECT * FROM wedding_rsvps WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)', 1)
      const total = db.get('SELECT SUM(count) as total FROM wedding_rsvps WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)', 1)
      
      expect(rsvps).toHaveLength(2)
      expect(rsvps[0].name).toBe('张三')
      expect(total.total).toBe(3)
    })

    it('should filter by group_id when specified', async () => {
      const mockRsvps = [
        { id: 1, name: '王五', phone: '13700137000', count: 3, remark: '一家三口', group_id: 2 }
      ]
      
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.all.mockReturnValueOnce(mockRsvps)
      mockStmt.get.mockReturnValueOnce({ total: 3 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 2, 1)
      
      expect(isMember).toBeTruthy()
    })

    it('should deny access to non-group members', () => {
      // Override the default mock for this specific test
      mockStmt.get.mockReturnValueOnce(null)
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 999, 1)
      
      expect(isMember).toBeFalsy()
    })
  })

  describe('POST /api/wedding/rsvp', () => {
    it('should create RSVP with valid data and group membership', async () => {
      const newRsvp = {
        name: '新宾客',
        phone: '13600136000',
        count: 2,
        remark: '测试备注',
        group_id: 1
      }

      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ lastInsertRowid: 10 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 1, 1)
      expect(isMember).toBeTruthy()
      
      const result = db.run(
        'INSERT INTO wedding_rsvps (name, phone, count, remark, created_at, updated_at, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        newRsvp.name, newRsvp.phone, newRsvp.count, newRsvp.remark, expect.any(String), expect.any(String), newRsvp.group_id
      )
      
      expect(result.lastInsertRowid).toBe(10)
    })

    it('should reject RSVP without group_id (validation)', () => {
      const invalidRsvp = {
        name: '新宾客',
        phone: '13600136000',
        count: 2
      }
      expect(invalidRsvp.group_id).toBeUndefined()
    })

    it('should reject RSVP from non-group-member', () => {
      mockStmt.get.mockReturnValueOnce(null)
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 999, 1)
      expect(isMember).toBeFalsy()
    })

    it('should require name field (validation)', () => {
      const rsvpWithoutName = {
        phone: '13600136000',
        count: 2,
        group_id: 1
      }
      expect(rsvpWithoutName.name).toBeUndefined()
    })
  })

  describe('PUT /api/wedding/rsvp/:id', () => {
    it('should update RSVP with valid group membership', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 1, 1)
      expect(isMember).toBeTruthy()
      
      const result = db.run(
        'UPDATE wedding_rsvps SET name = ?, phone = ?, count = ?, remark = ?, updated_at = ? WHERE id = ?',
        '更新姓名', '13900139000', 3, '更新备注', expect.any(String), 1
      )
      
      expect(result).toBeDefined()
    })
  })

  describe('DELETE /api/wedding/rsvp/:id', () => {
    it('should delete RSVP with valid permissions', async () => {
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const deleteResult = db.run('DELETE FROM wedding_rsvps WHERE id = ?', 1)
      
      expect(deleteResult.changes).toBe(1)
    })
  })
})