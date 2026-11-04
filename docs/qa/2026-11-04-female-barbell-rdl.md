# Female Barbell Romanian Deadlift integration — PR #182

User approved `exec-127a799e-767b-47e0-a1f4-2027e5ae0bdc.png`, native source
`libfile_e5c496fa2c588191bba44f6188dba66e`. Exact 887-square RGB WebP92/method6
halves: LEFT lowered hip-hinge START / RIGHT upright FINISH, matching Male
endpoints. Bind only `barbell-romanian-deadlift`/Female through shared resolver.
Preserve Male/dumbbell files, stable identity, top-down guide, hamstrings/glutes
Primary, lower-back/forearms Secondary and History.

## Validation

Node 22.16.0 / npm 10.9.2:

- 4 relevant Jest suites / 195 tests pass: artwork resolver, shared character
  artwork, technique catalog and technique screen. All seven Female pairs switch
  thumbnail/inline/fullscreen Male → Female → Male. Female Barbell Hip Thrust
  retains its localized pending placeholder.
- Typecheck, lint and whole-repository formatting pass.
- iOS/Android Hermes exports pass with both new assets.
- Source/export/input hashes and byte-for-byte crop reproduction verified.
- Independent review found no blocking findings.
- Actual PR #182 stamped to 0.1.82; version/public config/metadata formatting
  checked after the version-only change. Final remote tree must match local.

Relevant tests/native exports preceded the metadata-only version stamp. Full
suite and unchanged contracts are left to GitHub CI.

## Remaining acceptance

User-selected-provisional: exact grip/contact, knee/hip/spine angles, depth,
bar/plate consistency, foot/camera registration and physical-device/accessibility
acceptance remain open. Original, exact prompt and actual reference hashes
retained. No new live biomechanical source review claimed. Cumulative checkpoint
pending; Oracle deferred/unverified. Next: Female Barbell Hip Thrust preview with
bench support, awaiting user approval and not registered.
