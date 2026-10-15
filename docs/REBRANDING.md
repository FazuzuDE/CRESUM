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

The owner renamed the repository to
[`FazuzuDE/CRESUM`](https://github.com/FazuzuDE/CRESUM). The new address and
merged #52 were verified on 2026-10-15; `develop` remains the integration branch.
Current documentation links and the picker podspec use the verified address.

Update existing local clones with:

```sh
git remote set-url origin https://github.com/FazuzuDE/CRESUM.git
```

Repository-bound external integrations still need their own verification. No
EAS project, OAuth callback, signing identity, or server directory is provisioned
or renamed by this change.

Historical decisions and legacy-data tests may still mention the former name.
