import { vi } from 'vitest'

// Mock axios for unit tests
vi.mock('axios')

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Set test environment variables
process.env.VISUAL_CROSSING_API_KEY = 'test-api-key'
