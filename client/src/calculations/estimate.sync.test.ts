import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Drift guard: the estimate calc module is mirrored between server/ and client/ (see this
 * dir's README). These must stay byte-identical; this test fails if they diverge, so no
 * drift can reach main green. Canonical source: server/src/calculations/estimate.ts.
 */
const here = dirname(fileURLToPath(import.meta.url));
const thisCopy = (name: string): string => readFileSync(resolve(here, name), 'utf8');
const canonicalCopy = (name: string): string =>
  readFileSync(resolve(here, '../../../server/src/calculations', name), 'utf8');

describe('estimate calc module mirror', () => {
  it('estimate.ts is byte-identical to the canonical server copy', () => {
    expect(thisCopy('estimate.ts')).toBe(canonicalCopy('estimate.ts'));
  });
  it('estimate.test.ts is byte-identical to the canonical server copy', () => {
    expect(thisCopy('estimate.test.ts')).toBe(canonicalCopy('estimate.test.ts'));
  });
});
