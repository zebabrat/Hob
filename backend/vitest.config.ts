import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Config validation runs at import; the Prisma module is mocked in tests,
    // so this URL is never dialled — it only has to exist.
    env: { DATABASE_URL: 'postgresql://test:test@localhost:5432/test' },
    include: ['src/**/*.test.ts'],
    // The generated Prisma Client is large and has nothing to test.
    exclude: ['src/generated/**'],
  },
});
