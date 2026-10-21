# CRESUM multilingual application

Date: 2026-10-21. Status: written specification approved by the user on
2026-10-21; implementation plan awaiting review. This document specifies future
implementation, not shipped capability.

## Intent and scope

The user approved Russian, German and French, retaining existing English, with
device-language selection, a persistent Profile language control, offline
translations and unchanged workout/history data. The user then requested later
expansion to the top 30 languages. Treat that as 30 supported languages in total,
including the initial four; the later language list and order require a market
and audience decision, not a guessed universal ranking.

Success means the entire existing workout flow is usable consistently in each
initial language: Onboarding → Home → Workout → Sets → Rest → Finish → History →
Progress, plus Profile, library, routines, programs, backup and account screens.
Translate visible labels, validation, confirmations, empty/loading/error states,
accessibility labels and existing technique/help content. Translate catalog,
muscle, equipment and built-in program labels without changing their identity,
configuration or scientific meaning. Preserve CRESUM as the brand name; existing
tagline copy belongs in the message inventory for editorial review.

## Approach and boundaries

Use one app-level localization service, bundled catalogs per locale, and a React
provider/hook. Screen code requests stable semantic keys with named parameters;
it does not select languages with conditional branches. Catalog presentation is
a separate adapter keyed by existing exercise/taxonomy/program IDs. Domain,
storage, backup and sync contracts remain independent from UI language.

Two alternatives were considered: translating only navigation would leave the
training flow inconsistent; a remote translation service would add connectivity,
publication and recovery requirements. Bundled catalogs with complete initial
coverage satisfy the approved offline requirement and can grow incrementally.

The implementation plan must verify the chosen localization engine and device
locale API against the repository's Expo/React Native versions before dependency
installation. The engine must support CLDR plural categories, named parameters,
typed keys, explicit locale formatting and isolated tests. Do not build a
handwritten English-only singular/plural engine or couple consumers to a vendor.

## Language selection and persistence

- Initial supported language tags: `en`, `ru`, `de`, `fr`. The registry contains
  tag, native label, direction and release status; additional entries need no
  screen-specific language switches. Only validated locales enter the picker.
- Profile → Language offers System, English, Русский, Deutsch, Français. Native
  language names keep the control recognizable after an accidental change. A
  language action is also reachable from the first onboarding screen.
- Default preference is System. Resolve the device's ordered language list to
  the first supported base language (`de-AT` → `de`, `fr-CH` → `fr`), otherwise
  English. Use the resolved app language for formatting, not an unrelated device
  language. A manual selection overrides device changes; System re-resolves on
  foreground. No restart is required for the initial four LTR languages.
- Store a versioned device-local preference under a new CRESUM settings key,
  separate from workout documents. Serialize writes; acknowledge a change only
  after persistence succeeds. A failed write keeps the previous language and
  displays a translated retryable error. Guard against a late initial read
  overwriting a subsequent explicit choice.
- Resolve settings before the app's initial content render, with a small loading
  state. If reading fails or the stored value is invalid, keep workouts usable
  with the System-derived language and show a retryable settings notice.
- Changing language rerenders content without remounting workout stores, timers,
  navigation or editors. Preserve selection, scroll where practical, input
  drafts, active workout identity and completed-set state.
- Include this local preference in the existing confirmed reset with rollback
  protection, returning to System after a successful reset. Do not add it to
  workout backup or cloud sync in this slice. Backup import/restore and sign-in
  retain the current device language; existing backup formats remain valid.

## Message catalogs and coverage

Keep English as the complete reference catalog. Each initial locale must match
its required semantic keys, parameters and plural branches. Missing messages
fall back to English at runtime rather than exposing keys or blank controls;
CI rejects missing initial-locale coverage before release. Fallback is recovery,
not permission to ship a partially translated main flow.

Use complete sentences, named interpolation and locale-aware plural forms.
Do not concatenate translated fragments or assume adjective order, capitalization
or English plural categories. Keep plain text values; translations cannot supply
executable code, arbitrary markup or asset paths. No live machine translation,
translator accounts or translation-management admin is introduced.

Enumerate app-authored errors and associate them with stable presentation keys
at the relevant boundary. Preserve existing domain success/failure semantics and
structured diagnostics. Do not translate by matching arbitrary SDK error text,
expose raw backend messages, or replace actionable failures with false success.
Unknown failures use an appropriate localized generic message with existing retry
behavior. Provider-generated email, native OS dialogs, legal documents and
third-party content are outside app-controlled translation; document them in the
coverage report instead of claiming they changed.

## Catalog and historical identity

Read `docs/EXERCISE_LIBRARY.md` before implementing catalog presentation. Translate
current catalog names, muscle/equipment labels and built-in routines/programs by
stable ID. Search matches localized names plus canonical English names and
existing aliases; filters and performance comparisons retain their existing IDs.
Unknown IDs retain existing unavailable/snapshot behavior.

Never rewrite saved exercise names, muscle labels, user routine names, history,
weights or repetitions on locale change. Workout snapshots retain their stored
meaning. Render a localized current catalog label in library/new-choice contexts;
historical snapshot titles stay as recorded, with localized surrounding controls.
Do not infer that a saved custom name is a built-in label by text equality. New
workout persistence continues to use the existing canonical snapshot contract;
localized display strings must not become identity or matching keys. No workout
schema migration is authorized by localization.

## Dates, numbers and units

Use the resolved locale for display dates, numbers, grouping and units. Preserve
timestamps, time zone/day boundaries, kilograms, timer durations and analytics
formulas. Language does not select a different measurement system or rewrite a
stored numeric representation.

Numeric editing accepts decimal comma and decimal point consistently in the
initial languages, without treating a comma as a thousands separator. Reject
ambiguous/mixed separators and invalid values; retain existing range and integer
rules. Normalize at the input boundary into the existing engine format. A locale
switch preserves a partially entered draft verbatim until validation/save; never
reparse a draft silently. Test picker, keypad and exact-entry paths together.

## Layout, accessibility and expansion

Reuse existing theme tokens, components and system typography. Permit wrapping
and flexible button height for longer translations; never shrink text until it
is unreadable. Test small phone widths, Dynamic Type, safe areas, loading/error
states, spoken labels and color-independent summaries in all four languages.

The later 30-language rollout uses the same registry, message contracts, catalog
adapter and coverage checks. Add locales in reviewed batches after prioritizing
audiences. Script/font coverage and text expansion are per-locale acceptance
items. RTL locales additionally require direction-aware layout, navigation,
icon/chart review and verified restart behavior where the platform requires it;
the LTR first release does not claim RTL readiness. Test a pseudo-locale during
development for text expansion, without publishing it as a supported language.

## Verification and delivery

1. Inventory all app-controlled copy and formatting, including non-component
   errors, accessibility labels and catalog/program content. Record exclusions.
2. Implement the locale service/settings and adapters with resolver, fallback,
   interpolation/plural, persistence/race/failure, decimal-input and coverage
   tests. Use tests of behavior, not snapshots of the entire dictionary.
3. Translate and connect existing screens in focused slices. An intermediate PR
   must state partial coverage; do not enable incomplete locales as release-ready.
4. Verify language switching during a live workout, rest, set editing and error
   recovery. Compare stored data before/after; verify finish, restart, backup and
   sync identity are unaffected. Exercise reset success and rollback.
5. Run full quality checks and native exports. Review four-language phone layouts
   and screen-reader labels; physical-device acceptance remains explicit.
6. Report exact coverage, remaining external text and device checks. A written
   implementation plan follows review of this specification. No admin editor,
   regional muscle scoring or new translation server is part of this work.
