# CRESUM Content Admin — proposal for review

Status: proposed, not approved for implementation. Date: 2026-10-21.

## Intended outcome

The owner can change exercise content through clear forms and previews instead
of manually finding TypeScript records. Start with one useful editorial workflow,
then expand gradually. Fast editing must preserve stable exercise identities,
saved workout meaning, offline use and reviewed scientific dispositions.

The user requested this direction; the scope and approach below are proposals.

## Approaches

| Approach                                              | Benefit                                                              | Cost / limitation                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Separate web editor, repository-reviewed publication  | Friendly forms, previews, version history; existing release workflow | First stage still needs a reviewed app release for updates                     |
| Hosted editor with a versioned remote content service | Later content updates without releasing the app                      | Requires server authorization, publishing protocol and offline client delivery |
| Database dashboard only                               | Little custom editor work                                            | Exposes storage concepts and does not provide the requested editorial preview  |

Recommend the first approach as an initial slice. Design the content boundary so
the second approach can be evaluated later, without committing to a database or
hosting stack now. Do not add a general remote-code or layout editor.

## First screen and workflow

The initial section is Exercises. Show the real catalog, search, filters and
validation status. Selecting a record opens a form and a phone-sized preview.
Use the approved CRESUM wordmark and existing light design direction.

The first editing slice covers display names, technique text and source links.
In the initial implementation proposal, source-link editing means choosing
references from the existing reviewed source registry. URLs and source records
are read-only because they are shared across exercises; adding/changing them
requires a separate source-review slice.
Expose identity, equipment, Primary/Secondary mapping and illustration references
as read-only context. Asset replacement and scientific mapping editing follow as
separately validated slices; do not pretend these controls already work.

Flow: open current catalog → edit draft → preview → validate → export change
proposal → repository review → app release. Cancel leaves the catalog unchanged.
Invalid or unknown records cannot be exported. Draft failure retains the current
form and offers Retry. A stale source revision requires reloading and comparing;
it must not silently overwrite a newer catalog.

The proposal export identifies its source revision and exact stable exercise ID,
and contains only the fields allowed by the first slice. Never evaluate uploaded
code. Export is not publication. Initially the app continues consuming its local
bundled data through existing catalog/technique modules.

## Boundaries and later stages

- The editor does not read or modify personal accounts, workouts or History.
- Existing exercise IDs cannot be renamed, reused or deleted through this form.
- Historical snapshots remain historical; new content applies to future reads
  under the existing catalog contracts, not a rewrite of stored sessions.
- No arbitrary coefficients or regional intensity percentages become publishable
  merely because an editor form is complete.
- The first editor has no production write credentials or remote publication
  button. A hosted publishing stage must specify server-enforced authorization,
  audit trail, conflict handling, rollback and supported client versions.
- Later remote delivery must validate an entire compatible content release before
  atomic activation, retain last-known-good/bundled fallback, and avoid changing
  an active workout's captured meaning midway through logging.

## Validation and delivery

Before implementation, approve this first-slice scope and write its implementation
plan. Inspect the current catalog and technique validation rules in detail before
choosing an interchange schema; this proposal does not approve a new schema.

The [concrete implementation plan](../plans/2026-10-21-content-admin.md) now maps
the source adapter, strict proposal validation, recoverable drafts and browser
editor into separate testable tasks. Its proposed schema and editor limits await
review. The existing catalog has 65 records and separate shared source references;
the first editor does not introduce a new runtime catalog in the mobile app.

Verify real catalog loading, stable-ID protection, allowed-field export, source
revision conflict, invalid content, Save/Cancel, retained drafts and failure
recovery. Check keyboard navigation and compact preview readability. Verify that
the exported proposal does not include credentials or user training data. Existing
Core tests remain the regression gate. Logo adoption is delivered independently.
