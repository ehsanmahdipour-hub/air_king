import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TEST_DATABASE_URL } from './test-db';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Creates a fresh, empty SQLite test database before the test run. Using a
 * dedicated file keeps tests isolated from the development database.
 */
export default function globalSetup(): void {
  execSync('pnpm exec prisma db push --force-reset --skip-generate', {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
