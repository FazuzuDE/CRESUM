# Exercise muscle card — approved option 3

The user selected option 3 of the comparative mockup on 2026-10-29.

## Behavior and approach

Show a compact Working muscles card in the exercise Technique details below the
START/FINISH controls. Reuse the approved anatomical source and accepted SVG
masks front/back; list all exact exercise Primary and Secondary groups beside it.
More details opens a scrollable native modal with a larger map, exercise name,
full role lists, explanatory copy and an accessible close button. Android Back
and swipe dismissal close details without changing movement phase or exercise.
Restore focus to the initiating button after dismissal.

Considered: a separate large block (always visible, more scrolling), a movement/
muscles switch (large map, hides movement), compact summary with details
(selected by user: movement stays visible, detailed map available on demand).

## Constraints

Reuse current catalog roles, not workout history/set counts, percentages,
activation or recovery estimates. Do not change exercise IDs, metadata, workout
state, saved History, attachment selection, START/FINISH or source masks.
All 17 groups remain eligible for text; the 3 unassigned groups (upper-back,
rear-delts, adductors) are named in a coverage notice when this exercise uses them.
Do not draw guessed regions. Include the existing lower-back schematic limit
when relevant. Current source/overlays and fixed role colors/opacities remain.

Use existing theme tokens, minimum44pt controls and readable wrapping copy.
Compact map height160pt, full map340pt; at window width below375pt or fontScale
above1.2 stack map above text. Neutral unassigned anatomy does not mean no role.
All new copy in EN/RU/DE/FR. Offline bundled assets, no dependencies/network.
Screen readers get role names and a named details action; decorative SVG paths
are not touch targets. Only exercise details, not every library list row.

## Validation and limits

Test real consumer opening/closing, exact role tint, neutral unrelated regions,
coverage gaps, no-secondary state, locale change and compact fallback layout.
Run full check, native exports, final-head CI and one independent branch review.
Native device compositing, small-phone and screen-reader acceptance remain open.
