# Account/Auth Checkpoint Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Reuse the frozen Stage 1 email-OTP implementation on current develop without coupling account state to local workout recovery.

**Architecture:** Preserve the narrow AuthRepository / AuthStore / Supabase adapter from checkpoint `618c7e202ec5e673a404c382c5438b3730682adf`. One app-level auth owner sits above LocalDataGate so local import/restore remounts do not recreate the auth client. Profile's compact Account row opens a dedicated scrollable page using the existing AccountSection form and shared components.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Supabase JS 2.117.2, AsyncStorage, react-native-url-polyfill 4.0.0, Jest.

**Spec:** `docs/superpowers/specs/2026-09-29-account-auth-foundation-design.md` (historical checkpoint specification; integration deltas below).

## Global Constraints

- Base: merged #51, develop `3e6a78895b5c11c01ffc5b097eabcc9afc71817f`; original frozen branch remains unchanged. Local baseline tree `ad48820459ff2543f5d49208aef988f8f4940dc6` matches the 666-test / 77-suite verified #51 tree.
- Preserve CRESUM naming, installed identifiers, schema v1, all current Profile/backup flows and source-of-truth documentation. Port selected auth files only; do not merge the old app or dependency versions over current develop.
- Account is optional. Auth loading, config errors and network failures cannot gate onboarding, workouts, History, Progress, local backup or recovery.
- Six-digit in-app OTP; successful send is not authentication. Apple/Google stay disabled; signed-in state explicitly says cloud workout backup is not enabled yet.
- Auth tokens stay in `cresum_auth_v1`, outside local backups, history-only imports and reset keys. Sign Out does not delete Core data. Core reset does not sign out.
- No live emails, production credentials, SMTP/account mutations, database schema, cloud uploads, sync queue, Calibration PR #17 or automatic merge in this PR.
- Reuse existing Supabase package versions from the checkpoint; preserve newer Expo packages. Real Email OTP/physical-iPhone validation remains pending until external setup is available.

## Review Focus

1. Delayed auth initialization cannot block Home or override a newer sign-out event.
2. A local restore/import remount must retain one auth owner and one subscription.
3. Sign Out/reset/backup must not expose or remove the other subsystem's data.
4. Send success, invalid codes and rate limits must never claim a verified or synced session.
5. Lifecycle cleanup, initial background state and duplicate subscriptions must not keep refresh work alive incorrectly.

## File map and interfaces

- `lib/auth-repository.ts`: existing AuthIdentity and AuthRepository contracts; no Core imports.
- `lib/auth-store.ts`: stable AuthSnapshot, initialize/send/verify/signOut/dispose and subscription ordering.
- `lib/supabase-auth.ts`: optional public config, isolated persistence, SDK calls and native lifecycle.
- `components/AccountSection.tsx`: existing OTP form; `AccountSectionProps` contains snapshot plus async send/verify/signOut commands.
- `components/useAccount.ts`: one lazily created AuthStore with explicit public env reads, independent effect and stable external-store subscription; returns AccountSectionProps.
- `components/AccountPage.tsx`: BrandHeader, Back to Profile, AccountSection in AppScrollView.
- `components/ProfileSettings.tsx`: optional account prop, compact Account row and local page state.
- `app/index.tsx`: own useAccount above LocalDataGate and pass through AppContent to Profile.
- Four auth test files plus current backup/reset suites prove integration. `.env.example`, README, PRODUCT, DESIGN_SYSTEM, ROADMAP and DECISIONS record actual limits.

### Task 1: Reuse the tested auth contracts and adapter

- [x] Copy checkpoint tests first; run auth-store/account-section tests and observe missing-module RED.
- [x] Port the three auth libraries and AccountSection unchanged initially. Install only the two checkpoint dependencies; inspect direct dependency diff.
- [x] Run focused tests. Existing adapter tests pin optional config, isolated storage, send/verify mapping, refresh lifecycle and disposal; store tests pin pending/error/session ordering.
- [x] Address concrete integration defects with a failing regression before each code change.

### Task 2: Integrate the modern Profile and recovery boundary

- [x] Adapt app tests to the actual Progress tab and Reset CRESUM confirmation. Add a pending-session/full-restore case asserting factory called once, no disposal during Core remount, eventual signed-in snapshot and disposal on app unmount.
- [x] Run integration tests before wiring and confirm RED.
- [x] Add useAccount above LocalDataGate, pass AccountSectionProps into AppContent/Profile, and add the Account row/page. Keep auth outside every Core ready/error/reset/backup condition.
- [x] Verify no-config/error Core usability, sign-out preserving raw state, reset preserving auth storage, and one auth owner across full local restore. Run current Profile/backup/reset suites too.

### Task 3: Delivery and external acceptance handoff

- [x] Sync current implementation and approved staging into owning docs; retain physical-device/SMTP limitations and distinguish auth connection from cloud backup.
- [x] Run TypeScript, ESLint, Prettier, full tests, Expo config/dependency checks, native JS exports and git diff check. Avoid parallel native exports during Jest due the observed shared-environment 5-second timeout.
- [x] Fresh-context whole-branch code review, then verified fixes for important findings; no unrelated polish.
- [x] Prepare a focused PR into develop with exact checks and outstanding Email OTP/device acceptance; preserve the original frozen branch and never merge automatically. Publication/CI status is tracked on the pull request.

## Verification result — 2026-10-15

- `npm run check`: TypeScript, ESLint, Prettier, **697 tests / 81 suites**, config and dependency checks passed. Local Expo checks used offline mode with telemetry disabled; dependency validation reports its offline limitation.
- `npm run export:check`: iOS and Android JavaScript bundles passed, offline with telemetry disabled. Native binary/device acceptance is separate.
- Fresh-context whole-branch review found one important SDK cleanup issue: stopping refresh retained the browser BroadcastChannel. Two regressions failed before the fix; full SDK disposal now runs immediately and after late initialization. All 31 focused auth tests pass.
- Real Email OTP/custom SMTP and physical-device acceptance remain pending as documented in `ACCOUNT_AUTH.md`. No production or backend mutations were performed.
