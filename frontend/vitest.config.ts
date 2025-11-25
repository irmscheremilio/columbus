import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load main .env file
config()

// Also load tests/.env file (will override if same keys exist)
config({ path: resolve(__dirname, 'tests/.env') })

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
    globals: true,
    testTimeout: 30000,
    // Run API tests sequentially to avoid auth state conflicts
    fileParallelism: false,
    // Run tests within a file sequentially
    sequence: {
      concurrent: false
    }
  }
})
