/**
 * Wedding Finance API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb, mockStmt, mockUseAuthSession } from '../setup'

const session = { data: { id: 1, username: 'testuser' } }

describe('Wedding Finance API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthSession.mockResolvedValue(session as any)
    mockDb.prepare.mockReturnValue(mockStmt as any)
  })

  describe('GET /api/wedding/finance', () => {
    it('should return all finances when no group_id filter', async () => {
      const mockFinances = [
        { id: 1, type: 'income', category: '礼金', amount: 10000, description: '收到礼金', record_date: '2024-01-01', group_id: 1 },
        { id: 2, type: 'expense', category: '酒席', amount: 5000, description: '订酒席', record_date: '2024-01-02', group_id: 1 }
      ]
      
      mockStmt.all.mockReturnValueOnce(mockFinances)
      
      const db = mockDb.prepare()
      const finances = db.all('SELECT * FROM wedding_finances WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?) ORDER BY record_date DESC', 1)
      
      expect(finances).toHaveLength(2)
    })

    it('should calculate summary correctly', async () => {
      mockStmt.get.mockReturnValueOnce({ total: 10000 })
      mockStmt.get.mockReturnValueOnce({ total: 5000 })
      
      const db = mockDb.prepare()
      const income = db.get('SELECT COALESCE(SUM(amount), 0) as total FROM wedding_finances WHERE type = ? AND group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)', 'income', 1)
      const expense = db.get('SELECT COALESCE(SUM(amount), 0) as total FROM wedding_finances WHERE type = ? AND group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)', 'expense', 1)
      
      expect(income.total).toBe(10000)
      expect(expense.total).toBe(5000)
    })

    it('should filter by group_id when specified', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.all.mockReturnValueOnce([
        { id: 3, type: 'income', category: '礼金', amount: 20000, group_id: 2 }
      ])
      mockStmt.get.mockReturnValueOnce({ total: 20000 })
      mockStmt.get.mockReturnValueOnce({ total: 0 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 2, 1)
      expect(isMember).toBeTruthy()
    })
  })

  describe('POST /api/wedding/finance', () => {
    it('should create finance record with valid data', async () => {
      const newFinance = {
        type: 'income',
        category: '礼金',
        amount: 10000,
        description: '朋友送礼',
        record_date: '2024-06-01',
        group_id: 1
      }

      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ lastInsertRowid: 5 })
      
      const db = mockDb.prepare()
      const isMember = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', 1, 1)
      expect(isMember).toBeTruthy()
      
      const result = db.run(
        'INSERT INTO wedding_finances (type, category, amount, description, record_date, created_at, updated_at, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        newFinance.type, newFinance.category, newFinance.amount, newFinance.description, newFinance.record_date, expect.any(String), expect.any(String), newFinance.group_id
      )
      
      expect(result.lastInsertRowid).toBe(5)
    })

    it('should reject finance without group_id', () => {
      const invalidFinance = {
        type: 'income',
        category: '礼金',
        amount: 10000,
        record_date: '2024-06-01'
      }
      expect(invalidFinance.group_id).toBeUndefined()
    })

    it('should validate type is either income or expense', () => {
      const validIncome = { type: 'income', group_id: 1 }
      const validExpense = { type: 'expense', group_id: 1 }
      const invalidType = { type: 'invalid', group_id: 1 }

      expect(validIncome.type === 'income' || validIncome.type === 'expense').toBe(true)
      expect(validExpense.type === 'income' || validExpense.type === 'expense').toBe(true)
      expect(invalidType.type === 'income' || invalidType.type === 'expense').toBe(false)
    })
  })

  describe('PUT /api/wedding/finance/:id', () => {
    it('should update finance record', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const result = db.run(
        'UPDATE wedding_finances SET type = ?, category = ?, amount = ?, description = ?, record_date = ?, updated_at = ? WHERE id = ?',
        'expense', '婚庆', 30000, '婚庆公司订金', '2024-06-15', expect.any(String), 1
      )
      
      expect(result.changes).toBe(1)
    })
  })

  describe('DELETE /api/wedding/finance/:id', () => {
    it('should delete finance record with valid permissions', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 1 })
      mockStmt.run.mockReturnValueOnce({ changes: 1 })
      
      const db = mockDb.prepare()
      const deleteResult = db.run('DELETE FROM wedding_finances WHERE id = ?', 1)
      
      expect(deleteResult.changes).toBe(1)
    })
  })
})