import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    globalSetup: ['tests/global-setup.js'],
    setupFiles: ['tests/setup-env.js'],
    threads: false, // one file at a time against the shared test database
    testTimeout: 20000,
    hookTimeout: 120000,
  },
})
