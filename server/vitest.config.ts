import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Auth tests exercise a real SQLite database, so run the suite serially.
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    globalSetup: ['./src/test/global-setup.ts'],
    setupFiles: ['./src/test/setup-env.ts'],
    hookTimeout: 30_000,
  },
});
