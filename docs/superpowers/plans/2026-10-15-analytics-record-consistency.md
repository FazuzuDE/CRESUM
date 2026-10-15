# Analytics Record Consistency Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement the steps inline.

**Goal:** Make Progress records, logged-performance estimates and Library statistics agree on eligibility and source selection.

**Architecture:** Keep completed-set validation in workout-metrics and reuse a deterministic estimate comparator in all three projections. Preserve actual zero-load logs, volume, paired-side work and schema v1.

**Tech Stack:** TypeScript, React Native, Jest.

**Spec:** docs/PRODUCT.md (Exercise Statistics), docs/PROGRESS_ANALYTICS.md; approved audit follow-up in docs/ROADMAP.md.

## Global Constraints

- Preserve offline-first behavior, stable exercise identities and historical snapshots.
- No dependencies, storage writes, migrations, formula or period changes.
- TOP PR remains the largest eligible estimated record in the selected period.

## Review Focus

- Zero external load must remain available as logged work and volume, without a fabricated strength estimate.
- Paired-side logs retain both sides without a single estimated maximum.
- Equal estimates must select the same later source, then stable IDs and saved indices.
- Legacy done-only completion uses finishedAt; malformed timestamps cannot become valid estimates.
- Period boundaries and exact exercise variants remain independent.

## Task: Consistent completed-set estimates

- [x] Add cross-projection regressions for zero/paired/positive sets, timestamp and ID ties, reversed input, legacy completion and unchanged snapshots.
- [x] Run the new test with `npm test -- --runTestsByPath lib/__tests__/analytics-consistency.test.ts`; observe genuine mismatches.
- [x] Omit estimatedOneRepMax for zero load in completedSetMetrics. Share estimate source ordering across progress-analytics, exercise-performance and exercise-statistics; retain public projection shapes.
- [x] Update obsolete zero-estimate assertions and explain zero-load unavailability in logged performance. Verify the explanation with a screen test.
- [x] Run the complete suite, TypeScript, lint, formatting, Expo configuration/dependency checks and affected export checks.
- [x] Update analytics/product/decision/roadmap documentation. Review the final diff, commit and open a focused PR; do not merge.

## Review and verification

- Baseline: 607 tests / 66 suites passed at merged PR #48.
- Original regressions: four expected failures before implementation; fixed by shared estimate eligibility/source selection.
- Review correction: saved labels must remain independent of estimate eligibility. Two tests failed first, then passed after collecting newest valid zero-load/paired labels without generating a record.
- Final suite: 618 tests / 67 suites passed. TypeScript, ESLint and Prettier passed. iOS/Android Expo export passed.
- Independent review: label finding addressed; focused final review passed 23 tests without remaining severity findings.
- No storage writes/migrations, new dependencies or formula/period changes. Physical-device acceptance remains a separate release check.
