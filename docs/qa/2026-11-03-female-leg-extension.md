# Female Leg Extension integration — PR #178

User approved the paired original `exec-058d92a7-edc4-4194-8295-503119b47c96.png`,
native source `libfile_3213e0159f388191ac87c9d2ba0b424d`. Exact 887-square RGB
WebP92/method6 crops: LEFT bent-knee START / RIGHT near-extended FINISH.
Only `leg-extension`/Female is registered through the shared artwork resolver.
Male assets, exercise identity, guide, quadriceps mapping and History are preserved.

## Validation

Node 22.16.0 / npm 10.9.2:

- 4 relevant Jest suites / 191 tests pass: exercise artwork, shared character
  artwork, technique catalog and technique screen. Thumbnail/inline/fullscreen
  all switch Male → Female → Male for the three registered Female pairs.
- Typecheck, lint and whole-repository formatting pass.
- iOS/Android Hermes exports pass with the new assets.
- Source/export hashes, dimensions, exact crop reproduction and all three actual
  reference hashes verified. Exact original prompt recorded.
- Independent review found no blocking findings.
- Actual PR #178 stamped to 0.1.78; version/public config and metadata formatting
  checked after the version-only change. Final remote tree must match local.

Relevant tests/native exports ran before the version-only metadata stamp. Full
suite and remaining unchanged CI contracts are left to GitHub CI.

## Remaining acceptance

User-selected-provisional: detailed hand/roller/shin/pivot contacts, knee range,
rigid registration, plate counts/selector continuity and physical-device/
accessibility acceptance remain open. Prompted plate counts are instructions,
not certified output counts. No new live biomechanical source review claimed.
Original remains in its native persistent source; cumulative checkpoint pending,
Oracle deferred/unverified. Next preview: Female Lying Leg Curl, awaiting user
selection and not registered by this PR.
