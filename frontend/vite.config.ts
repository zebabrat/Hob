import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const srcPath = (segment: string) =>
  fileURLToPath(new URL(`./src/${segment}/`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Must stay in sync with compilerOptions.paths in tsconfig.app.json:
    // TypeScript resolves the types, Vite resolves the actual bundle.
    alias: {
      'app/': srcPath('app'),
      'pages/': srcPath('pages'),
      'features/': srcPath('features'),
      'shared/': srcPath('shared'),
    },
  },
  server: {
    port: 5173,
    // Forward /api to the Fastify backend so dev requests stay same-origin.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
