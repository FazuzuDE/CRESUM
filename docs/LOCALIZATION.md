# Localization coverage and contribution rules

Implementation in progress. English is the only release-enabled locale.
Russian, German and French resources are being prepared; they are not complete
application translations and are not yet offered as production language choices.

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
| Profile, account, backup and recovery              | Existing copy        | Pending connection              |
| Device rendering/accessibility acceptance          | Existing limitations | Pending                         |

`npm run i18n:report` emits catalog counts, enabled locales, and pending source
candidates grouped by file. `docs/localization-pending.json` contains their file,
line and text. The AST inventory includes technical candidates: counts are not a
claim about the percentage of translated UI. Classification and connection are
required before a target locale can be enabled.

The current resource catalog has 1234 semantic messages per language (14 common,
105 catalog labels, 29 library controls, 113 workout messages and 77 Home/calendar
messages, 36 History/date-picker, 90 onboarding/program-preview and 39 manual
editor messages, 74 program/technique/management messages and 494 technique-guide
messages and 163 Progress/statistics/chart/muscle/body-weight messages). Matching
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
are translated as well. Progress charts and muscle details remain pending.

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
localized retry message. Profile account/backup controls remain pending. These renderer tests do not
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
The subsequent Progress checkpoint is described below; account/backup/recovery
screens remain pending.

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
