import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: ['./scripts/table-reporter.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/ai/providers/**/*.ts'],
      exclude: ['src/ai/providers/__tests__/**'],
    },
  },
})
