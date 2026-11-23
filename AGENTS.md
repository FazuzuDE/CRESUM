# CRESUM — Codex Instructions

## Mission

CRESUM is a commercial React Native + Expo + TypeScript fitness tracker focused on fast workout logging, reliable workout state, history, and useful progress analytics.

## Required context

On a new chat/account/environment, read `docs/START_HERE.md` and revalidate its
dated snapshot against current refs and PRs. Do not treat snapshot statuses as live.

Before UI work, read `docs/DESIGN_SYSTEM.md`.
Before product/feature work, read `docs/PRODUCT.md` and `docs/ROADMAP.md`.
These documents are the source of truth.

## Before every task

1. Inspect current branch, `git status`, diff, and relevant recent commits.
2. Inspect existing implementation before changing code.
3. Preserve uncommitted user changes.
4. Determine what is already implemented; do not redo completed work.
5. Keep scope narrow.

## Product priority

Current Core flow:
Onboarding → Home → choose/create workout → Exercise → Sets → Rest Timer → Finish → History → Progress.

Do not start AI Coach, social, nutrition, wearables, Oracle marketing infrastructure, or unrelated features unless explicitly requested.

## UI

Follow `docs/DESIGN_SYSTEM.md`.

- Light, premium, Apple-inspired direction.
- Reuse theme tokens and shared components.
- No dark-neon/cyberpunk direction.
- No arbitrary colors, typography, spacing, radii, shadows, or gradients.
- Phone-sized layouts are primary.
- Implement relevant loading, empty, error, offline, disabled and pressed states.
- Preserve accessibility and practical touch targets.

## Engineering

- Prefer the smallest safe change.
- Do not refactor unrelated code.
- Add dependencies only when justified.
- Reuse existing architecture/state/storage/components where practical.
- Keep business logic separate from presentation where practical.
- Do not break workout persistence, stored data, or active workout recovery.
- Preserve offline-first behavior where supported.

## Architecture boundaries

- Treat the app as modular, replaceable, and feature-driven without introducing speculative abstractions or a broad rewrite.
- Keep domain logic independent from screen placement and experimental presentation. Reuse design tokens and shared components.
- Feature flags control experiments and rollout; capabilities/entitlements control availability. Billing plans, promotions, rewards, and administrative grants are entitlement sources, not UI conditionals scattered through features.
- Before changing exercise identity, metadata, muscle mapping, or artwork, read `docs/EXERCISE_LIBRARY.md`. Preserve stable IDs and historical meaning; production exercise assets require exact-variant biomechanics and visual QA.

## Workout invariants

Do not accidentally lose active workouts or logged sets, duplicate completed workouts, corrupt history, silently reset weight/reps, or make Finish Workout persist invalid/partial data unintentionally.

## Exercise Library and assets

- A request that names an exercise or machine starts the workflow in
  [docs/EXERCISE_ADDITION_WORKFLOW.md](docs/EXERCISE_ADDITION_WORKFLOW.md).
  Add each new exercise, machine, or variant to its canonical library with
  a stable ID, all locale translations, and mandatory search synonyms before
  wiring it into any consuming surface by that ID. Preserve existing on-screen
  sizes and artwork export profiles. Show the CRESUM wordmark on new machine
  and equipment previews and in app as a replaceable separate vector layer.
  Keep the original illustration clean and store placement per artwork revision.

- Before changing exercise metadata or artwork, read `docs/EXERCISE_LIBRARY.md` and `docs/EXERCISE_ASSETS.md`.
- Preserve stable exercise IDs and historical meaning; do not casually rename or reinterpret saved IDs.
- Exercise assets are not approved until they pass the biomechanics QA in `docs/EXERCISE_ASSETS.md`.

- For every new Male exercise illustration, apply the Male Master and material/color
  continuity review in `docs/EXERCISE_ASSETS.md`; repeated edits must not degrade
  skin, clothing or machine surfaces.

- Follow `docs/VISUAL_STORAGE.md` for visual-source archiving. Record archive
  status truthfully: local files and inventory entries are not verified uploads.
  Keep future source-archive receipts separate from visual/biomechanics approval.

## Muscle Map granularity

- Before tracing a new muscle group, identify the useful visible anatomical
  subdivisions. Default to independent per-side masks for individual muscles or
  meaningful heads where source visibility and anatomy support the separation.
- Preserve stable parent-group IDs and existing accepted masks. Detailed visual
  parts do not authorize guessed load coefficients or changed exercise mappings.
- Do not fabricate surface regions for hidden muscles or uncertain boundaries;
  retain unresolved status or use a separately approved deeper view.

## Localization and search — mandatory for every addition

- Every new or changed app-controlled text must include complete translations in
  **all locales currently present in `lib/i18n/registry.ts`**, including selectable
  locales awaiting release/device acceptance. This includes exercise/equipment
  names, descriptions, instructions, buttons, validation, errors and accessibility.
- Every new searchable catalog item requires natural local search alternatives
  in all those languages in the same PR: synonyms, customary gym slang and
  abbreviations where applicable. Do not invent slang or translate it literally.
- Update the per-locale dictionaries in `lib/i18n/search/`, preserve exact variant
  meaning and stable IDs, and use the shared offline search engine at every
  exercise selection surface. A discovery alias is never a persistence alias.
- A new language must cover existing app copy, catalog content and search aliases
  before it is offered. Derive coverage from the live locale registry and catalogs;
  run `npm run i18n:check` and relevant search tests. Missing coverage blocks the PR.
- User-authored content and historical snapshots remain unchanged. Technical and
  external text exclusions are documented in `docs/LOCALIZATION.md`.

## Validation

Before completion:

1. Run existing typecheck.
2. Run relevant tests.
3. Run lint if configured.
4. Run other affected CI checks.
5. Fix regressions caused by the task.

Never claim completion while relevant checks fail. Clearly distinguish pre-existing failures.

## Git

- Use CRESUM for current product names. Preserve compatibility identifiers
  documented in `docs/REBRANDING.md`; do not blindly replace legacy data keys,
  application IDs, or unverified repository URLs.

- Do not work directly on `main`.
- Follow existing branch strategy.
- Do not merge into `main` automatically.
- Keep commits focused.
- Never discard uncommitted work just to obtain a clean tree.

## Application version per PR

- Follow `docs/PR_VERSIONING.md`: after opening a draft PR, use its actual number
  with `npm run version:pr -- <number>`, commit the synchronized metadata and
  verify before marking ready. Never predict the next PR number or hand-edit a
  padded value into package/Expo SemVer. Apply this to every PR, including docs.
- Commits within the same PR retain that PR's version. Do not change native
  build counters, installation IDs or data/schema versions for this rule.

## Approved decision sync

- An explicitly approved product or design decision is not permanent until it is synchronized to its owning repository document and merged.
- Use this sequence: Approved → Approved — pending Git sync → Codex documentation sync → implementation/checks → commit/PR → GitHub becomes canonical after integration.
- Synchronize only missing approved rules, preserve newer repository decisions, and do not use chat history or attachments as a substitute for committed documentation after integration.
- Keep product behavior in `docs/PRODUCT.md`, visual and interaction rules in `docs/DESIGN_SYSTEM.md`, priority and timing in `docs/ROADMAP.md`, and the chronological record in `docs/DECISIONS.md`.

## Completion report

Report: implemented; key files changed; checks/results; known limitations; recommended next task. Then stop.
