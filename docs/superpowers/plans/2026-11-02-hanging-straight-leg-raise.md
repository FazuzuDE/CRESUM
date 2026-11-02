# Hanging Straight Leg Raise Implementation Plan

**Goal:** Integrate the pair approved on 2026-11-02 as a separate stable exercise.

**Architecture:** Reuse the flat catalog, local Male artwork resolver, shared
phase and muscle viewers, localized guides and sharing catalog. Preserve both
knee-raise identities and history; no storage migration or new dependencies.

**Spec:** The dated Hanging Straight Leg Raise decision in `docs/DECISIONS.md`.

- [x] Verify a failing separate-identity/artwork check before implementation.
- [x] Export exact source halves and record source, actual inputs and prompt.
- [x] Add catalog identity, EN/RU/DE/FR guide, shared artwork and viewer tests.
- [x] Update additive catalog contracts while preserving the original 58 IDs.
- [ ] Validate generated catalogs, formatting, tests and native exports in CI.
- [ ] Open draft PR; synchronize its actual version with `npm run version:pr`.
- [ ] Mark ready after CI passes; device/visual detail review remains explicit.
