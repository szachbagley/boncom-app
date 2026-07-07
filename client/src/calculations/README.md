# Shared estimate calculation module (mirror)

The files in this directory — `estimate.ts` and `estimate.test.ts` — are a **verbatim
mirror** of the canonical copies in `server/src/calculations/`. The estimate math is pure,
dependency-free TypeScript, and the frontend uses the **exact same logic** the backend uses
authoritatively, so the live totals preview and the server-of-record can never disagree.

## Why a mirror instead of a shared package

`client/` and `server/` are independent packages that deploy from separate subdirectories
(Vercel builds `client/`, Railway builds `server/`), with no npm workspace. A genuinely
shared module would sit outside both deploy roots and require reconfiguring both platforms.
Mirroring keeps each subdirectory self-contained; the drift guard (below) removes the usual
downside of mirroring — divergence.

## Canonical source of record

**`server/src/calculations/estimate.ts`** is canonical. **Do not hand-edit the copies in
this directory.** To change the estimate math:

1. Edit the canonical files in `server/src/calculations/`.
2. Re-copy them here. From this directory (`client/src/calculations/`):
   ```bash
   cp ../../../server/src/calculations/estimate.ts \
      ../../../server/src/calculations/estimate.test.ts .
   ```

## Drift guard

`estimate.sync.test.ts` exists in **both** packages and asserts the two copies are
byte-identical. It runs as part of `npm test` in each package, so a divergence fails the
test suite (in either package) and cannot reach `main` green.
