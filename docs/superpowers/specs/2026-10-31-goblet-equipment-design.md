# Goblet Squat equipment choice — approved design

## Approved intent

One Goblet Squat entry in the library; select Dumbbell or Kettlebell inside it.
Use the selected equipment for illustration, guide, filtering and workout entry.
Preserve existing workout/history meaning. Kettlebell pair is user-selected;
the newly supplied dumbbell image is a reference awaiting CRESUM generation.

## Approaches

Separate visible exercises were proposed and the user chose internal equipment
variation. Merely listing both equipment tags cannot retain which was used.
Use internal concrete configuration identities behind one visible family entry.
Keep existing goblet-squat as the dumbbell configuration for compatibility.
Add kettlebell configuration without rewriting stored data or merging results.

## Approved behavior

Default existing records and plans to dumbbell. Choose equipment before adding
to a plan/workout; retain that selection in saved records and reopening flows.
Changing equipment affects future additions, never rewrites completed sets.
Show one parent entry; filtering by either equipment can find it. Show matching
artwork and equipment-specific instruction. Preserve current qualitative muscles.
Offer one exercise statistics screen with three filters: All / Dumbbell / Kettlebell.
User requested All on 2026-10-31: it shows results across both equipment choices.
Retain equipment identity on each result so the combined chronology is readable.
Equipment-specific filters show only their matching results. The combined view
does not merge internal identities, rewrite history, or alter equipment-specific
previous-performance suggestions. Combined records/aggregates, where displayed,
are explicitly scoped to All; each result retains its equipment attribution.

## Scope and checks

Reuse existing Expo/React Native components and variant foundation. Audit plan,
workout recovery, backups, sharing/import/export and statistics paths before
implementation. No blanket conversion of other exercises. No migration of
historical goblet IDs. Verify both configurations, old snapshots, persistence,
localization RU/DE/FR and native artwork exports. Source archiving remains
pending-upload; no per-exercise ZIP. Implementation plan follows design approval.

Approved by user after the two-screen concept on 2026-10-31. Keep current charts and MuscleMap.
