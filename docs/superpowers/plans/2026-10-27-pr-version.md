# PR-based application version implementation plan

> **For agentic workers:** use superpowers:executing-plans for this focused task.

**Goal:** PR 98 displays 0.0.98; PR 105 displays 0.1.05.
**Spec:** PRODUCT.md and PR_VERSIONING.md own the user-approved numbering rule.
**Architecture:** deterministically encode the actual PR number in the three
numeric version fields; pad only the visible patch field. Keep package/Expo
versions valid SemVer. Do not change native installation IDs or build counters.

## Task 1: Calculation, sync and visible version

- [x] Add `pr-version.test.ts`: examples 98/99/100/105/199/200, carry to major,
      invalid inputs, synchronized package/lock/Expo fields and stale-PR rejection.
      Change the Profile test to expect `0.1.05` for native `0.1.5`; watch RED.
- [x] Implement `versionForPullRequest(pr)` and `syncProjectVersion(root, pr,
checkOnly)` in scripts/pr-version.cjs. CLI writes with a supplied number,
      checks against GitHub pull_request metadata in CI, and otherwise checks local
      metadata coherence. Add version:pr/version:check scripts; run the check first
      in npm run check. The checker never writes files or queries the network.
- [x] Format the user-visible patch to two digits in ProfileSettings using
      lib/app-version.ts. Keep canonical Expo/package versions unpadded.
- [x] Synchronize the baseline to merged PR 98, then stamp actual PR 99. Verify
      targeted tests, full checks and both exports. Document the numbering rule.
- [x] Continue draft PR #99, preserve its actual number and obtain a fresh
      whole-change review. Fix the malformed-event finding with a failing test
      followed by the strict number guard and a passing full suite.

Final delivery: commit and publish to the existing PR branch, verify GitHub CI
and mark the draft ready. Do not merge or deploy. PR #99 records live delivery
status after this implementation checkpoint.

Local evidence under Node 22.16.0/npm 10.9.2: 143 suites / 1,144 tests, static
and content checks, and iOS/Android exports passed. The first online dependency
check timed out at the proxy; the final local run checked Expo dependencies
against the bundled SDK map. GitHub CI must run the normal online check. The
review finding is covered by malformed/missing event metadata and read-only
file assertions; targeted suites pass 21 tests.

Review focus: PR number comes from actual event metadata, no stale snapshot can
pass PR CI, zero padding never enters package/Expo SemVer, unrelated dependency
versions and installation IDs remain unchanged, missing version stays hidden.
