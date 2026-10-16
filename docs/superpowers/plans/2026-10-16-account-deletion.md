# Account Deletion Server Foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in the existing isolated worktree. Native execution, one final independent review.

**Goal:** Provide a verified owner-bound server endpoint and prove cloud cascade isolation.

**Architecture:** A dependency-injected Web Request handler owns validation and fixed responses. A thin Deno entrypoint pins the existing Supabase SDK and supplies live Auth/admin boundaries. Existing cascades remove owner data atomically.

**Tech Stack:** TypeScript, Supabase Edge/Deno, supabase-js 2.117.2, Jest, PostgreSQL 17.

**Spec:** ../specs/2026-10-16-account-deletion-design.md

## Global Constraints

- Node 22.16.x/npm 10.x, no new app dependency or privileged frontend key.
- Body limit 2048 bytes, confirmed expected UUID, verified non-anonymous owner.
- No live account deletion, deployment, schema migration or client button.
- Preserve local Core, files and provenance.

## Review Focus

- Token for B with confirmation of A must delete neither account.
- An expired token or failed Auth request must never reach admin deletion.
- A partial upstream failure or lost response must not report success.
- Cascades must remove private snapshots/receipts without touching account B.
- The deployed entrypoint must bind the real verified ID and hard-delete flag.

### Task 1: Server contract

**Files:** `supabase/functions/delete-account/handler.ts`, `index.js`, `supabase/config.toml`, `lib/__tests__/account-deletion-server.test.ts`.

**Interfaces:** `createDeleteAccountHandler({getUser, deleteUser})` returns a Web Request handler. `getUser(token)` returns a verified `{id,isAnonymous}` or null, and throws for unavailable Auth. `deleteUser(id)` resolves only on acknowledged hard deletion.

- [x] Add failing tests for 200 with exact verified ID, mismatched owners, anonymous/expired/missing token, strict JSON, byte limit/chunked input, methods/CORS, upstream failures and actual entrypoint wiring.
- [x] Run focused Jest and confirm expected missing-feature failures.
- [x] Implement handler and thin SDK/Deno entrypoint, pin npm import to 2.117.2.
- [x] Run focused tests and type/lint checks, keeping errors generic and no-store.

### Task 2: Cascades and delivery

**Files:** `supabase/tests/account-deletion.sql`, `.github/workflows/ci.yml`, `docs/ACCOUNT_AUTH.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`.

- [x] Populate disposable A/B with nested workouts, private feed and resolution receipts, prove direct Auth deletion forbidden, delete A as admin and assert all six owner tables empty for A/B snapshots unchanged.
- [x] Assert old A identity cannot republish after deletion; retain B access.
- [x] Wire SQL contract after all migrations and run locally in disposable PostgreSQL.
- [x] Document server readiness and separate client/deployment/release gates.
- [ ] Run full check and iOS/Android JS export sequentially, request final independent review, publish a focused PR into develop and confirm exact-head CI. Never auto-merge.
