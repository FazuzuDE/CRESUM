# Internal device builds

Status: repository preparation only. No EAS project is linked, no signing
credentials are configured, no cloud build was submitted and no installable
artifact or physical-device acceptance is claimed by this checkpoint.

## Profiles

`eas.json` provides `preview`: an internal, bundled application for physical
iPhone and an APK for Android. It does not use a development client or require
a running Metro server. `preview-simulator` inherits it and targets the iOS
Simulator; that artifact cannot be installed on an iPhone.

Node follows `.nvmrc` (22.16.0). Versions remain local. There is no production
or store-submission profile. Keep the compatibility identifiers `com.fitflow.app`
and both deep-link schemes; see REBRANDING.md. A same-identifier installation may
replace an existing installation: export any real local data before testing.

The first profiles deliberately exercise offline Core: local dotenv loading is
disabled, Supabase public client values use the `disabled` sentinel, sharing and account deletion
are off. No remote account or domain is needed for offline workout acceptance.
RU/DE/FR remain release-disabled; this initial build alone cannot close their
native acceptance. Separate internal-language QA preparation remains required.
EAS rejects empty environment strings. The intentional non-URL sentinel makes
the existing Auth adapter return unconfigured before creating a client, even if
the remote preview environment has account values. It is not an endpoint or key.

## Build inputs

`.easignore` retains the project's existing ignore rules and excludes local
execution notes and generated browser evidence. It keeps app/assets/library and
`modules/cresum-picker/` source, podspec and Expo module registration. Never upload
dotenv files or signing keys. Configure service values through the chosen EAS
environment when that later slice is authorized, not by shipping local secrets.

The picker is a local Expo native module. Expo Go cannot load it. Autolinking
resolution is checked locally, but JS export does not compile Swift/UIKit.

## First build handoff

1. Choose the owner's Expo account/project and confirm its access before linking.
   Use the repository-pinned Node/npm and a current EAS CLI; record the actual
   CLI version in the build log. Run `npx eas-cli@latest login` locally.
2. Run `npx eas-cli@latest init` interactively under the intended account. Since
   this repository uses dynamic app.config.ts, record the real returned project
   ID in its `extra.eas.projectId` configuration in a focused follow-up and
   review that change. Do not invent an ID or accept another account's project.
   Check the resolved configuration before uploading/building.
3. For a physical iPhone cloud build, a paid Apple Developer membership and a
   provisioning profile including that iPhone are required. Run
   `npx eas-cli@latest device:create` and register the tester's device through the
   provided enrollment flow. Keep Apple credentials and private device/signing
   material out of chat and Git. With no paid membership, local Xcode on a Mac
   is the alternative to investigate; the cloud simulator profile is not a
   physical-device substitute.
4. Once account/project/signing are verified and the source commit is clean,
   launch `npx eas-cli@latest build --platform ios --profile preview`
   interactively. Confirm the existing bundle identity and registered device.
   Record the actual source SHA, CLI version, build ID, logs and artifact link.
   Cloud execution and any associated quota/payment require the owner's account;
   no job is started by the committed configuration.
5. Install through the resulting internal-distribution link on the registered
   iPhone. In Expo project settings, restrict unauthenticated build-link access
   if the owner wants authenticated distribution. A link alone does not make an
   artifact private. Verify the included device list after provisioning changes.
6. Android follows with `npx eas-cli@latest build --platform android --profile
preview`, producing an APK. Keep signing identity consistent for later updates.
   For a Mac simulator only, use `--platform ios --profile preview-simulator`.

Do not run `eas build:configure` over these profiles without reviewing its diff.
Do not enable cloud features or change language release flags to make a build
appear accepted. Domain/mail, real account/sync/deletion and public sharing retain
their own rollout gates.

## First physical acceptance record

All rows remain **Pending** until an actual installation is exercised. Record
device/OS, source/build ID, result and evidence for each row.

| Check                                                                 | iPhone  | Android |
| --------------------------------------------------------------------- | ------- | ------- |
| Native compile, install and offline cold launch                       | Pending | Pending |
| Onboarding and accepted program retained after relaunch               | Pending | Pending |
| All exercise sets, exact comma input, bilateral values and Finish     | Pending | Pending |
| Rest/background/foreground and active-session recovery                | Pending | Pending |
| History, volume and completed program slot after relaunch             | Pending | Pending |
| Native wheel fast flick → Save/Keypad, cancellation and date clamping | Pending | Pending |
| Keyboard, safe areas, Dynamic Type and screen reader                  | Pending | Pending |
| File export/restore/share and interrupted operations                  | Pending | Pending |

On Android, the picker uses the supported fallback, not the iOS UIKit module.
Account/sync/sharing acceptance is outside this offline profile. Web/renderer
tests and native JS exports are separate evidence, never a pass in this table.

## Preparation verification — 2026-10-25

- Official `@expo/eas-json` 25.3.0 accepts eas.json and resolves physical iOS,
  Android APK and inherited simulator profiles with Node 22.16.0 and the intended
  service values. The validator is temporary tooling, not an app dependency.
- Expo public config under the actual preview environment resolves CRESUM with
  both legacy application IDs, no sharing associations and no invented project ID.
- Apple autolinking resolves CresumPickerModule and its podspec. Representative
  upload-rule checks retain Swift/podspec/module metadata and package-lock.json,
  while excluding dotenv/signing files and local execution evidence. This is not
  an uploaded EAS archive or compiled native binary.
- Full `npm run check`: 135 suites / 1082 tests pass, including online dependency
  validation. iOS/Android JS exports and diff/format checks pass. Independent
  review found no material issues. Local Node was 24; pinned Node 22 CI remains
  the integration gate.

## Verification references

Official Expo documentation checked 2026-10-25:

- [Build profiles](https://docs.expo.dev/build/eas-json/)
- [Internal distribution and provisioning](https://docs.expo.dev/build/internal-distribution/)
- [Upload exclusions](https://docs.expo.dev/build-reference/easignore/)
- [Environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Local Xcode versus EAS](https://docs.expo.dev/develop/development-builds/introduction/)
