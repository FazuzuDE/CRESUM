# CRESUM branding administration

Approved product scope, 2026-11-08. The first release slice covers the kettlebell
thumbnail. Later slices extend placement coverage through the same editor.

## Editor

In Branding, upload or reuse a logo, then select targets through separate
Exercises and Equipment trees. Each tree has its own select-all control. Group,
individual item, variant and supported placement controls allow finer selection.
A group with mixed selection shows a partial state. Individual exclusions apply
even if another selected group includes the same target. Search filters the view
without changing the selection. Replacing the uploaded logo retains the selection
and placement settings.

Bulk selection snapshots the current items. A separate opt-in per selected group
or catalog enables new members after they gain a reviewed placement. The preview
shows eligible targets, replacements and missing placements. Exercise previews
list Male and Female START and FINISH coverage separately.

## Rendering and conflict rules

Keep the base artwork immutable. A reviewed placement belongs to a stable target
ID and a specific artwork revision, character and frame when applicable. Its
normalized coordinates describe the permitted region and default layout.
Use the exact existing CRESUM wordmark centered on the kettlebell body in light
gray as the built-in branded preview. The logo has its own layer, with placement
and sizing constrained to that region. Skip artwork without a matching placement.

Each placement has at most one effective logo. A more specific rule overrides a
broader rule. Reject publication if different logos of equal specificity claim
the same placement. Explicit exclusions remove a target from their own set.

## Publication and delivery

Draft changes are private. Preview uses the same resolver as publishing and
shows the effective placements before activation. Only an authorized publisher
may publish, disable or roll back. Record the actor, time and prior revision.
Use an expected published revision so a stale draft cannot silently overwrite a
newer release. Activate a complete validated revision atomically. Disabling is
an explicit published state. Rollback publishes the previous content as a new
revision.

A compatible app reads only published data and keeps its last validated release
and image bytes offline. On a first offline start or an incompatible response,
use the bundled artwork when no validated cache is available. Artwork revisions
and asset URLs are versioned. A failed fetch must leave the last working artwork
visible. The initial compatible app release is required once. Subsequent
branding changes use the editor.

The scope is exercise and equipment illustrations. Exercise identity, workout
history, equipment defaults and application behavior remain outside this editor.
Production hosting and authorization implementation are separate delivery
decisions.
