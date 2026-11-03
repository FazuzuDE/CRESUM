# Exercise character verification — 2026-11-03

Scope: welcome/Profile preference and one approved Female Goblet Squat pair.

- Parser RED → GREEN: persist Female, accept absent legacy preference, reject
  unsupported model values without modifying the workout document.
- App flow RED → GREEN: welcome/back/relaunch; Profile/save/restart; failed save
  and retry, including leaving for Exercise Library and returning; reject a
  concurrent second selection; defer personalization/reset during a pending write;
  keep first-run character step outside personalization; block selection while
  program acceptance recovery is outstanding.
- Rendering RED → GREEN: thumbnail, inline FINISH and fullscreen START update
  from one context in both directions; missing Female variants return null and
  show localized visible pending copy rather than Male artwork.
- Existing onboarding/profile/reset/program/backup regression set: 64 passed.
  Focused final review-fix set: 46 passed. Localized onboarding: 3 passed.
- Backup round-trip preserves Female. The final flow fixture includes a real
  active workout with a completed 32.5 kg × 8 set and compares stored workout
  bytes before/after the preference change.
- Independent read-only review found five P2 issues; each was addressed with
  the behavioral regressions above. No second review pass was requested.
- Final iOS and Android Hermes exports succeeded using Node 22.16.0. Exported
  Female phase hashes and the preserved Master reference hash match the manifest.

Physical iPhone/Expo Go, VoiceOver/TalkBack and independent biomechanics review
remain device/human checks. Browser screenshot QA was unavailable because the
Chromium download did not produce a usable archive. No browser/device visual
acceptance is claimed. The pair retains user-selected-provisional status.

The prepared local branch combines the PR176 Female Master checkpoint and this implementation;
its current requirements supersede the earlier draft's unspecified UI behavior.

Final complete suite: **148 suites, 1366 tests passed** on Node 22.16.0.
Typecheck, lint, formatting, anatomy, localization and public config checks passed.
The online dependency check reached an HTTP proxy timeout; the Expo offline
native-version check passed, using bundled SDK metadata. Dependencies were unchanged.

The offline Expo command reported “Dependencies are up to date” but also warned
that validation is unreliable offline; full online dependency verification remains
unconfirmed. GitHub delivery initially required explicit approval, which the user then
provided for FazuzuDE/CRESUM and PR176. The shell Git transport has no credentials;
the authorized connected-account transport preserves the tested repository tree.
Remote CI and ready-for-review status are recorded on PR176.
