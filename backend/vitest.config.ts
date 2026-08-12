import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The generated Prisma Client is large and has nothing to test.
    exclude: ['src/generated/**'],
  },
});
