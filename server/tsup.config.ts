import { defineConfig } from 'tsup';

/**
 * Bundles the workspace's TypeScript `@game/shared` package into the server
 * output. Without this, Node would try to load `shared/src/index.ts` at runtime
 * and fail, because the shared package ships source rather than compiled output.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  noExternal: ['@game/shared'],
});