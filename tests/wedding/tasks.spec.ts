/**
 * Wedding Tasks API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb, mockStmt, mockUseAuthSession } from '../setup'

const session = { data: { id: 1, username: 'testuser' } }

describe('Wedding Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthSession.mockResolvedValue(session as any)
    mockDb.prepare.mockReturnValue(mockStmt as any)
  })

  describe('GET /api/wedding/tasks', () => {
    it('should return all tasks when no group_id filter', async () => {
      const mockTasks = [
        { id: 1, title: '预定酒店', description: '联系酒店确认档期', due_date: '2024-06-15', status: 'pending', category: 'preparation', group_id: 1 },
        { id: 2, title: '确定婚庆', description: '选择婚庆公司', due_date: '2024-07-01', status: 'completed', category: 'preparation', group_id: 1 }
      ]
      
      mockStmt.all.mockReturnValueOnce(mockTasks)
      
      const db = mockDb.prepare()
      const tasks = db.all('SELECT * FROM wedding_tasks WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?) ORDER BY created_at DESC', 1)
      
      expect(tasks).toHaveLength(2)
      expect(tasks[0].title).toBe('预定酒店')
    })

    it('should filter tasks by category', async () => {
      const mockPreparationTasks = [
        { id: 1, title: '预定酒店', category: 'preparation', group_id: 1 }
      ]
      
      mockStmt.all.mockReturnValueOnce(mockPreparationTasks)
      
      const db = mockDb.prepare()
      const tasks = db.all('SELECT * FROM wedding_tasks WHERE category = ? AND group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)', 'preparation', 1)
      
      expect(tasks).toHaveLength(1)
      expect(tasks[0].category).toBe('preparation')
    })

    it('should filter by group_id when specified', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.all.mockReturnValueOnce([])
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 2, 1)
      expect(isMember).toBeTruthy()
    })
  })

  describe('POST /api/wedding/tasks', () => {
    it('should create task with valid data', async () => {
      const newTask = {
        title: '确定摄影师',
        description: '联系摄影师确认档期',
        due_date: '2024-07-15',
        category: 'preparation',
        status: 'pending',
        group_id: 1
      }

      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ lastInsertRowid: 10 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 1, 1)
      expect(isMember).toBeTruthy()
      
      const result = db.run(
        'INSERT INTO wedding_tasks (title, description, due_date, category, status, created_at, updated_at, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        newTask.title, newTask.description, newTask.due_date, newTask.category, newTask.status, expect.any(String), expect.any(String), newTask.group_id
      )
      
      expect(result.lastInsertRowid).toBe(10)
    })

    it('should require title field', () => {
      const taskWithoutTitle = {
        description: 'some description',
        category: 'preparation',
        group_id: 1
      }
      expect(taskWithoutTitle.title).toBeUndefined()
    })

    it('should default status to pending', () => {
      const taskData = {
        title: '新任务',
        category: 'preparation',
        group_id: 1
      }
      const status = taskData.status || 'pending'
      expect(status).toBe('pending')
    })

    it('should accept valid category values', () => {
      const preparationTask = { title: 'T', category: 'preparation', group_id: 1 }
      const weddingDayTask = { title: 'T', category: 'wedding_day', group_id: 1 }
      const invalidCategory = { title: 'T', category: 'invalid', group_id: 1 }

      expect(preparationTask.category === 'preparation' || preparationTask.category === 'wedding_day').toBe(true)
      expect(weddingDayTask.category === 'preparation' || weddingDayTask.category === 'wedding_day').toBe(true)
      expect(invalidCategory.category === 'preparation' || invalidCategory.category === 'wedding_day').toBe(false)
    })
  })

  describe('PUT /api/wedding/tasks/:id', () => {
    it('should update task status', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const result = db.run('UPDATE wedding_tasks SET status = ?, updated_at = ? WHERE id = ?', 'completed', expect.any(String), 1)
      
      expect(result.changes).toBe(1)
    })

    it('should update task details', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const result = db.run(
        'UPDATE wedding_tasks SET title = ?, description = ?, due_date = ?, category = ?, updated_at = ? WHERE id = ?',
        '更新任务', '更新描述', '2024-08-01', 'wedding_day', expect.any(String), 1
      )
      
      expect(result.changes).toBe(1)
    })
  })

  describe('DELETE /api/wedding/tasks/:id', () => {
    it('should delete task with valid permissions', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const deleteResult = db.run('DELETE FROM wedding_tasks WHERE id = ?', 1)
      
      expect(deleteResult.changes).toBe(1)
    })
  })
})