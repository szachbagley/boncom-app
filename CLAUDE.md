# CLAUDE.md
Project-wide rules and conventions. These are always-on invariants that apply to
every file and every task. Detailed procedures live in skills (see `.claude/skills/`). 
When a rule below conflicts with a skill or prompt, ask before proceeding.

## Project Description
A web app for creating and managing client cost estimates. A user can create an
estimate for a named client, add line items (description, quantity, rate), see totals
update live, apply a discount and tax, set a status (draft / sent), and return to a
saved estimate later.

## Stack
- **Backend:** TypeScript, Express, MySQL. Deployed to Railway (managed MySQL).
- **Frontend:** TypeScript, React (Vite). Deployed to Vercel as a static build.

## Key priorities

- User experience first: the UI should feel clean, intuitive, and responsive. 
  This is a tool someone would use every day, so how it *feels* to use is a first-class 
  requirement, not a finishing touch. Live-updating totals must feel effortless (debounce
  input-driven recalculation where appropriate).
- **Correctness of the math** above all else — a wrong total is a failed product.
- **Scalability & performance:** index columns used for lookups; don't do work the app 
  doesn't need to; be mindful of unnecessary re-renders and re-fetches.
- **Resilience:** things fail in production. Handle it gracefully; never crash on bad 
  input or an upstream error.

## Architecture & boundaries
 
Respect these boundaries strictly. Do not collapse layers for convenience, even
when it looks like fewer lines — flag it and ask first if a boundary seems to be
in the way.
 
- **Backend layering:** `routes/ → services/ → data/`. Routes do HTTP only (parse,
  validate, delegate, respond). Business logic lives in services. Data access is
  isolated in the data layer. Routes never contain business logic or raw DB calls.
- **All estimate math lives in one dedicated, pure calculation module.** The UI and
  the routes NEVER perform arithmetic on money. They call the calculation module and
  render/return what it produces. (Detailed calculation procedure: see the
  `estimate-calculations` skill.)
- **Frontend layering:** `views/`, `components/`, `hooks/`, `api/`.
  Components do not fetch directly — data access goes through the api layer and is
  surfaced to components via hooks. Components render; they don't own fetching logic.
- **No external calls from inside route handlers** — always go through a service module.

## Development workflow

Feature work follows this loop every time. It exists so that design decisions are made
and reviewed before code is written, changes land in reviewable units, and `main` stays
continuously deployable (Vercel and Railway auto-deploy from `main`).

**1. Plan before code.** For any non-trivial feature or multi-step change, first write a
plan to `docs/<feature>-implementation.md`, structured in **phases and numbered steps**.
The plan states the design decisions, the files touched per step, which skill(s) apply,
and the test surface (what gets a failing test first vs. what's test-documented). Do NOT
write implementation code until I've reviewed and approved the plan.

**2. Branch per feature.** Each feature is developed on its own short-lived branch off
`main` (e.g. `feat/estimate-calculations`, `feat/line-items-ui`). Never commit feature
work directly to `main`.

**3. Execute one step at a time.** Implement a single numbered step, then STOP:
- Run the type-check (`tsc --noEmit`) and any relevant tests; confirm green.
- Report what changed and what's next.
- Wait for my go-ahead before the next step.
Do not run multiple steps in one pass or "get ahead" — the point is reviewable increments.

**4. Land via PR.** When a feature's steps are complete and green, open a pull request
with a short description: what the feature does and the one or two key decisions behind it
(this is where reasoning becomes visible to reviewers). Squash-merge into `main` to keep
history clean. The implementation-plan file is committed with the feature (it's an
artifact, not scratch).

**5. Confirm the deploy.** After merge, verify the auto-deploy succeeded and `main` is
still live before starting the next feature.

Keep this lightweight — short branches, self-reviewed PRs, concise descriptions. The goal
is a readable, narrated history and a deployable `main`, not process ceremony.

## Money — non-negotiable invariants
 
Money bugs are the most likely way this app loses credibility with a real estimator,
and floating-point currency is the classic cause. These rules are absolute:
 
- **Represent money as integer cents in application code. Never use floats/doubles
  for currency.** `0.1 + 0.2 !== 0.3` — do not let float arithmetic touch money.
- **In MySQL, money columns are integer-cents (`BIGINT`).
  Never `FLOAT` or `DOUBLE` for money.**
- **Rounding is deliberate and happens in one place** (the calculation module), per
  the rules documented in the `estimate-calculations` skill. Do not scatter `Math.round`
  through the code.
- **Discount is applied before tax** (discount → discounted subtotal → tax on that).
  This ordering is an invariant; totals depend on it. If a requirement seems to imply
  otherwise, ask before changing it.

## Every view handles four states
 
Every data-driven view must handle **data, loading, empty, and error** states — not
just the happy path. Empty states invite action ("No estimates yet — create your
first"). Errors say what went wrong and how to recover, in the interface's voice,
never a vague apology. Build all four from the start; do not retrofit them.
 
## Validation & errors
 
- **Validate input at the route boundary** with Zod and reject bad input with a clear 
  `400` and field-level detail.
- **Errors propagate to a centralized error handler.** Do not log-and-return-null,
  and do not swallow errors. Route handlers forward async failures via `next(err)`.
- Client error responses never leak internal/DB detail; log the detail server-side.

## Testing policy
 
Test where it earns its place; document the rest.
 
- **TDD (failing test first) for:** the estimate calculation module (all of it — this
  is the highest-value test target), and any non-trivial logic, data transformation,
  or error/edge path.
- **Test-after or test-documented for:** UI, layout, and glue/pass-through code
  (route handlers that just delegate, hooks that just wire the api layer to state).
  Don't write tautological tests that assert a mock's shape.
- **Review AI-written tests before the implementation.** Confirm each test asserts real
  behavior (right total, right rounding, right error), not the return value of a mock.
- **Every feature gets a TESTING.md section:** happy path, edge cases, known
  limitations, error scenarios — regardless of whether it has code-level tests.

## Code style
 
- Prefer **named exports**. No default exports for modules with more than one export.
- **async/await**, not `.then` chains.
- TypeScript: no `any` where a real type is knowable; let the calculation module's
  types be the contract the UI consumes.
- Keep functions single-responsibility; a function that both calculates and formats
  is two functions.

## Dependency policy
 
- **Justify any new dependency before adding it.** Prefer the standard library and
  what's already in `package.json`. A component library (chosen deliberately) and a
  schema validator are expected; random utility packages are not.

## Deployment discipline
 
- Frontend → Vercel (static React/Vite build). Backend + MySQL → Railway.
- Never hardcode secrets or API base URLs in source. Use environment variables
  (`.env` locally, platform env vars in Vercel/Railway). The frontend's API base URL
  is an env var, not a literal.

## Decision logging
 
- When you (Claude) are about to make a non-obvious design decision, or when a default
  is overridden, note it so it can be captured in `DECISIONS.md`: what the default was,
  what we chose, and why. This file is a deliverable and an interview artifact.

## When uncertain
 
- Ask before adding files, installing packages, introducing a pattern not already in
  the codebase, or making any change that would violate a boundary or invariant above.



