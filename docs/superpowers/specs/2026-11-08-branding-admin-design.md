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

## Treadmill walking placements — approved 2026-11-23

For the treadmill walking illustration, use two independent regions on the
lower side panel of the deck. The primary region displays the bundled CRESUM
wordmark by default and accepts a replacement. The adjacent sponsor region is
empty by default and accepts an independently removable logo. Keep the clean
base image and both logos separate. Apply the existing one-logo conflict rule
to each region independently.

The editor previews the effective combination in each supported frame. Once a
frame has a reviewed placement, the same primary and sponsor selection applies
to it, using its own artwork-revision coordinates. Constrain each image to its
region and preserve its aspect ratio. Keep the region positions independent so
adding or removing a sponsor does not move the primary logo.

Publish both positions together through the existing revision contract, with
authorization, rollback and bundled fallback. The treadmill editor prototype
covers preview only. Mobile delivery and authorized publication are pending.
