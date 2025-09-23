import { vi } from 'vitest'

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    DEV: true,
    VITE_OPENWEATHER_API_KEY: 'test-api-key'
  }
}))

// Global test utilities
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}