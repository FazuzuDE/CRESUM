# Application versions from pull requests

The user-approved visible version follows the actual PR number. Encode that
number in base-100 fields: major = floor(PR / 10000), minor = floor(PR / 100)
modulo 100, patch = PR modulo 100. Only the visible patch is padded to two digits.

| PR  | App display | Package / Expo version |
| --- | ----------- | ---------------------- |
| 98  | 0.0.98      | 0.0.98                 |
| 99  | 0.0.99      | 0.0.99                 |
| 100 | 0.1.00      | 0.1.0                  |
| 105 | 0.1.05      | 0.1.5                  |
| 200 | 0.2.00      | 0.2.0                  |

The normalized form keeps npm/Expo metadata valid SemVer. Profile shows the
requested padded form, including in Expo Go. This numbering tracks development
PRs; it does not describe API compatibility. It does not change workout/backup
schema versions, native installation IDs, EAS configuration or native build
counters. Release/store publication remains a separate workflow.

## PR workflow

1. Prepare the change on an isolated branch using the current version snapshot.
2. Open a draft PR and obtain its actual number. Do not predict the next number:
   GitHub shares the issue/PR number sequence.
3. Run `npm run version:pr -- <actual-number>`. Commit package.json,
   package-lock.json and app.json with the calculated normalized version.
4. Run checks and make the PR ready after validation. Repeat for every PR,
   including documentation-only changes. A version-stamp commit uses the same
   PR number; commits do not independently increment the version.

`npm run version:check` is the first stage of `npm run check`. In pull-request
CI it reads `GITHUB_EVENT_PATH` and validates against `pull_request.number`;
missing/malformed PR metadata fails closed. Locally and on non-PR events it
checks the declared version's encoding and all four synchronized fields:
package version, lock root version, lock root package version, and Expo version.
Checks never write files or query GitHub. Version generation writes only these
metadata fields and preserves dependency versions and native identities.

References:
[SemVer format](https://semver.org/),
[Expo app version fields](https://docs.expo.dev/build-reference/app-versions/).
