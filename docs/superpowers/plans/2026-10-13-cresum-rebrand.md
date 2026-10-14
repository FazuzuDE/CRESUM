# CRESUM Rebranding Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation.

**Goal:** Apply the approved CRESUM brand without losing installed-app identity or workout data.

**Architecture:** Rename display and project labels; keep persisted keys, application IDs and legacy deep links. Treat the repository rename as a separate administration operation.

**Tech Stack:** Expo configuration, TypeScript, npm lockfile, Markdown.

**Spec:** `docs/REBRANDING.md`

## Constraints and review focus

- Preserve existing data and installation identifiers.
- Do not update repository URLs before verifying the new repository address.
- Do not start Expo or merge automatically.
- Native installation and deep links still require a device build.

## Task 1: Apply and verify branding

- [x] Audit current HEAD, working tree, source labels and compatibility IDs.
- [x] Update app.json display name, slug and schemes; package.json and lockfile root package labels.
- [x] Update current product labels in documentation and internal test environment naming.
- [x] Extend scripts/check-config.cjs to verify branding and installed-app compatibility.
- [x] Run TypeScript, lint, formatting, config and regression tests.
- [ ] Commit and open a focused PR against develop.
- [ ] Rename the repository through an authorized administration surface; update source URLs only after verification.
