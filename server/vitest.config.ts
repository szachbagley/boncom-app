import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests (*.db.test.ts) hit the real local DB and run separately
    // via vitest.integration.config.ts / `npm run test:integration`.
    exclude: ['**/node_modules/**', '**/*.db.test.ts'],
  },
});
