# Kettlebell Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Publish and roll back a replaceable logo on the kettlebell thumbnail
without another mobile build after the compatible client ships.

**Architecture:** A shared typed placement resolver maps admin selections to a
versioned published payload. The mobile catalog consumes a validated published
revision with a bundled fallback. The admin editor owns drafts, preview and
authorized publication.

**Tech Stack:** TypeScript, Expo, React Native, Jest. Hosting and authentication
selection belong to the private publication integration.

**Spec:** [CRESUM branding administration](../specs/2026-11-08-branding-admin-design.md)

### 1. Establish the first placement

- [x] Verify the existing kettlebell catalog key and confirm the base image
      matches the approved source. Add the optimized base to `assets/equipment/`.
- [x] Wire the separate built-in CRESUM wordmark layer to the kettlebell row.
- [x] Verify base and logo render as separate layers in the artwork component.
- [ ] Add failing tests in `lib/__tests__/equipment-branding.test.tsx` for missing
      slots, individual exclusion, specific override, and equal-specificity conflicts.
- [ ] Run the focused test and confirm the resolver is missing.
- [ ] Implement the placement registry, release parser and selection resolver in
      `lib/equipment-branding.ts`. Use only the kettlebell placement initially.
- [ ] Run the focused tests, render the exact CRESUM mark at thumbnail size, and
      verify the base and mark align in the shared equipment picker.

### 2. Add private editor and publication

- [ ] Choose a private admin host and server-side publisher authorization
      before connecting production data or credentials.
- [ ] Test that drafts are private, unauthorized writes fail, stale publication
      conflicts preserve the active revision, and disable and rollback create new
      published revisions.
- [ ] Build the upload, catalog checklist, exclusions, preview and publication
      flow against the shared resolver. Validate file type, dimensions, size and
      trusted asset origin. Require the preview to surface skipped targets.
- [ ] Verify the full flow with an authorized test account and an anonymous
      read-only client. Confirm the mobile user can access only published data.

### 3. Deliver to the app

- [ ] Add failing client tests for first launch offline, persistence across
      restarts, stale responses, unavailable images and explicit disable.
- [ ] Integrate a validated release reader and local asset cache into
      `components/ExerciseEquipmentCatalog.tsx`. Activate a revision only after its
      logo file is cached and validated. Render from bundled art on a cold offline
      launch.
- [ ] Run `npm run check` and `npm run export:check`. In Expo Go, verify
      publish, replace, disable, rollback and restart offline on the catalog screen.
