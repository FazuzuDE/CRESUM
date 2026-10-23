# Unified workout plans

Approved by the user on 2026-10-23 after reviewing both screens.

Profile WORKOUTS opens Workout plans directly. Retain the second screenshot's
BrandHeader, plan library, individual plan buttons and detail Start/Share row.
Add Create Workout using the existing localized TemplateEditor and durable
store mutation. Save returns to the refreshed plan list; failure retains the draft.
The active Workout dock tab keeps its existing meaning.

Approach: reuse SharingHub rather than rebuilding the saved-workout list.
Keep existing edit/delete/duplicate/hide/restore management behind a secondary
Manage workouts action; the intermediate page is no longer the default route.
Do not enable network sharing, change data schemas or invent translations.

Also repair the reproduced HTTP web-preview start failure with secure random
UUID v4 bytes on web. Native lazy crypto loading and failure safety remain.
