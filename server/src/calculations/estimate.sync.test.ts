import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Drift guard: the estimate calc module is mirrored into client/src/calculations/. These
 * must stay byte-identical; this test fails if they diverge, so no drift can reach main
 * green. This (server) copy is the canonical source of record — the client copy must match
 * it, never the other way around.
 */
const here = dirname(fileURLToPath(import.meta.url));
const canonicalCopy = (name: string): string => readFileSync(resolve(here, name), 'utf8');
const clientCopy = (name: string): string =>
  readFileSync(resolve(here, '../../../client/src/calculations', name), 'utf8');

describe('estimate calc module mirror', () => {
  it('the client copy of estimate.ts is byte-identical to this canonical copy', () => {
    expect(clientCopy('estimate.ts')).toBe(canonicalCopy('estimate.ts'));
  });
  it('the client copy of estimate.test.ts is byte-identical to this canonical copy', () => {
    expect(clientCopy('estimate.test.ts')).toBe(canonicalCopy('estimate.test.ts'));
  });
});
