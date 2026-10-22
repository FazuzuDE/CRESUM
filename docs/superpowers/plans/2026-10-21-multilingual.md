# Multilingual Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete offline English/Russian/German/French support, extensible to 30 total languages, without changing workout identity or historical content.

**Architecture:** One locale store/provider owns device/manual selection. A typed translation facade wraps bundled i18next resources; separate catalog and formatting adapters localize presentation while domain/storage values remain canonical.

**Tech Stack:** Existing React Native 0.86.3 / React 19.2.3 / Expo 57 / TypeScript 6, AsyncStorage, i18next (exact resolved version locked during Task 1), Expo-compatible `expo-localization ~57.0.2`, and `intl-pluralrules` for Hermes plural support. No network loader or translation server.

**Spec:** [Approved multilingual design](../specs/2026-10-21-multilingual-design.md).

## Global Constraints

- Initial supported language tags: `en`, `ru`, `de`, `fr`.
- Default preference is System; only validated locales enter the picker.
- Use the resolved app language for formatting, not an unrelated device language.
- Changing language rerenders content without remounting workout stores, timers, navigation or editors.
- Never rewrite saved exercise names, muscle labels, user routine names, history, weights or repetitions on locale change.
- No workout schema migration is authorized by localization.
- Do not add the language preference to workout backup or cloud sync in this slice.
- Preserve existing units, time zones/day boundaries, analytics formulas, IDs and muscle mappings.
- Later expansion is 30 total languages; additional markets and RTL acceptance remain separate decisions.
- Run under Node 22.16+/npm 10 per package.json. Read AGENTS.md, product/design/roadmap and EXERCISE_LIBRARY.md before execution; preserve newer integrated work.

## Review Focus

1. A late preference read or rapid repeated selection must not overwrite the latest successful choice (Task 2).
2. Reset rollback and backup restore must preserve the correct device language without changing backup schemas (Task 2).
3. A locale switch during a comma-decimal draft/rest timer must not reparse input, reset state or write workout data (Tasks 4/5).
4. Renamed or unknown historical exercise snapshots must remain unchanged and must not be relabeled by string equality (Tasks 3/6).
5. Hermes without native Intl.PluralRules must produce correct Russian categories, including 0, 1, 2, 5, 11, 21, 22, 25 and fractional counts (Tasks 1/8).

## File and responsibility map

- `lib/i18n/{registry,engine,messages,format,catalog,errors,preference-store}.ts`: locale metadata, vendor facade, typed keys/parameters, formatting, catalog presentation, coded error presentation and serialized settings respectively.
- `lib/i18n/locales/{en,ru,de,fr}/{common,onboarding,workout,catalog,progress,profile}.ts`: six plain-text namespaces per locale; English is the reference, target plural categories may differ.
- `components/{LocalizationProvider,LanguageSettings}.tsx`: stable context subscription and accessible language selector.
- `scripts/check-localization.cjs`, `docs/LOCALIZATION.md`: AST-assisted copy inventory/coverage checks and explicit exclusions/acceptance ledger.
- Existing screens receive translation/formatting calls in place. Preserve state owners and shared components; do not replace the navigation or repository architecture.
- New tests live in `lib/__tests__/i18n-*.test.ts[x]`. Existing flow tests retain their English baseline through an explicit test locale fixture, not the developer machine's language.

### Task 1: Typed messages, locale resolver and coverage contracts

**Files:** Create registry/engine/messages, initial locale resources, coverage script, `docs/LOCALIZATION.md`, `lib/__tests__/i18n-engine.test.ts`; modify package.json/package-lock.json and Jest setup only as needed for isolated locale fixtures.

**Interfaces:** Export `AppLocale = 'en' | 'ru' | 'de' | 'fr'`, `LanguagePreference = 'system' | AppLocale`, `resolveLocale(preference: LanguagePreference, deviceTags: readonly string[]): AppLocale`, and `createTranslator(locale: AppLocale): Translate`. Define `MessageParams` keyed by semantic message key; `Translate` is `<K extends keyof MessageParams>(key: K, ...args: MessageParams[K] extends undefined ? [] : [MessageParams[K]]) => string`. Only the engine imports i18next. Registry entries carry nativeName/direction/release status; eligibility is separate from known locale identity.

- [ ] Add failing resolver/plural/interpolation/fallback tests: `resolveLocale('system',['es-ES','de-AT']) === 'de'`; unsupported-only → `en`; manual `fr` beats `ru-RU`; malformed tags do not throw. Russian set-count fixture renders correct words for 0/1/2/5/11/21/22/25/1.5; missing target message falls back to English; inserted user text remains literal text. Type-level fixtures reject unknown keys and missing required parameters.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/i18n-engine.test.ts`; confirm missing-module/behavior failure before implementation.
- [ ] Verify package metadata/engine compatibility, then install i18next with an exact locked version, `intl-pluralrules`, and `npx expo install expo-localization`; verify the latter resolves within the installed Expo manifest's `~57.0.2`. Initialize the plural polyfill before creating translators. No global mutable translator shared between tests; no remote backends, Suspense or HTML resources. Validate `Intl.NumberFormat`/`DateTimeFormat` for all four locales in native acceptance.
- [ ] Inventory every rendered string, accessibility prop, dynamic domain message and formatter in app/, components/, lib/ plus existing native-module controls. Record source file, semantic key, namespace, owner and coverage status in LOCALIZATION.md; explicitly list OS dialogs/provider email/legal/third-party exclusions. Populate English resources with complete sentences, not concatenated fragments. Do not invent missing technique content.
- [ ] Implement coverage checks: semantic keys and interpolation parameters match; required plural branches follow each locale's CLDR categories rather than English suffix parity; catalog IDs and native picker entries are valid; target text is nonempty. During staged implementation, only completed locales are selectable. Scan app-controlled text via TypeScript AST and reviewed explicit exclusions; a grep-only claim of completeness is insufficient. Add `i18n:check` to package quality command; test deletion of a Russian required form and wrong parameter as failing fixtures.
- [ ] Run focused tests, `npm run typecheck`, `npm run deps:check`, `npm run i18n:check`; commit `feat: add typed offline localization foundation`.

### Task 2: Durable preference and language controls without state remounts

**Files:** Create preference-store, LocalizationProvider, LanguageSettings, `lib/__tests__/i18n-preference.test.ts`, `lib/__tests__/i18n-settings.test.tsx`; modify app/_layout.tsx, components/ProfileSettings.tsx, components/Onboarding.tsx, lib/local-data-reset.ts and reset/backup tests.

**Interfaces:** Export `LANGUAGE_PREFERENCE_KEY = 'cresum_language_preference_v1'`; store serialized `{version:1, preference:LanguagePreference}`. `LocaleSnapshot` has preference/locale/loading/saving/error; `LocaleStore` exposes `getSnapshot`, `subscribe`, `load():Promise<void>`, `select(value):Promise<boolean>`, `refreshDeviceLocales():void`, `waitForPendingWrites():Promise<void>`. `useLocalization()` returns snapshot, `t: Translate`, `select`, `retry():Promise<void>`. Provider accepts injected store/device source for tests and stable children; never use locale as a React key.

- [ ] Write failing tests for delayed reads, rapid de→fr writes, a rejected write, invalid JSON, failed reads, manual preference across foreground changes, and System resolving an updated ordered device list. Assert the latest successful choice survives restart and failed writes preserve the previous acknowledged choice.
- [ ] Run the two new test files to confirm RED, then implement serialized settings with generation guards and device `getLocales()` boundary. Profile and first onboarding screen open the same System/native-name selector with selected/busy/error/retry states and 44pt targets. Initial loading cannot recreate workout stores; read failure uses System and exposes recovery while Core remains usable.
- [ ] Add the preference key to reset-only keys, **not** shared `LOCAL_DATA_KEYS` (that list also feeds backups). Coordinate locale pending writes through the existing data-operation gate. After successful confirmed reset reload System; on rollback retain the original preference and state. Keep restore/sign-in from writing this key.
- [ ] Assert reset failure restores the language, reset success removes it, exported backup excludes it, importing old/current backup retains it, and repeated sign-in/out preserves it. Run `npm test -- --runTestsByPath lib/__tests__/i18n-preference.test.ts lib/__tests__/i18n-settings.test.tsx lib/__tests__/local-data-reset.test.ts lib/__tests__/local-backup.test.ts`; check actual existing backup test filename before invoking if it changed upstream. Commit `feat: add persistent application language selection`.

### Task 3: Localized catalog presentation and search

**Files:** Create catalog adapter and `lib/__tests__/i18n-catalog.test.ts`; populate catalog resources. Modify components/ExerciseLibrary.tsx, WorkoutTemplates.tsx, TemplateEditor.tsx, WorkoutProgram.tsx, TrainingProgramWeek.tsx, ExerciseTechnique.tsx and technique viewer controls. Read existing technique/program metadata without changing mechanics.

**Interfaces:** `catalogLabel(locale:AppLocale, kind:'exercise'|'muscle'|'equipment'|'program'|'template', id:string, fallback:string):string`; `searchLocalizedExercises(filters:ExerciseFilters, locale:AppLocale):LibraryExercise[]` returns original catalog records in curated order. Labels use canonicalExerciseId for aliases; matching preserves AND muscle/equipment filters. No caller persists an adapted copy.

- [ ] Write RED tests: German/localized and English searches find the same IDs, alias searches resolve the established ID, filters combine unchanged, unknown ID uses fallback, custom template names matching an English built-in label are untouched. Deep-compare canonical catalog and saved snapshots before/after adapter calls.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/i18n-catalog.test.ts` to confirm RED; implement label/search adapters and all existing catalog, equipment, muscle, program, technique/control translations in four locales. Preserve exact exercise-variant distinctions and unresolved mapping statuses. At saved-session boundaries keep snapshot titles instead of relabeling them from ID.
- [ ] Verify search/filters, template editing and program selection tests plus the new adapter suite; commit `feat: localize catalog labels and search without changing identities`.

### Task 4: Locale formatting and safe numeric entry

**Files:** Create format adapter and `lib/__tests__/i18n-format.test.ts`; modify lib/set-entry.ts, body-weight.ts, components/SetEntrySheet.tsx, TemplateEditor.tsx, BodyWeight.tsx, AppPicker.tsx, DatePickerSheet.tsx, CalendarMonth.tsx, HistoryDatePicker.tsx and HistoryCountWheel.tsx at their display/input boundaries.

**Interfaces:** `formatNumber(locale,value,options?:Intl.NumberFormatOptions):string`, `formatDate(locale,epochMs,options?:Intl.DateTimeFormatOptions):string`, `normalizeDecimalInput(raw:string):string|null`. Formatters use explicit locale with existing date/time-zone options; parser accepts ASCII digits and one comma OR point, normalizes comma to point, trims only outer whitespace, rejects mixed/repeated separators/grouping/Infinity/exponents. Existing domain range/integer checks remain authoritative.

- [ ] RED assertions: `'12,50'` and `'12.50'` normalize to `'12.50'`; `'1,234'` → `'1.234'` (never 1234); `'1,234.5'`, `'1 234'`, `'1e3'` → null. Locale formatting keeps numeric value unchanged; date formatting does not change epoch or local-day grouping. Set, bilateral, body-weight and template starting-weight rules retain their existing bounds.
- [ ] Run the new suite RED; implement normalization at existing save/validation boundaries and display formatting separately. Never bind formatted grouping back into stored weight strings. Use existing precise increment arithmetic; keep raw draft on locale switch and mark invalid only on existing validation actions. Localize native wheel accessibility values and fallback picker controls without altering selection indices.
- [ ] Add a mounted editor test: type `'12,'`, switch ru→de→fr, assert draft and exercise/set IDs persist; finish as `'12,5'`, save, assert canonical `'12.5'`. Run new format suite and existing set-entry, picker and body-weight suites; commit `feat: localize formatting and preserve exact numeric drafts`.

### Task 5: Onboarding, Home and active training

**Files:** Modify app/index.tsx, components/Dock.tsx, Onboarding.tsx, HomeDashboard.tsx, HomeCalendar.tsx, HomeLayoutEditor.tsx, HomeDragGrid.tsx, Workout.tsx, WorkoutProgram.tsx, SetEntrySheet.tsx, Confirmation.tsx, ScrollReturnButton.tsx and shared control defaults that contain copy. Populate common/onboarding/workout namespaces. Create errors.ts and `lib/__tests__/i18n-workout.test.tsx`.

**Interfaces:** Use Task 2's hook and Task 4's formatters; `presentAppError(t:Translate, error:unknown, fallback:keyof MessageParams):string` maps known coded failures to message keys. Add stable error codes at app-authored error creation boundaries as needed; retain Error identity/diagnostic message and existing status semantics. Never map by arbitrary English text or throw backend text into the UI.

- [ ] Write failing four-locale flow tests covering start, exact set edit/save, complete, rest, next exercise, Finish and History persistence. For a mid-rest language change assert no extra storage writes, unchanged timer deadline, IDs, set count and draft; for persistence rejection assert localized actionable error and unchanged workout data.
- [ ] Run new flow suite RED; replace inventory-owned copy and accessibility values with sentence-level keys. Keep built-in labels localized only in current-choice contexts and saved snapshot titles as recorded. Translate loading, disabled, cancellation and destructive-confirmation states. Update shared English test fixtures to explicitly inject `en` rather than defaulting the production provider to English.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/i18n-workout.test.tsx` plus existing onboarding, workout persistence/finish/discard/reorder and Home tests; run typecheck/i18n:check. Commit `feat: localize onboarding home and workout flow`.

### Task 6: History, Progress and Muscle Map

**Files:** Modify components/WorkoutHistory.tsx, HistoryFilterModal.tsx, ExercisePerformance.tsx, ExerciseStatistics.tsx, TrainingVolume.tsx, VolumeTrendChart.tsx, EstimatedOneRepMaxBars.tsx, EstimatedOneRepMaxSeries.tsx, MuscleProgress.tsx, MuscleMap.tsx, app/index.tsx's Stats copy, lib/history-filter.ts presentation and progress namespace. Add `lib/__tests__/i18n-progress.test.tsx`.

**Interfaces:** Consume useLocalization, catalogLabel, formatNumber and formatDate from Tasks 2–4. Produce localized existing screen props/output without changing analytics or participation interfaces.

- [ ] Write RED tests for ru completed-set plurals, localized periods/date range and source-set drilldown, all 17 muscle labels, empty/one-point states, missing map coverage and Primary/Secondary meaning. Assert a custom/unknown saved title remains verbatim in all four locales and stored history/metrics/timestamps equal baseline after switching.
- [ ] Run new suite RED; replace text/formatting through earlier interfaces. Keep geometry, masks, participation, formulas, filtering/day boundaries and user snapshots unchanged. Include chart accessibility summaries, Front/Back and factual coverage notices in full sentences.
- [ ] Run new suite and existing history, muscle-participation, anatomical-map and analytics screen suites; run i18n:check. Commit `feat: localize history progress and muscle map presentation`.

### Task 7: Profile, account, backup and recovery coverage

**Files:** Modify components/ProfileSettings.tsx, AccountPage.tsx, AccountSection.tsx, AccountDeletionSection.tsx, BackupControls.tsx, BackupPage.tsx, LocalDataGate.tsx, HistorySyncPanel.tsx, HistoryConflictReview.tsx, useAccount.ts, useBackupArchive.ts, useHistorySync.ts and their inventoried lib/ error boundaries; populate profile resources. Add `lib/__tests__/i18n-recovery.test.tsx`.

**Interfaces:** Consume useLocalization and presentAppError from Tasks 2/5. Preserve every existing account/backup/sync component prop and domain return value; add presentation keys, not a replacement error transport.

- [ ] Write RED tests for translated invalid-email/OTP, backup validation/import failure, sync conflict, reset/retry and deletion-disabled states in each locale. Unknown SDK Error containing sensitive diagnostic text renders localized generic recovery without echoing its raw message. Assert failure remains failure and no data operation is retried merely by changing language.
- [ ] Run new suite RED; connect inventory-owned strings and stable app-error codes through presentAppError. Preserve auth, deletion rollout, cloud contracts and backup version/contents. Capture existing third-party/OS text exclusions in LOCALIZATION.md.
- [ ] Run new recovery suite and existing account, backup, reset, conflict and sync tests; require i18n:check and no unclassified app-controlled copy in the inventory. Commit `feat: localize profile account and data recovery`.

### Task 8: Release eligibility, native acceptance and final verification

**Files:** Update locale registry release status, scripts/check-localization.cjs, docs/LOCALIZATION.md, product/design/roadmap/decision status and add `lib/__tests__/i18n-release.test.tsx`.

**Interfaces:** Consume registry release status and coverage validator from Task 1; only fully covered locales may enter Task 2's selection UI. Produce a four-locale acceptance ledger with separate automated/web/native evidence.

- [ ] Add RED release checks: deleting a target message/parameter/plural form or one catalog label prevents locale eligibility; unknown registry language cannot be selected; development pseudo-locale expands text but is excluded from published picker/resources. Exercise the installed plural polyfill with native Intl.PluralRules unavailable, checking Task 1's count matrix independently from Node's native Intl implementation.
- [ ] Run suite RED, then finish coverage and mark ru/de/fr eligible only after Tasks 1–7 pass. Pseudo-localization stays a development test utility; initial release remains four LTR languages. No unreviewed 26-language list or RTL claim.
- [ ] Run `npm run check`, `npm run export:check`, `git diff --check`. Use real exported app in 320/390px layouts for all four languages and expanded text; inspect text wrapping, safe areas and every destructive/retry action. Verify no unexpected network requests for translations. Record physical iPhone/Android Hermes plural/formatting, screen-reader/Dynamic Type and foreground-language results explicitly; pending device checks remain release limitations.
- [ ] Request one independent whole-branch review, resolve material findings, and rerun only affected checks. Update docs with actual supported scope, exclusions and pending physical acceptance. Create focused PR(s) against develop; do not merge or claim 30-language readiness merely from registry extensibility. Commit `feat: validate four-language localization coverage`.

## Evidence and execution handoff

Native execution was approved 2026-10-22: one implementer and an independent
review. Implementation is in progress. Foundation/settings, decimal helpers and
catalog/library are checkpointed; remaining screen migration and full acceptance
are still pending. See ../../LOCALIZATION.md and the execution ledger for exact
evidence. Each task ends with its own commit/checkpoint; partial checkpoints do
not authorize enabling unfinished locales.

Next checkpoint connects active workout/set entry/rest/finish/discard and Home
dashboard/calendar/layout editing in all four locales. Actual mounted-screen
tests retain editable drafts, rest deadlines, storage identity and layout drafts
across language changes. Tasks 3–7 are still partial; onboarding, program and
technique screens, History/Progress and account/backup/recovery remain pending.

Official references checked for this plan:

- [Expo SDK 57 localization](https://docs.expo.dev/versions/v57.0.0/sdk/localization/): `getLocales`, foreground behavior and compatible module version; confirmed against installed expo/bundledNativeModules.json (`~57.0.2`).
- [i18next type safety](https://www.i18next.com/overview/typescript): facade/resources remain typed; verify the installed engine with the project's TypeScript 6 in Task 1.
- [i18next plural forms](https://www.i18next.com/translation-function/plurals): count-based CLDR categories and missing Intl.PluralRules handling. A browser-only success does not prove Hermes support.
