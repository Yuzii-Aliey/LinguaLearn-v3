/**
 * Vitest configuration.
 *
 * Kept separate from vite.config.js so the PWA build plugin chain never
 * runs during tests. Per-file DOM tests opt into jsdom with a
 * `@vitest-environment jsdom` docblock; everything else runs in plain
 * Node for speed.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
    testTimeout: 10_000,
    watchExclude: ['**/dist/**'],
  },
});
