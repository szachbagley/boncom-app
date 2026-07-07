import { defineConfig } from 'vitest/config';

// Integration tests hit the real local Docker MySQL. Run separately from the
// fast, DB-free unit suite (`npm test`) via `npm run test:integration`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.db.test.ts'],
  },
});
