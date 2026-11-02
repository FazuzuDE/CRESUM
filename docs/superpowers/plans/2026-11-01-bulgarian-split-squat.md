# Bulgarian Split Squat artwork implementation plan

Goal: integrate the user-approved Male START/FINISH pair through existing viewers.
Architecture: exact-ID static binding only; retain catalog, guide, history and muscle roles.
Spec: user approval of exec-0164cd81-4e39-4079-b621-c3bce9dc17ff.png on 2026-11-01.

- [ ] Export exact 887-square source halves to RGB WebP92/method6 and record hashes, actual references and exact prompt.
- [ ] Bind only bulgarian-split-squat/Male in lib/exercise-artwork.ts; migrate existing unsupported fixtures to leg-extension and extend existing phase/anatomy/fallback cases.
- [ ] Synchronize docs/DESIGN_SYSTEM.md, docs/EXERCISE_ASSETS.md and docs/DECISIONS.md.
- [ ] Create draft PR, run repository PR version helper with its actual number, verify synchronized version metadata.
- [ ] Verify full GitHub CI including tests/typecheck/lint/format/native exports, check exact asset bytes, and obtain whole-branch review before marking ready.

Review focus: Male-only identity; START/FINISH order; full-screen phase retention; anatomy return; unsupported placeholders. Existing fixtures cover the shared viewers. Asset integration adds no new functions or product behavior; no redundant unit tests for static mappings.

Execution: in this session on an isolated remote branch. Local full runtime/dependencies unavailable; CI is the full validation environment. Do not merge automatically. Artwork remains user-selected-provisional with explicit device/geometry QA limits. No per-exercise archive.
