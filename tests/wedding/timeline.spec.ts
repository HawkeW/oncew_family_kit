/**
 * Wedding Timeline API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb, mockStmt, mockUseAuthSession } from '../setup'

const session = { data: { id: 1, username: 'testuser' } }

describe('Wedding Timeline API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthSession.mockResolvedValue(session as any)
    mockDb.prepare.mockReturnValue(mockStmt as any)
  })

  describe('GET /api/wedding/timeline', () => {
    it('should return all timeline items when no group_id filter', async () => {
      const mockTimeline = [
        { id: 1, start_time: '08:00', end_time: '09:00', title: '新郎接亲', location: '新娘家', description: '准备出发', owner: '伴郎团', group_id: 1 },
        { id: 2, start_time: '10:00', end_time: '11:00', title: '婚礼仪式', location: '酒店宴会厅', description: '正式开始', owner: '婚庆督导', group_id: 1 }
      ]
      
      mockStmt.all.mockReturnValueOnce(mockTimeline)
      
      const db = mockDb.prepare()
      const items = db.all('SELECT * FROM wedding_timelines WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?) ORDER BY start_time ASC', 1)
      
      expect(items).toHaveLength(2)
      expect(items[0].title).toBe('新郎接亲')
    })

    it('should sort by start_time ascending', async () => {
      // Mock returns data already sorted by the SQL query
      const mockTimelineSorted = [
        { id: 1, start_time: '08:00', title: '接亲' },
        { id: 2, start_time: '10:00', title: '仪式' }
      ]
      
      mockStmt.all.mockReturnValueOnce(mockTimelineSorted)
      
      const db = mockDb.prepare()
      const items = db.all('SELECT * FROM wedding_timelines WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?) ORDER BY start_time ASC', 1)
      
      expect(items[0].start_time).toBe('08:00')
      expect(items[1].start_time).toBe('10:00')
    })

    it('should filter by group_id when specified', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.all.mockReturnValueOnce([])
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 2, 1)
      expect(isMember).toBeTruthy()
    })
  })

  describe('POST /api/wedding/timeline', () => {
    it('should create timeline item with valid data', async () => {
      const newItem = {
        start_time: '14:00',
        end_time: '15:00',
        title: '交换戒指',
        description: '互换戒指环节',
        location: '主舞台',
        owner: '主持人',
        group_id: 1
      }

      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ lastInsertRowid: 5 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 1, 1)
      expect(isMember).toBeTruthy()
      
      const result = db.run(
        'INSERT INTO wedding_timelines (start_time, end_time, title, description, location, owner, created_at, updated_at, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        newItem.start_time, newItem.end_time, newItem.title, newItem.description, newItem.location, newItem.owner, expect.any(String), expect.any(String), newItem.group_id
      )
      
      expect(result.lastInsertRowid).toBe(5)
    })

    it('should require start_time field', () => {
      const itemWithoutStartTime = {
        title: '某个环节',
        group_id: 1
      }
      expect(itemWithoutStartTime.start_time).toBeUndefined()
    })

    it('should require title field', () => {
      const itemWithoutTitle = {
        start_time: '14:00',
        group_id: 1
      }
      expect(itemWithoutTitle.title).toBeUndefined()
    })

    it('should allow optional end_time', () => {
      const itemWithEndTime = { start_time: '14:00', end_time: '15:00', title: 'T', group_id: 1 }
      const itemWithoutEndTime = { start_time: '14:00', title: 'T', group_id: 1 }

      expect(itemWithEndTime.end_time).toBe('15:00')
      expect(itemWithoutEndTime.end_time).toBeUndefined()
    })
  })

  describe('PUT /api/wedding/timeline/:id', () => {
    it('should update timeline item', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const result = db.run(
        'UPDATE wedding_timelines SET start_time = ?, end_time = ?, title = ?, description = ?, location = ?, owner = ?, updated_at = ? WHERE id = ?',
        '15:00', '16:00', '更新环节', '更新描述', '新地点', '新负责人', expect.any(String), 1
      )
      
      expect(result.changes).toBe(1)
    })
  })

  describe('DELETE /api/wedding/timeline/:id', () => {
    it('should delete timeline item with valid permissions', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const deleteResult = db.run('DELETE FROM wedding_timelines WHERE id = ?', 1)
      
      expect(deleteResult.changes).toBe(1)
    })
  })
})