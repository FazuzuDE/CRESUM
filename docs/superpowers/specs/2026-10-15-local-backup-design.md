# Local backup and restore

Approved intent: a person can export their CRESUM data to a file and restore it after loss. Keep offline Core, active workouts and current data safe. Cloud backup is separate.

## File and validation

Profile offers Export backup and Restore backup. A version-1 JSON envelope identifies CRESUM, creation time and five whitelisted documents: workout state, onboarding, program, body-weight journal and hidden built-ins. Include active workouts and exact historical snapshots; exclude auth, unrelated storage and old migration copies. Validate every document using its existing repository before offering confirmation, plus duplicate identity checks. Reject unknown format/version, incomplete documents and oversized files (20 MiB file / 10 million JSON characters). Files are plaintext personal data, stated in the UI.

## Restore contract

Restore replaces the local snapshot, not a merge. Preview creation date, history/routine/measurement counts and presence of an active session. Confirm explicitly; cancel changes nothing. Block restoration while this device has an active workout, unready data or unsaved workout changes. Recheck after draining pending writes. The operation temporarily hides and disables the writable app while preserving its in-memory state on failure, drains program/onboarding/workout/visibility/measurement queues, then executes, preventing new UI writes. Remount all repositories after successful restore, or after recovery of an ambiguous restore error only if the preflight verified all in-memory changes saved; a restored active session can be resumed normally.

Before replacing any key, persist and verify a rollback journal containing the exact old values of all local keys. Replace canonical documents and clear obsolete migration keys, verify readback, then remove and verify removal of the journal. Any failure rolls back exact old values. Interrupted transactions roll back on startup before any repository loads. If rollback cannot complete, keep the journal and block normal app writes with Retry recovery. Do not claim successful restore on a failed write or incomplete rollback.

## File access and UI

Use SDK-matched expo-file-system, expo-document-picker and expo-sharing for native Files/share flows; keep a separate web download/input adapter. No server, login or credentials. Sharing completion does not prove the user saved the file. Picker cancel is silent. Show errors, busy states, retry and readable shared-token controls. Physical native share/picker/kill-during-restore acceptance is still required.

## Verification

Test full roundtrip, malformed and future versions, duplicate IDs, all documents, oversized input, cancel, active guards, pending writes, journal durability, each partial write failure, silent write failures, rollback failure and startup retry. Verify the actual App/Profile integration, TypeScript, lint, formatting, full tests, Expo config/dependencies and iOS/Android exports.

Implementation review corrections: live error refs detect sidecar saves failing during drain; the restore operation grants reload permission only after a saved-state preflight. Startup recovery attempts share a promise to handle duplicate lifecycle effects. These changes preserve in-memory drafts while preventing stale in-memory stores from overwriting an ambiguously committed restore.

Native API references: https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/ ; https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/ ; https://docs.expo.dev/versions/v57.0.0/sdk/sharing/ . Installed SDK57 type definitions were checked directly.
