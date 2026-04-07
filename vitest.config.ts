import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['node_modules', 'dist', '**/*.js'],
    include: ['src/**/*.test.ts'],
  },
});
