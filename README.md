# CRESUM v0.3 — Exercise Library & Progress

CRESUM is the current product name. See [rebranding and compatibility
notes](./docs/REBRANDING.md) for the retained storage/application identifiers
and the separate GitHub repository rename.

## New in v0.3

- Exercise library with 65 exercises and search
- Add exercises while a workout is active
- Three built-in workout templates: Upper Body, Push Day, Leg Day
- Create and persist custom workout templates
- Estimated 1RM records using the Epley formula
- Workout volume chart and recent history
- Active workout persistence, editable sets, rest timer, haptics

## Workout Core

Start a template, enter weight/reps, complete sets, use the rest timer, move
between exercises, and confirm Finish to save into History/Progress.
Active sessions recover after reopening. History is shown under Progress with
completed set details, total volume and explicitly estimated 1RM.

The Core implementation uses the approved [design system](./docs/DESIGN_SYSTEM.md).
See [workout verification and storage notes](./docs/WORKOUT_CORE.md).

## Run

```bash
# Node.js 22.16.0, npm 10.9.2 (see .nvmrc and package.json)
npm ci
npx expo start
```

Use a development client or Expo Go compatible with SDK 57. Availability of a
compatible Expo Go build depends on the platform; the latest store app may not
support this SDK.

## Checks

```bash
npm run check
npm run export:check
```

`check` runs TypeScript, ESLint, Prettier, Jest, Expo configuration and dependency
compatibility checks. `export:check` bundles the iOS and Android JavaScript; it
does not build native binaries. Use `npm run format` to apply formatting.

## Account and cloud delivery

The app remains usable locally without an account or backend configuration.
Profile → **Account** contains optional six-digit Email OTP authentication when
public Supabase client values are configured. Apple/Google remain disabled and
cloud workout backup is not enabled yet. See [setup and native acceptance](./docs/ACCOUNT_AUTH.md).

Supabase/Postgres is the approved Account + Cloud Sync direction. Integration
proceeds in focused PRs: Account/Auth → versioned cloud schema/RLS and sync
foundation → completed History backup/merge. Oracle infrastructure is separate
future work and is not required for this stage.

## Roadmap

See [the current roadmap](./docs/ROADMAP.md) for approved priorities. The root
[historical roadmap](./ROADMAP.md) retains earlier planning context.
