# CRESUM Content Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a standalone local web editor for the real exercise catalog that exports validated text-change proposals without changing the mobile app or personal data.

**Architecture:** A read-only build snapshot feeds a pure validation/proposal layer and a browser editor with local drafts. A separate command validates exported proposals against a freshly built source snapshot. Publication remains repository review and an ordinary app release; this slice has no automated source writer or remote delivery.

**Tech Stack:** Existing TypeScript, Node 22.16.0/npm 10.9.2, Jest and jsdom; plain browser DOM/CSS with esbuild 0.28.2 as the only added development dependency. No new mobile/runtime dependency.

**Spec:** [Content administration proposal](../specs/2026-10-21-content-admin-design.md).

**Status:** Proposed plan for review. The user's request to continue authorizes preparation; this file is not an implementation-complete claim. Recommend inline execution in the current session after plan review.

## Global Constraints

- "The editor does not read or modify personal accounts, workouts or History."
- "Existing exercise IDs cannot be renamed, reused or deleted through this form."
- "Export is not publication."
- "The first editor has no production write credentials or remote publication button."
- "Never evaluate uploaded code."
- Use CRESUM's existing light palette, spacing, radii and selected wordmark.
- The app continues importing `lib/exercise-library.ts` and `lib/exercise-technique`; it must never import `tools/content-admin` or the exported proposals.

## Review Focus

- A stale saved draft must retain its text while blocking export against a different source revision — Tasks 1–2.
- A storage quota/access failure must leave current edits available and show Retry — Task 2.
- Text containing markup or event handlers must render as inert text — Task 3.
- Unknown/legacy IDs, duplicate records and extra fields must never change exercise identity — Tasks 1 and 3.
- Selecting another exercise with unsaved edits must offer Keep editing or Discard, including keyboard use — Tasks 2–3.

## File responsibilities

`tools/content-admin/model.ts` defines the strict interchange contract; `source.ts` adapts canonical data; `validation.ts` validates proposals; `draft-store.ts` handles local drafts; `controller.ts` owns selection/edit transitions. `main.ts`, `view.ts`, `index.html` and `styles.css` present the editor. `snapshot-entry.ts` and `validate-entry.ts` are Node-only build/validation entries. `scripts/build-content-admin.cjs` builds both targets and injects the immutable snapshot. Tests live in `tools/content-admin/__tests__/`; usage lives in `docs/CONTENT_ADMIN.md`.

### Task 1: Read-only source and strict proposal validation

**Files:** Create `model.ts`, `source.ts`, `validation.ts`, `snapshot-entry.ts`, `validate-entry.ts` and `__tests__/validation.test.ts` under `tools/content-admin/`; add the builder and package scripts with the first usable CLI.

**Interfaces:**

- `EditableContent = { name: string; scope: string; setup: string[]; movement: string[]; checks: string[]; mistakes: string[]; sources: TechniqueSourceId[]; adaptation?: string }`.
- `AdminRecord = { id: string; techniqueRevision: number; content: EditableContent; context: Pick<LibraryExercise, 'primaryMuscles' | 'secondaryMuscles' | 'equipment' | 'movementPattern' | 'imageKey' | 'measurement' | 'perSide'> }`.
- `AdminSnapshot = { version: 1; sourceRevision: string; gitCommit: string; records: AdminRecord[]; sources: typeof techniqueSources }`.
- `ChangeProposal = { version: 1; sourceRevision: string; changes: { exerciseId: string; baseTechniqueRevision: number; content: EditableContent }[] }`.
- `ValidationResult = { ok: true; proposal: ChangeProposal } | { ok: false; issues: { path: string; message: string }[] }`.
- `readCanonicalRecords(): AdminRecord[]`; `validateProposal(raw: unknown, source: AdminSnapshot): ValidationResult`; `createProposal(source: AdminSnapshot, records: { exerciseId: string; content: EditableContent }[]): ValidationResult`.

- [ ] Write failing tests: all 65 current IDs and techniques load without mutation; an edited incline press exports only its allowed content; unchanged input produces no change; unknown/legacy IDs, duplicates, wrong source/base technique revision, invalid source IDs and extra keys fail with field paths. Reject nested `id`, equipment, muscle or revision edits rather than dropping them silently.
- [ ] Run `npm test -- tools/content-admin/__tests__/validation.test.ts --runInBand`; confirm feature-absence failure.
- [ ] Implement the interfaces. Text is trimmed; name is 1–160 characters, scope 1–500, each required text array 1–30 entries of 1–2,000 characters, optional adaptation at most 3,000. Require at least one unique existing source ID. These are editor limits, not a migration of canonical records; check that all current records fit before using them.
- [ ] Compute `sourceRevision` as SHA-256 of canonical, sorted-key JSON for records and source definitions, retaining record/paragraph order. Exclude git metadata and timestamps from that digest. Record git HEAD separately. Validate against a freshly computed digest, so changed content or source URLs makes an old export stale while an unrelated documentation commit does not.
- [ ] Pin esbuild 0.28.2 in devDependencies and update the lockfile. Implement `npm run admin:build`: compile the Node snapshot entry, run it against the actual TS imports, inject its JSON as virtual module `admin:source`, bundle the browser, and build the validation CLI under ignored `dist/content-admin/`. Support `node scripts/build-content-admin.cjs --snapshot-only` to print freshly compiled source JSON without building the browser. The CLI command `node dist/content-admin/validate-proposal.cjs FILE.json` runs that snapshot-only command from the repository root on every validation, accepts JSON only, prints issues and exits 1 on invalid input; valid input exits 0. Missing repository/builder or snapshot errors fail closed. No automatic application to source files.
- [ ] Tests must prove source/content mutation changes the digest, timestamp/git-only changes do not, source arrays preserve paragraph order and a prototype-looking key is rejected. Run the focused suite and CLI with one valid proposal and one stale proposal, then commit the independently usable validator/builder.

### Task 2: Recoverable draft and selection state

**Files:** Create `draft-store.ts`, `controller.ts`, `__tests__/draft-store.test.ts`, `__tests__/controller.test.ts` under `tools/content-admin/`.

**Interfaces:**

- `DraftEnvelope = { version: 1; sourceRevision: string; drafts: Record<string, EditableContent> }`.
- `DraftStorage = { read(): Promise<string | null>; write(value: string): Promise<void> }`.
- `loadDrafts(storage: DraftStorage, source: AdminSnapshot): Promise<{ kind: 'empty' | 'current' | 'stale'; saved?: DraftEnvelope }>`; malformed JSON rejects with an actionable error.
- `saveDrafts(storage: DraftStorage, envelope: DraftEnvelope): Promise<void>`.
- `EditorState = { phase: 'loading' | 'ready' | 'stale' | 'load-error'; selectedId: string | null; pendingSelectionId: string | null; content: EditableContent | null; dirty: boolean; saving: boolean; saved: DraftEnvelope; staleDraft: DraftEnvelope | null; error: string | null; issues: { path: string; message: string }[] }`.
- `createEditorController(source: AdminSnapshot, storage: DraftStorage)` returns `getState(): EditorState`, `subscribe(listener: () => void): () => void`, `load(): Promise<void>`, `requestSelection(id: string): void`, `keepEditing(): void`, `discardAndSelect(): void`, `discardStaleDrafts(): Promise<void>`, `edit(content: EditableContent): void`, `saveDraft(): Promise<void>`, `cancelEdits(): void`, `resetToSource(): Promise<void>` and `exportProposal(): ValidationResult`. Reset confirmation belongs in the view before calling `resetToSource`; `load()` is also Retry for a failed read.

- [ ] Write failing tests with an in-memory storage port: edit without save leaves the saved draft unchanged; Save/restore round-trips; Cancel restores the last saved draft or source; reset clears only the selected exercise after confirmation; another exercise's draft remains intact.
- [ ] Run the two focused suites and confirm missing implementation failures.
- [ ] Implement browser storage key `cresum_admin_drafts_v1`, isolated from all mobile storage keys. Keep the current form in memory on write failure; Retry repeats the same draft. A stale draft is retained for inspection/copy and cannot be exported; an explicit discard of the stale envelope returns to current source. Do not silently rebase.
- [ ] Test blocked storage and quota errors, corrupt JSON, stale drafts, repeated Save, invalid draft retention, unknown selection and dirty-selection Keep/Discard. Export only when no unsaved form edits remain, current saved drafts validate and there is at least one actual change. Run suites, then commit.

### Task 3: Real catalog browser, editor and phone preview

**Files:** Create `main.ts`, `view.ts`, `index.html`, `styles.css`, `__tests__/editor-dom.test.ts` under `tools/content-admin/`; modify `lib/brand-wordmark.ts` (new shared pure geometry) and `components/BrandWordmark.tsx` to consume the same lettering without changing appearance.

**Interfaces:** `mountEditor(root: HTMLElement, source: AdminSnapshot, storage: DraftStorage): () => void` mounts the UI and returns cleanup. It consumes Task 2's controller; it owns no validation/persistence rules. Reuse `filterExercises` and taxonomy labels for search/equipment/muscle filters rather than implementing different search semantics.

- [ ] Write failing jsdom tests: the actual 65-record catalog is searchable/filterable; choosing an exercise shows its saved text; editing changes the phone preview; immutable identity/equipment/muscles/artwork context has no edit controls; source selection lists existing titles/URLs and cannot modify the shared registry.
- [ ] Run `npm test -- tools/content-admin/__tests__/editor-dom.test.ts --runInBand` and confirm missing implementation failure.
- [ ] Implement a local-only Exercises page: catalog, labeled form, phone preview, Save draft, Cancel edits, Reset to source, and Export proposal. Display field issues next to fields and save/load errors with Retry; the export action explicitly says it downloads a change proposal and does not publish. Labels and instructional copy use the project's current English UI language. Keep a visible Draft status and immutable source revision context; do not add fake dashboard metrics.
- [ ] Derive browser CSS variables from `lib/theme.ts` for colors, spacing and radii. The browser uses system UI fonts; share only pure wordmark geometry between native SVG and browser SVG. On a narrow viewport stack list, form and preview without changing controller state; the phone preview remains a separate clearly labeled editorial approximation.
- [ ] Render all edited/source text through text nodes, never `innerHTML`. Keep the previous selection/form DOM stable during typing; do not lose caret/focus. A dirty selection opens a keyboard-operable confirmation and returns focus predictably. Existing source links allow HTTPS only. Download JSON via a Blob and revoke its object URL. No authentication client or network mutation is initialized.
- [ ] Test literal `<img onerror=...>` content stays text, keyboard dirty-selection confirmation, focus/caret preservation across edits, invalid form export blocking, save failure retaining the form, and successful export containing exactly the validated proposal with no accounts/history/environment values. Run the complete admin suites and commit.

### Task 4: Delivery checks and usage

**Files:** Create `docs/CONTENT_ADMIN.md`; update `.github/workflows/ci.yml`, `docs/ROADMAP.md`, `docs/PRODUCT.md` and `docs/DECISIONS.md` with implementation status only after it exists.

- [ ] Document local build/serve commands, allowed fields, local draft behavior, stale proposal recovery and review-to-release workflow. State that new source records, assets, mapping edits, hosted access and direct app updates are later slices.
- [ ] Add `npm run admin:build` to Quality checks after existing checks. Serve `dist/content-admin` on loopback for local browser acceptance; no external deployment or project creation is part of this plan.
- [ ] Run all admin tests, `npm run check`, `npm run admin:build`, `npm run export:check` and `git diff --check`. A clean run must exit 0 without bypassing failed checks. Verify native app code has no imports from admin modules or generated proposal files.
- [ ] Review at 390 px and desktop widths in a fresh browser profile: search, select, edit, save, reload, preview, export and validation CLI; use source data, not invented workouts. Check Tab navigation, visible focus and error announcements. Native wordmark visual acceptance remains a device check; no claim of iPhone rendering based on a web preview.
- [ ] Commit final docs/CI changes and prepare a focused PR. Until #68 merges, use its branch as the explicit stacked base; do not copy the chest evidence work from #67 into this feature or merge either branch automatically.
