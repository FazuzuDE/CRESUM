# CRESUM rebranding

CRESUM is the product name. The app display name is `CRESUM`, the npm package
and Expo slug are `cresum`, and new app links use `cresum://`.

## Compatibility identifiers

These technical identifiers intentionally retain the former name:

- `com.fitflow.app` on iOS and Android identifies the existing installed app.
  Changing it creates a different application rather than an update, with a
  separate local storage container and signing/store configuration.
- `fitflow_state_v1`, `fitflow_history`, `fitflow_active`, and
  `fitflow_templates` identify existing local workout data. Rebranding does not
  migrate, delete, or rewrite these keys or schema version 1.
- `fitflow://` remains a supported legacy URL scheme alongside `cresum://`.

The configuration check enforces the new brand and retained platform identity.
Display-name and URL-scheme changes need a new native build; JavaScript export
does not verify installation, signing, or deep-link handling on a phone.

## GitHub repository rename

Requested destination: `FazuzuDE/CRESUM`. The repository itself is still named
`FazuzuDE/FitFlow` until the owner or an authorized administration surface
performs the rename. A pull request cannot rename its containing repository.
Current source links and the local picker podspec deliberately keep the working
repository address until the rename is verified.

After the repository rename:

1. Verify the new repository URL, `develop`, open PRs, and Actions checks.
2. Replace repository links in documentation and
   `modules/cresum-picker/ios/CresumPicker.podspec` with the verified new URL.
3. Update local clones with `git remote set-url origin
https://github.com/FazuzuDE/CRESUM.git`.
4. Check repository-bound external integrations separately. No EAS project,
   OAuth callback, signing identity, or server directory is provisioned or
   renamed by this change.

Historical decisions and legacy-data tests may still mention the former name.
