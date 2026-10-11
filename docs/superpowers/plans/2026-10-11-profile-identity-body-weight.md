# Profile identity and body-weight implementation

1. Verify develop HEAD and baseline; isolate the feature branch.
2. Add compatible name/DOB parsing, calendar validation and adult-program eligibility tests.
3. Connect Welcome/name → Body details → Goal/Experience; use the persisted name on Home.
4. Move saved routines behind the Profile WORKOUTS entry; preserve operations and editor drafts.
5. Add separate serialized body-weight persistence, baseline seeding, measurement sheet and reused curve with a padded vertical range.
6. Include measurements in transactional local reset and test failed seed/read/reset recovery.
7. Synchronize owning docs; run typecheck, lint, format and the complete test suite. Verify the in-chat adaptation under conflicting host styles.
8. Publish a PR targeting develop without merging. Follow up with physical-phone acceptance; birthday greetings remain a separate future change.
