import { TEST_DATABASE_URL, TEST_JWT_SECRET } from './test-db';

// Runs before every test file imports application modules, so the environment
// is already valid when `src/config/env.ts` is first evaluated.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = TEST_JWT_SECRET;
