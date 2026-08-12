import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const srcPath = (segment: string) =>
  fileURLToPath(new URL(`./src/${segment}/`, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Same aliases as vite.config.ts — tests import through them too.
    alias: {
      'app/': srcPath('app'),
      'pages/': srcPath('pages'),
      'features/': srcPath('features'),
      'shared/': srcPath('shared'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
