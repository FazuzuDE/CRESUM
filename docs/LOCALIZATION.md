# Localization coverage and contribution rules

English is the only release-enabled locale. Russian, German and French are
connected across the existing application flows; final web/native acceptance is
pending, so they are not yet offered as production language choices.

## Current status

| Area                                               | EN                   | RU / DE / FR                    |
| -------------------------------------------------- | -------------------- | ------------------------------- |
| Locale engine, plural and interpolation contracts  | Tested               | Tested                          |
| Common language/settings message pack              | Complete             | Complete                        |
| Active workout, set entry, rest and confirmations  | Connected            | Connected and tested            |
| Home dashboard, calendar and layout editor         | Connected            | Connected and tested            |
| Onboarding, proposal preview and schedule editor   | Connected            | Connected and tested            |
| Manual workout editor                              | Connected            | Connected and tested            |
| Catalog names and Exercise Library controls/search | Connected            | 105 labels + 29 messages tested |
| Program week and workout-template management       | Connected            | Connected and tested            |
| Technique controls and 65 exercise guides          | Connected            | 494 guide messages connected    |
| History details, filters and date/count pickers    | Connected            | Connected and tested            |
| Progress, exercise statistics, charts and muscles  | Connected            | Connected and tested            |
| Progress body-weight chart and measurement editor  | Connected            | Connected and tested            |
| Profile, account, backup and recovery              | Connected            | Connected and tested            |
| Device rendering/accessibility acceptance          | Existing limitations | Pending                         |

`npm run i18n:report` emits catalog counts, enabled locales, release eligibility,
source candidates and unclassified candidates grouped by file.
`docs/localization-pending.json` retains its compatibility filename and stores the
full inventory with file, line, text and syntax-parent context.
`docs/localization-classified.json` records exact reviewed sites and reasons;
it does not exempt entire files or future strings. Moving an internal token into
visible JSX invalidates that classification. The inventory includes technical
and canonical content: counts are not a percentage of translated UI.

The current resource catalog has 1468 semantic messages per language (19 common,
105 catalog labels, 29 library controls, 113 workout messages and 77 Home/calendar
messages, 36 History/date-picker, 90 onboarding/program-preview and 39 manual
editor messages, 74 program/technique/management messages and 494 technique-guide
messages, 163 Progress/statistics/chart/muscle/body-weight messages and 229
Profile/account/backup/recovery messages). Matching
key counts are a structural check, not independent linguistic acceptance. The native picker
receives labels/values from JavaScript; it has no separate English UI copy in its
current Swift implementation.

The active-workout test mounts the real app, changes RU → DE → FR with an open
set editor, saves a comma decimal, completes a set and switches language during
rest. It verifies unchanged session identity, rest deadline and workout storage
writes. It also covers translated unsaved-data and invalid-clock errors and a
single final history entry. Exact decimal display avoids floating-point rounding,
including manual values beyond JavaScript Number precision. A Home test preserves
the selected calendar date and unsaved block visibility across language changes.
These are renderer tests, not physical-device acceptance.

History presentation now translates controls, metadata, bilateral set details,
filter labels and date/count wheels. Tests retain the selected saved workout and
exact decimal snapshot, then change language with an unconfirmed date and count
selection and apply the filter. Calendar grouping, date bounds, stored titles
and history records are unchanged. Shared scroll-return accessibility messages
are translated as well. Progress coverage is recorded below.

Onboarding now translates name/body details, goals, experience, current program
names, complete movement previews, schedule controls, first-session reduction,
validation and save/load recovery. Date presentation follows the selected locale;
stored local dates and canonical program snapshots are unchanged. Tests switch
languages with an unfinished body-weight draft, chosen program, locked retry,
open start-date picker, custom schedule days and unsupported frequency. Locale
changes do not cause progress saves or retries. The legacy eligibility string API
remains compatible; the UI consumes coded issues instead of matching English text.

The shared manual workout editor translates editing, reorder/remove accessibility,
configuration, stale-exercise warnings, vanished-template failures and discard
confirmation. Tests preserve custom names, canonical exercise IDs, comma input,
order and failed-save drafts. Unknown callback diagnostics are replaced with a
localized retry message. Profile account/backup coverage is recorded below. These renderer tests do not
replace physical-phone layout, native wheel or screen-reader acceptance.

The pending candidate baseline was refreshed after this migration: removed UI
copy is no longer listed; newly reviewed candidates are semantic message keys,
the internal AppError class name and internal adjustment action names. No new
untranslated visible text was accepted through that refresh. Remaining domain
diagnostic messages are still inventoried even where the workout UI now presents
stable error codes in the selected language.

Workout/Home checkpoint validation: Node 22.16.0/npm 10.9.2 `npm run check` passed with
112 suites / 978 tests, including types, lint, formatting, anatomy, localization,
configuration and dependency checks. iOS and Android exports passed. Independent
review's exact-decimal rounding finding was reproduced and fixed; two translation
wording findings were corrected. Physical-device checks remain pending.

The subsequent History checkpoint passed 113 suites / 979 tests and all local
type/lint/format/anatomy/i18n/config checks; iOS and Android exports passed. Its
online dependency check hit an HTTP proxy timeout, including a separate retry.
Offline dependency validation reports installed versions up to date; this does
not substitute for the pending online dependency check. No packages changed in
the History checkpoint. Independent review's Russian count wording issue was
corrected and the additional count-wheel switching scenario passes.
History checkpoint CI run 241 subsequently passed the online dependency check
and the complete workflow.

Onboarding/manual-editor checkpoint validation: Node 22.16.0/npm 10.9.2
`npm run check` passed with 115 suites / 984 tests, including the online dependency
check. iOS/Android exports and `git diff --check` passed. The last empty-editor
message was verified in both exported bundles. Independent review found no
actionable bugs; its schedule/editor-action coverage gaps were filled with
passing regression scenarios. The full suite caught old raw-diagnostic assertions
and a lost explicit empty-editor instruction; the latter was restored in all
four languages. No packages or persisted schemas changed. Device acceptance and
the pending screen migrations above are still required before enabling RU/DE/FR.

Program/technique checkpoint: weekly dates, selection, status and recovery controls,
template menus, counts, errors and accessibility are translated. Built-in template
names use IDs; custom names and callback objects remain untouched. Regression
tests switch languages with a selected planned day, an open technique mistake
section, FINISH viewer and pending template deletion. Error diagnostics stay out
of user-visible retry messages. Source bibliography titles and publishers retain
their original names; links, canonical guide revisions and source IDs are unchanged.

All 65 technique guides have translated scope, setup, movement, checks, mistakes
and any adaptation note. `scripts/build-technique-messages.cjs` generates the English
reference from the authored technique catalog; `i18n:check` rejects a stale generated
reference and mismatched target keys. Guide tests verify every locale's lengths,
aliases and unchanged sources/revisions. Canonical English technique text remains
in the source inventory because it is authored domain content, not duplicate raw UI.
New baseline candidates were reviewed: message keys, the internal START phase
comparison and an interpolated translated badge; no new untranslated UI was accepted.
The subsequent Progress and account/backup/recovery checkpoints are described below.

The locale engine now reuses one private translator per language across component
mounts; custom resource overrides remain isolated. A local 100-call measurement
fell from 584 ms to 19 ms. Regression coverage verifies locale/override isolation,
the plural polyfill and both localized start-error paths. The drag-release test
uses a controlled clock to verify the 200 ms suppression window rather than depend
on renderer speed. No production gesture timing changed.

Program/technique local validation: six focused suites / 26 tests pass with a
30-second CLI timeout. Default-limit local full runs encountered timeout cascades;
the same 15-second workout scenario also timed out in an unchanged #71 checkout,
while an isolated current run passed in 3.97 seconds. Repository test limits were
not increased. The standard GitHub CI workflow remains a required integration gate;
these focused results do not claim a passing local full suite or device acceptance.
Program/technique exact-head CI run 244 subsequently passed all 118 suites / 990
tests, online dependencies, database contracts and iOS/Android exports.

Progress checkpoint connects overview periods and records, Training Volume,
logged exercise performance, library statistics, estimated-record bars/curves,
Muscle Map roles/coverage/source sets and the nested body-weight chart/editor.
Seventeen muscle labels use stable catalog IDs. Saved workout/exercise titles,
custom/unknown exercise searches, numeric drafts, selected periods, metric,
chart point, muscle and open set details survive language changes. Body-weight
validation and unknown save/load errors are localized without exposing diagnostics.

Numbers and dates follow the selected locale while tiny/huge values and exact
volume strings retain their precision. Tests preserve existing estimate rounding;
chart ticks accept an explicit locale without changing their scale or geometry.
Source-set weights remain exact decimal strings where the domain supplies them.
No anatomy paths, mappings, analytics formulas, time boundaries or persisted
schemas changed. Factual role colors, incomplete surface coverage and schematic
lumbar projections retain their original meaning.

Initial focused verification: ten suites / 64 tests pass. New regression cases
cover all four locales, completed-set plurals, all muscle labels, no-map coverage,
saved source names, source-set drilldown, the real app's retained overview period
and unchanged stored workout document, body-weight comma drafts and retry errors,
selected chart points and honest empty/one-point states. Native screen-reader,
small-phone and Dynamic Type acceptance remains pending. New baseline additions
were inspected: semantic message keys and numeric-only arrow/scientific templates;
no new untranslated UI was accepted. There are 2530 remaining source candidates,
including authored canonical/domain and technical strings; this is not a
translation percentage. Keep RU/DE/FR release flags off until remaining coverage
and device acceptance are complete.

Progress verification: the full local suite passed 120 suites / 1000 tests with
the repository's standard limits on Node 22.16.0/npm 10.9.2. Types, lint, formatting,
anatomy/i18n/configuration contracts passed; the online dependency check timed out
at the HTTP proxy, then a separate online retry confirmed dependencies up to date.
Independent review found two edge display regressions:
overview fixed-decimal rounding and source-weight precision. Both were reproduced
with failing tests and corrected; the full passing suite includes their guards.
The body-weight header uses its existing owner clock, satisfying render purity.
iOS/Android exports passed. Exact-head CI remains the final integration gate.

## Profile/account/backup/recovery checkpoint

All four locales now cover Profile navigation, hidden routine restoration,
account OTP and deletion states, backup policies and file previews, destructive
restore/reset confirmations, local recovery and cloud conflict comparison.
Supplemental error codes preserve the existing diagnostic strings and domain
returns. Unknown SDK/picker/storage diagnostics use localized recovery messages;
error text is never matched to choose a translation. Reset distinguishes no
removal, restored data and incomplete rollback; confirmed account deletion stays
distinct from incomplete local session cleanup. The literal `DELETE` confirmation
token stays the same in every language and is explained by translated labels.

Mounted tests switch all four locales while retaining email/OTP and deletion
drafts, invalid-file failures, a blocked recovery gate and the selected conflict
version. Language changes trigger no auth/file/recovery/sync retry or resolution.
Historical workout/exercise names and original filenames remain verbatim;
displayed dates and numbers follow the selected locale. Backup schemas/bytes,
account/session ownership, deletion rollout and cloud protocol are unchanged.
The existing hooks keep their lifecycle dependencies and domain return values;
their consumer screens own translation. Backup success notices have an optional
presentation callback so their current wording can change without repeating work.

The full local `npm run check` passed on Node 22.16.0/npm 10.9.2 with 121 suites /
1008 tests, including online dependency validation. iOS and Android exports passed.
Independent whole-branch review found no actionable bugs. The refreshed inventory has 2335
candidates: new additions were reviewed semantic keys and internal error codes,
not new untranslated interface copy. Remaining authored/domain/technical
candidates still require final classification and do not represent a coverage
percentage. RU/DE/FR remain release-disabled pending final acceptance.

External exclusions include the native file chooser, Files/share menu, provider
email/OTP delivery text and disabled Apple/Google provider pages. Those surfaces
follow the OS/provider language, not the app setting. The app translates its own
instructions around them. No live OTP, account deletion or database mutation was
performed to test translation. Physical-phone Files/share, interruption recovery,
screen-reader, Dynamic Type and language/foreground checks remain pending.

## Automated release checkpoint and acceptance ledger

The catalog contains 1468 messages per locale, including five final shared copy
fixes: tagline, named/generic illustration placeholders, save/load retry and native
share title. The body-weight chart's synthetic name also uses its translated
title. A missing conflict name is translated via explicit `fallbackName` metadata;
an actual saved title such as “Saved workout” stays verbatim. Native sharing
accepts an optional translated dialog title without changing file bytes or legacy
callers. Provider-owned email/OS controls remain external; the app-owned share
title is translated.

Every current source candidate has an exact classification with a reason in
`localization-classified.json`. Categories distinguish internal tokens, safe
diagnostics, canonical translated reference content, original bibliography,
developer asset-authoring metadata, brand geometry and the DELETE token. The
legacy `localization-pending.json` is the full inventory, not an untranslated-word
list. Generated/copied and user-edited stored names remain canonical historical
content; switching languages never rewrites those names or the existing Copy
suffix. Current catalog/guide presentation translates by stable ID.

`check-localization.cjs` reports unclassified sites separately and fails CI for
any new/unreviewed usage. It combines catalog validation, classification and
explicit acceptance flags in `localization-acceptance.json` to calculate release
eligibility. RU/DE/FR flags stay false. English retains its existing release status;
that exception does not certify its pending device checks.

| Evidence                                         | EN      | RU      | DE      | FR      |
| ------------------------------------------------ | ------- | ------- | ------- | ------- |
| Message/parameter/plural/catalog contracts       | Pass    | Pass    | Pass    | Pass    |
| Mounted flow/state/recovery regression tests     | Pass    | Pass    | Pass    | Pass    |
| Installed plural polyfill with native API absent | Pass    | Pass    | Pass    | Pass    |
| Representative 320/390px and expanded-text smoke | Pass    | Pass    | Pass    | Pass    |
| Complete web acceptance                          | Pending | Pending | Pending | Pending |
| Physical iOS/Android Hermes formatting/plurals   | Pending | Pending | Pending | Pending |
| Dynamic Type, screen readers, safe areas/actions | Pending | Pending | Pending | Pending |
| Native Files/share and foreground language       | Pending | Pending | Pending | Pending |

The initial cloud-browser attempt was blocked by `net::ERR_CONNECTION_REFUSED`
for `http://127.0.0.1:4173`. The local Playwright follow-up below now verifies a
representative smoke matrix; complete web acceptance remains pending. There is no connected physical
iPhone/Android environment. Renderer tests and native exports remain separate.
No live account deletion/OTP or production storage was used for QA.

The pseudo-catalog helper expands literal text while retaining interpolation
tokens and plural structure. Tests reject its import into application code and
verify it is absent from registry/published catalogs. Unknown or pseudo locale
selection never persists a setting. The real installed plural polyfill is tested
with native `Intl.PluralRules` removed, including Russian 0/1/2/5/11/21/22/25/1.5.
These tests do not claim execution on a physical Hermes device.

Automated checkpoint validation: full `npm run check` passed on Node 22.16.0/
npm 10.9.2 with 122 suites / 1020 tests, including online dependency validation.
iOS/Android exports passed. Independent whole-branch review found no actionable
bugs; its focused verification passed 3 suites / 22 tests. Subsequent report/docs
formatting passed lint, localization contracts and `git diff --check`. Exhaustive
native-speaker linguistic acceptance remains unclaimed. Exact-head GitHub CI is
the integration gate recorded in the PR.

## Reproducible web smoke follow-up — 2026-10-24

`npm run i18n:web:qa` exports the real application and checks four locales at
320/390 px with normal and expanded text (16 isolated browser contexts). It
checks Home, Profile, plan creation, exercise search/configuration, discard
cancellation, saved-plan persistence, Progress and Muscle Map. It records
screenshots, horizontal action clipping, runtime errors and unexpected external
requests in `.tools/localization-web-qa/browser/report.json`.

The runner needs a separately installed Playwright module and Chromium. Set
`PLAYWRIGHT_MODULE=/absolute/path/to/tools/node_modules/playwright` if it is not
resolvable from the project; optionally set `CHROMIUM_PATH` for a custom browser
executable. Browser tooling is not an application dependency. To inspect an
existing fresh export, invoke `node scripts/localization-web-qa.cjs --export-dir
/absolute/path/to/export --output-dir /absolute/path/to/results`.

Unreleased language choices are enabled only in the local server's JavaScript
responses. Expanded runs replace only the served catalogs; original exports and
the production registry are not rewritten. Each browser context starts with
isolated test storage and no real account. The report retains the original
export hash and browser version. This is a representative smoke matrix, not full
web acceptance: onboarding/program/technique, complete chart coverage, every
destructive/retry route, native layout/keyboard/screen readers and independent
linguistic review remain outside this runner. All web/native acceptance booleans
and RU/DE/FR release flags remain false.

The first run reproduced Profile row-label overflow in German and French at
320 px. Extended labels also overflowed in expanded runs. The shared row-button
label now has a zero minimum width, allowing its existing wrapping behavior to
fit beside the chevron without hiding the action label. Primary/secondary button
labels and Library technique/Add captions also stay inside their available width.
Expanded labels cover Cyrillic and accented Latin text while preserving message
parameters. Saved plan checks bind the exact exercise ID, four planned sets and
weight `12.5` to the named routine, with no active workout or History entry.
Screenshots do not certify image-loading/compositing or complete visual coverage.

The focused matrix passes **16/16** cases (144 screen/action checkpoints), with
no recorded runtime errors or external requests. See the [recorded report](qa/2026-10-24-localization-web/report.json),
[German Profile before](qa/2026-10-24-localization-web/profile-de-before.png)
and [after](qa/2026-10-24-localization-web/profile-de-after.png), and
[expanded Russian confirmation](qa/2026-10-24-localization-web/discard-ru-expanded.png).
The report's commit identifies the baseline; its export hash identifies the
locally built bundle including this follow-up's uncommitted layout fixes. It is
not evidence for a released build or a physical-device pass.

## Every future change

Add semantic message keys and complete translations for **every release-enabled
locale in the same change**, including accessibility and error/retry states.
Use complete sentences and named parameters; count forms follow each language's
plural categories. Never copy English into another locale merely to satisfy a
nonempty-value check. Review meaning and domain terminology.

`npm run i18n:check` rejects missing keys, empty translations, wrong interpolation
parameters and missing plural categories. It also rejects newly introduced raw
copy candidates absent from the reviewed migration baseline. Updating that
baseline is a reviewable migration action, not proof of translation. Existing
pending strings block target-locale release eligibility. During migration all
new message packs should be authored in EN/RU/DE/FR together.

User-entered names and historical exercise snapshots remain as recorded. Current
catalog presentation translates by stable ID, never by rewriting stored data.
Developer-only constants are classified separately during migration; provider
email, OS dialogs, external legal documents and third-party text are explicit
external exclusions. No runtime translation network requests are permitted.

The planned 30-language expansion uses the same contracts. Additional locales
require complete catalogs, script/layout review and physical-device acceptance;
RTL behavior is not certified by the initial four LTR languages.

## Workout recovery browser follow-up — 2026-10-24

The same 16-case real-export matrix now also records a workout from the saved
QA plan. It cancels a changed set draft, saves decimal-comma input as `12.5`
with eight repetitions, completes one of four sets, cancels discard, reloads
and resumes the identical session and rest deadline. It cancels Finish before
saving, compares the full saved exercise/set snapshot, and reopens populated
History after another reload to reject duplicate records. Saved plans remain
unchanged. These cases use isolated local test data, never a real account.

Expanded text reproduced overflow in the Workout technique caption and German
set-editor mode/cancel labels at 320px, as well as populated Progress actions
for viewing workouts and adding a body-weight measurement. Their text now wraps within the existing control
width, retaining typography and touch targets. Evidence for the extended matrix
is recorded in [the report](qa/2026-10-24-workout-recovery/report.json):
16/16 cases and 304 checkpoints passed with no recorded runtime errors or
external requests. The baseline commit plus export hash identify the tested
bundle, including the local layout fixes; this is not a released build.

This remains representative browser smoke. It does not certify actual destructive
workout deletion, storage-error retries, native timer/background behavior,
image compositing, complete web coverage or linguistic/accessibility acceptance.
All production language and acceptance flags remain unchanged.
