import { vi } from 'vitest'

// Mock database statement
const mockStmt = {
  run: vi.fn(),
  get: vi.fn(),
  all: vi.fn()
}

// Mock database instance
const mockDb = {
  prepare: vi.fn(() => mockStmt),
  exec: vi.fn(),
  run: vi.fn(),
  get: vi.fn(),
  all: vi.fn(),
  close: vi.fn()
}

// Mock session
const mockSession = {
  data: {
    id: 1,
    username: 'testuser'
  }
}

export const mockUseAuthSession = vi.fn().mockResolvedValue(mockSession)

export { mockDb, mockStmt }