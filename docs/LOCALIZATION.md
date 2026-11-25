# Localization coverage and contribution rules

## Physical-device localization QA

Use a clean checkout of the QA commit and Node/npm from `.nvmrc` and
`package.json`. On a machine on the same network as the test phones, run:

```sh
npm ci
EXPO_NO_DOTENV=1 \
EXPO_PUBLIC_DUTCH_PREVIEW=true \
EXPO_PUBLIC_SUPABASE_URL=disabled \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=disabled \
EXPO_PUBLIC_SHARING_ENABLED=false \
EXPO_PUBLIC_ACCOUNT_DELETION_ENABLED=false \
npm start -- --go --lan --clear
```

Open the Metro QR code in an SDK-compatible Expo Go on a physical iPhone and
Android. Use test data. The preview command enables Dutch in the language
picker. Keep the registry and acceptance flags unchanged during the test.
Other languages retain their current picker behavior. Expo Go uses the picker
fallback. To accept the iOS UIKit wheel, repeat the wheel checks in
the signed `preview` build described in [Device builds](DEVICE_BUILDS.md).

Start with German, French and Russian, then cover every other registry locale
on both platforms. Record the commit, phone, OS, build type and results.

1. Choose the app language. Check automatic selection with the phone set to
   the matching language, and confirm the explicit selection survives restart.
2. Find an exercise with a local alias from `lib/i18n/search/`. Open its technique
   and inspect the exercise, equipment and muscle names.
3. Enter an exact weight with the locale's decimal separator and enter reps.
   Check an unfinished draft when switching language, then confirm the values
   and exercise identity after returning. Complete a set and finish the workout.
4. Open History and Muscle Map. Confirm values and count grammar. Force close
   and reopen, then verify the workout and selected language were retained.
5. Use a narrow phone and larger text. Check clipped labels and accessible
   actions. In Arabic check mirrored navigation, mixed-direction text and
   Arabic numeric input. For non-Latin scripts check glyphs and local keyboard
   input in search and applicable numeric fields.

Record independent review of exercise and equipment names and technique
instructions separately. Confirm web, both physical platforms and linguistic
review for each language before promoting its release flag.

The app offers English, Russian, German, French, Ukrainian, Spanish, Brazilian Portuguese, Italian, Polish, Turkish, Simplified Chinese, Hindi, Bengali, Arabic, Japanese, Vietnamese, Marathi, Indonesian, Korean and Dutch. System language
appears first and is selected by default. An explicit choice is saved on the
device. Final web and native acceptance for Russian, German, French,
Ukrainian, Spanish, Brazilian Portuguese, Italian, Polish, Turkish, Simplified Chinese, Hindi, Bengali, Arabic, Japanese, Vietnamese, Marathi, Indonesian and Korean remain pending in the release eligibility ledger.

Ukrainian, Spanish, Brazilian Portuguese, Italian, Polish, Turkish, Simplified Chinese, Hindi, Bengali, Arabic, Japanese, Vietnamese, Marathi, Indonesian and Korean cover the bundled messages and catalogs, including
exercise technique, equipment and built-in plans. Shared plan titles and
descriptions use the selected locale when the publication supplies it. Older
publications use their English metadata.

## Dutch (Nederlands)

Dutch uses a single offline catalog for the Netherlands and Dutch-speaking
Belgium. The language wheel can select Nederlands manually or follow the
device locale for `nl`, `nl-NL` and `nl-BE` when enabled. Before release,
Nederlands is available through the internal preview command above; a normal
build omits it from language selection and system detection. Publication metadata uses an
optional `nl` field and preserves the English fallback for older publications.

Use the [phone QA setup](#physical-device-localization-qa) on both phones:

1. Select Nederlands or test System with the phone set to Dutch (Netherlands
   and Belgium). Check that manual selection survives restart.
2. Find `bankdrukken`, select the halterstang filter and inspect START and
   EIND in Technique. Try `lat pulldown-machine` and the exact V-grip
   variant, where applicable.
3. Enter `62,5` kg and `8` reps. Change the language with an unrecorded set,
   check the draft and the active workout, then record the set and finish.
4. Confirm the values in History and the sets in Muscle Map. Force close,
   reopen and verify the workout and language. Check both an invalid weight
   and the deletion confirmation, including the cancel path.
5. Open a supported cardio exercise. Verify elapsed cardio time starts only
   after its own Start action and survives a language change. Check narrow
   layout, large text and VoiceOver/TalkBack labels.

Record this evidence and independent fluent review of the Dutch terms and
technique separately. Dutch requires `web`, `native` and `linguistic` acceptance
before its release flag can be enabled.

## Korean — approved 2026-11-18

`ko` adds 한국어 with all 1651 bundled messages, 110 catalog labels and 70
complete technique guides (530 guide messages). Every exercise, equipment,
attachment and muscle has natural Korean gym names, spacing variants and common
search alternatives/abbreviations. Existing NFC search normalization handles
composed and decomposed Hangul without rewriting stored text or catalog IDs.
Initial-consonant search is not introduced or claimed.

Resolve ko, ko-KR and ko-Hang-KR device tags. Native name and flag come from the
registry-driven cyclic language wheel; retain current/device centering,
Done/Cancel drafts, inertia, quiet clicks and 10% transparency. Switching from
Arabic to Korean keeps mounted editors and unfinished values unchanged.
Korean uses other plural forms, decimal points and local dates through Intl;
exact manual weights retain precision, and ambiguous grouped input is rejected.
Optional publication metadata accepts ko and falls back to English for older
plans. Offline Core, historical snapshots and exact variants remain intact.

No SDK/dependency changes. Physical Expo Go Hangul layout/wrapping, keyboard,
wheel and screen-reader acceptance, plus independent Korean linguistic review,
remain pending. Automated contracts do not certify those gates; acceptance flags
stay false.

## Indonesian — approved 2026-11-18

`id` adds Bahasa Indonesia with all 1651 bundled messages, 110 catalog labels
and 70 complete technique guides (530 guide messages). Every exercise, equipment,
attachment and muscle has search alternatives using Indonesian gym vocabulary,
common borrowed terms and abbreviations. Search-only aliases preserve exact
variants, catalog IDs, personal text and historical snapshots.

Resolve id, id-ID and id-Latn-ID device tags. The registry-driven cyclic wheel
adds the native name and flag automatically; preserve the current/device opening,
Done/Cancel drafts, inertia, quiet clicks and 10% transparency. Switching from
Arabic to Indonesian keeps mounted editors and unfinished values intact.

Indonesian plural messages use other, including without native PluralRules.
Numbers use decimal commas and local grouping; exact editable weights keep their
precision and the shared comma/dot input contract rejects mixed grouping.
Dates use Indonesian Intl formatting. Optional published-plan metadata accepts
id and retains English fallback for older publications. Core stays offline.

No SDK/dependency changes. Physical Expo Go font/layout/keyboard/wheel and
screen-reader acceptance, plus independent native-speaker review, remain pending.
Automated coverage is separate evidence; web/native acceptance flags stay false.

## Marathi — approved 2026-11-18

`mr` adds मराठी with all 1651 bundled messages, 110 catalog labels and 70
complete technique guides (530 guide messages). Every searchable exercise,
equipment, attachment and muscle identity has Marathi gym names, everyday
alternatives or common abbreviations. Composed/decomposed Indic text matches
without discarding meaningful vowel marks or changing saved names and IDs.

Resolve mr, mr-IN and mr-Deva-IN device tags. The registry automatically adds
मराठी and its flag to the shared alphabetical cyclic wheel. Keep the effective
language at opening, staged Done/Cancel choices, inertia and click behavior.
Manual preferences survive reload and live RTL-to-LTR switching preserves drafts.

Use Marathi one/other plurals, dates and Devanagari number display through Intl.
Shared numeric inputs now accept Devanagari digits while preserving exact raw
precision and the existing unambiguous comma/dot decimal contract. Editable
values use normalized ASCII digits; grouped ambiguous input is still rejected.
Optional published-plan metadata accepts mr and retains English fallback for
older publications. Offline workout recovery and immutable identities stay intact.

No SDK/dependency changes. Automated translation, alias, input, formatting,
preference and direction checks do not certify physical-device or linguistic
quality. Native Expo Go rendering, keyboards, wheels, accessibility and an
independent native-speaker review remain pending; acceptance flags stay false.

## Vietnamese — approved 2026-11-18

`vi` adds Tiếng Việt with all 1651 bundled messages, 110 catalog labels and
70 complete technique guides (530 guide messages). The approved scope includes
onboarding, workout editing/logging, rest, history, progress, profile, backups,
auth/account deletion, sharing, errors and accessibility labels. Exercise,
equipment, attachment and muscle aliases include Vietnamese gym vocabulary,
regional everyday names such as hít đất and tạ chuông, and customary abbreviations
such as DB, RDL and OHP. All searchable catalog identities have alternatives.

The shared offline exercise search matches composed/decomposed Vietnamese and
queries without diacritics. Existing Latin accent folding is retained, with đ/Đ
folded to d only in search. Indic marks and Japanese voicing remain meaningful.
Stable IDs, exact variants, saved personal text and historical snapshots stay
unchanged. Published-plan metadata accepts vi when present and retains English
fallback for old plans; malformed optional metadata remains invalid.

Resolve vi, vi-VN and vi-Latn-VN device tags. The existing shared glass wheel
includes the Vietnamese flag and native name in alphabetical order, opens on the
effective language and stages choices until Done. Manual preferences survive
reload; live Arabic-to-Vietnamese switching returns to LTR without remounting
editors or discarding unfinished numeric drafts. Vietnamese uses other plural
forms, decimal commas, local grouping and calendar dates through Intl. Exact
entry precision and comma/dot validation keep the shared numeric contract.

No SDK/dependency changes or online translation service are needed. Automated
catalog, alias, formatting, preference, input and direction checks do not certify
physical-device or linguistic quality. Native Expo Go wrapping, Vietnamese font
rendering, keyboards, wheels, VoiceOver/TalkBack and independent native-speaker
review remain pending; web/native acceptance flags stay false.

## Japanese — approved 2026-11-18

`ja` adds 日本語 with all 1651 bundled messages, 110 catalog labels and 70
complete exercise guides (530 guide messages). Exercise, equipment, attachment
and muscle aliases include Japanese gym terminology and customary abbreviations
such as DB, RDL and OHP. The current shared glass language wheel resolves ja,
ja-JP and ja-Jpan-JP, opens on the effective language, stages changes until Done,
and preserves explicit preferences on reload. Japanese uses the existing LTR
presentation; switching from Arabic retains the same mounted editor and draft.

Search folds fullwidth ASCII and halfwidth kana, then matches katakana with
hiragana while retaining meaningful dakuten/handakuten and Indic marks. This
limited search transformation follows Unicode width normalization guidance
(https://www.unicode.org/reports/tr15/); stored names, aliases, stable IDs and
historical snapshots are not normalized or migrated. Existing filters and exact
variant distinctions remain authoritative.

Japanese plurals use `other`, including on runtimes without native PluralRules.
Dates/numbers use Japanese Intl formatting. Fullwidth keyboard digits, decimal
point and comma normalize in numeric inputs without parsing unfinished drafts,
rounding precision or accepting grouping/exponents/signs. Non-numeric user text
is untouched. Optional published metadata accepts ja; old plans retain English
fallback. No remote translation service or new dependency is introduced.

Automated catalog, alias, formatting, preference, live-direction and input checks
are separate from visual and language acceptance. Independent native-speaker
review and physical Expo Go typography, wrapping, keyboard, wheel, VoiceOver and
TalkBack checks remain pending; web/native acceptance flags stay false.

## Arabic — approved 2026-11-18

`ar` adds العربية with all 1651 semantic messages, 110 catalog labels and 70
complete technique guides (530 guide messages), plus Arabic exercise, equipment,
attachment and muscle search alternatives. Local gym terminology includes names
such as بنش, مجانص, باي and تراي; aliases expand discovery only. Arabic search folds
vowel marks, tatweel and common alef/ya spellings while retaining meaningful Indic
marks. All languages remain searchable offline from any interface locale.

Arabic is the first RTL application locale. The presentation context follows the
selected application language without forcing native-global I18nManager state,
reloading the app or remounting its children. Shared text/input/icon/modal seams
provide direction, physical text alignment and logical navigation arrows. The dock
uses locale-aware visual tab order and a matching pill position. Wheel component
order, artwork, anatomy and graph coordinates are not mirrored. Character choices
stay aligned with the approved unmirrored male-left/female-right artwork.

Arabic messages isolate interpolated values using FSI/PDI in presentation only.
Names, identities and saved workout snapshots are not rewritten. Six plural
categories use count-label phrasing appropriate for all counts. Presentation
numbers explicitly use the Arabic-Indic numbering system, independently of CLDR
runtime defaults. Exact editable numbers retain their precision and use the Arabic
decimal separator; Arabic/Persian keyboard digits normalize without rounding.
Grouping, signed/exponential and ambiguous numbers remain invalid.

Resolve device tags such as ar-SA and ar-EG. Optional published-plan metadata
accepts ar with the existing English fallback for older publications. Core stays
offline and no translation service is bundled. Independent native-speaker review,
physical Expo Go shaping, native direction/layout, gesture and screen-reader
acceptance remain open. Browser and renderer checks do not certify those gates.

## Bengali — approved 2026-11-17

`bn` provides all 1651 bundled semantic messages, 110 catalog labels and 70
complete technique guides (530 guide messages). বাংলা is available in the shared
language wheel and resolves device locales such as `bn-BD`, `bn-IN` and
`bn-Beng-IN`. Bengali count forms, number grouping, native presentation digits,
dates and exact decimal entry display follow the locale. Existing ASCII decimal
entry remains exact and does not rewrite saved numbers or historical names.

All exercise, equipment, attachment and muscle alias entries have Bengali
alternatives. Common Bengali gym spellings and Roman Bangla names work in every
interface language through the shared offline search. Bengali vowel signs,
virama and nukta are preserved with canonical Unicode equivalence. Exercise
variants, filters and the grouped Goblet presentation retain their identities.

Optional published-plan metadata accepts `bn`; older publications keep their
English fallback. Final Bengali content is authored against the English source;
no translation model or network translation dependency is bundled. Independent
native-speaker review and physical Expo Go shaping, layout and accessibility
acceptance remain pending. Automated coverage does not certify those gates.

## Hindi — approved 2026-11-17

`hi` adds all 1651 bundled messages, 110 catalog labels and 70 complete technique
guides (530 guide messages). It is selectable as हिन्दी and follows device tags
such as `hi-IN` and `hi-Deva-IN`. Counts include Hindi's `one` and `other` forms;
dates and exact decimal-point numbers use the selected locale.

Every current exercise has Hindi search aliases, including alternative spellings
and Roman Hindi where useful. Hindi also covers every equipment, attachment and
muscle alias entry in the shared search contract. Queries work across all bundled
interface languages. Matching preserves Devanagari vowel marks and
nukta, normalizes Unicode canonical equivalents and keeps existing filters and
English canonical-name search. Stable exercise IDs and saved workout names are
unchanged. Aliases expand search only and do not equate distinct variants.

Optional published metadata supports `hi` with the existing English fallback
for publications without it. All final messages and aliases are bundled offline
and authored against the source. Independent native-speaker review and physical
Expo Go text-shaping, layout and accessibility acceptance remain pending.

## Simplified Chinese — approved 2026-11-17

`zh-Hans` adds all 1651 bundled messages, 110 catalog labels and 70 technique
guides (530 guide messages). It is selectable as 简体中文 and follows `zh`,
`zh-CN`, `zh-SG` and explicit `zh-Hans` device tags. Explicit `zh-Hant` and
traditional-region tags (`TW`, `HK`, `MO`) retain ordered fallback rather than
silently selecting another script. An explicit `zh-Hans` tag takes precedence
over its region. This does not provide Traditional Chinese.

Counts use Chinese's single `other` form. Dates and decimal-point numbers use
the selected locale. Exercise search accepts Chinese names and canonical
English aliases. Optional published metadata supports `zh-Hans`; publications
without it keep the existing English fallback. User-authored names are unchanged.
All translations are bundled for offline use. All final Chinese messages were authored and reviewed
against their English source, including UI and exercise terminology; independent native-speaker review and physical
Expo Go layout/accessibility acceptance remain pending in the ledger.

## Current status

| Area                                               | EN                   | RU / DE / FR                    |
| -------------------------------------------------- | -------------------- | ------------------------------- |
| Locale engine, plural and interpolation contracts  | Tested               | Tested                          |
| Common language/settings message pack              | Complete             | Complete                        |
| Active workout, set entry, rest and confirmations  | Connected            | Connected and tested            |
| Home dashboard, calendar and layout editor         | Connected            | Connected and tested            |
| Onboarding, proposal preview and schedule editor   | Connected            | Connected and tested            |
| Manual workout editor                              | Connected            | Connected and tested            |
| Catalog names and Exercise Library controls/search | Connected            | 106 labels + 29 messages tested |
| Program week and workout-template management       | Connected            | Connected and tested            |
| Technique controls and 66 exercise guides          | Connected            | 502 guide messages connected    |
| History details, filters and date/count pickers    | Connected            | Connected and tested            |
| Progress, exercise statistics, charts and muscles  | Connected            | Connected and tested            |
| Progress body-weight chart and measurement editor  | Connected            | Connected and tested            |
| Profile, account, backup and recovery              | Connected            | Connected and tested            |
| Device rendering/accessibility acceptance          | Existing limitations | Pending                         |

`npm run i18n:report` emits catalog counts, locale release flags, release eligibility,
source candidates and unclassified candidates grouped by file.
`docs/localization-pending.json` retains its compatibility filename and stores the
baseline inventory with file, line, text and syntax-parent context.
`docs/localization-additions.json` records new reviewed source sites with the
same coordinates and a classification, without regenerating either baseline.
`docs/localization-classified.json` records exact reviewed sites and reasons;
it does not exempt entire files or future strings. Moving an internal token into
visible JSX invalidates that classification. The inventory includes technical
and canonical content: counts are not a percentage of translated UI.

The current resource catalog has 1651 semantic messages per language, including
110 catalog labels and 70 exercise guides (530 guide messages) and the new equipment
selection, grouped-set, retry and capability-status messages. Matching
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

Add semantic message keys and complete translations for **every locale currently
present in `lib/i18n/registry.ts` in the same change**, including selectable locales
awaiting release/device acceptance, accessibility and error/retry states.
Use complete sentences and named parameters; count forms follow each language's
plural categories. Never copy English into another locale merely to satisfy a
nonempty-value check. Review meaning and domain terminology.

`npm run i18n:check` rejects missing keys, empty translations, wrong interpolation
parameters and missing plural categories. It also rejects newly introduced raw
copy candidates absent from the reviewed migration baseline. Updating that
baseline is a reviewable migration action, not proof of translation. Existing
pending strings block target-locale release eligibility. The rule applies to all
currently selectable languages, independently of the `released` flag.

For Dutch, unchanged English copy fails even when it is nonempty. Use
`docs/localization-nl-copy-exceptions.json` only when the exact term is also
standard Dutch, an international gym term or an invariant unit. Add the exact
Dutch string (and plural form where relevant) and explain why it is identical.
Remove unused entries when their copy changes. Strings containing only
interpolation placeholders, numbers or punctuation are language neutral.

For each built-in program, CI resolves its title, day labels, movements,
holds and cardio entries against the live program and exercise catalogs.
Consult the [exercise addition workflow](EXERCISE_ADDITION_WORKFLOW.md) for the
order in which to add, translate and connect new content.

### Search alternatives — approved 2026-11-17

Every searchable catalog addition requires natural alternatives in every current
language in the same PR. Add synonyms, local gym slang and abbreviations where
applicable; slang is authored for the language rather than translated literally.
Existing official catalog names are indexed automatically, but are not a substitute
for the alias dictionaries in `lib/i18n/search/{locale}.ts`. Do not manufacture
slang for an item with no common colloquial name: use meaningful alternative terms.

The current dictionaries cover every exercise, equipment/attachment and muscle.
`npm run i18n:check` checks missing/empty/duplicate aliases, unknown IDs, missing
catalog labels and missing locale dictionaries against the live registry/catalog.
A new exercise, equipment item, muscle or language therefore expands the required
coverage automatically. Message key, parameter, plural and source-inventory checks
remain required for all other app-controlled text. Structural checks do not certify
linguistic quality; review domain meaning and local usage during contribution.

Use `exerciseSearchScore` for any exercise selection search, including saved
performance choices. Use the current locale only for preferred label ranking;
names and aliases from every bundled language must remain searchable offline.
Search-only aliases never enter `legacyExerciseIds`, saved snapshots, sync payloads,
or the canonical resolver. Shared equipment terms yield multiple matching exercises;
exact variant qualifiers must remain specific. Never merge Romanian/conventional
lifts, opposite movements or different equipment identities as synonyms.

When introducing another searchable entity, add its translated names and alias
coverage contract and connect its search before presenting it. Non-searchable UI
text requires translations, not artificial search keywords. A new language needs
all existing content and aliases before it is selectable. Physical-device and
linguistic acceptance remain independent of automated coverage.

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

## Browser storage failures and discard — 2026-10-24

The same four-locale 320/390px normal/expanded matrix now injects a one-shot
failure at the browser's real `localStorage.setItem` boundary for the Core key.
It verifies localized failure messages, absence of internal diagnostics and
unchanged durable data, then retries set saving, Finish and discard through the
actual UI. The set retry must persist exactly `12.5` × `8`; Finish must retain
session/set identity and produce exactly one History record.

A second session is discarded through its confirmation after a failed first
attempt. Its removal must survive reload while the original completed History
and saved plans remain byte-for-byte equivalent as parsed documents. Faults are
restricted to isolated browser contexts; no application hook or dependency is
added. This covers one-shot web writes, not full-disk/device failures, interrupted
writes, account deletion, reset/restore or all recovery paths. Native and full
web acceptance, linguistic review and language release gates remain pending.

Evidence: [storage recovery report](qa/2026-10-24-storage-recovery/report.json),
16/16 cases and 384 checkpoints passed; no recorded JS errors or external
requests. The baseline commit and export hash identify the actual tested app
bundle; fault injection and runner changes are development-only. Full quality
checks passed (135 suites / 1082 tests), as did iOS/Android exports.

## Technique browser follow-up — 2026-10-24

The representative real-export matrix now opens Dumbbell Lateral Raise technique
from the plan editor's Library. It checks every authored paragraph for that
exercise's setup, movement, checks and common mistakes, expands sources, switches
to FINISH, opens the full-screen placeholder viewer and switches back to START.
Closing the viewer must retain the phase and open disclosures; closing the guide
must retain the Library search and leave serialized Core data unchanged.

Browser checks exposed missing web accessibility state: legacy native
`accessibilityState` did not produce disclosure/toggle attributes in the current
React Native Web build. Technique disclosures now explicitly emit `aria-expanded`
and phase buttons emit `aria-pressed`, retaining existing native state props.

This is one representative guide and placeholder viewer, not anatomical/image
approval, a review of all 65 guides, external-source availability or physical
screen-reader acceptance. Full web/native/linguistic gates and release flags
remain pending. Bibliographic links are not opened by this offline smoke.

Evidence: [technique browser report](qa/2026-10-24-technique-web/report.json),
16/16 cases and 512 checkpoints passed, with no recorded JS errors or external
requests. The baseline commit and export hash identify the tested bundle
including the local ARIA fixes. Full quality checks passed (135 suites / 1082
tests); iOS/Android exports and independent review passed. This is not physical
accessibility acceptance or a released-language build.

## Fresh onboarding and program acceptance browser follow-up — 2026-10-24

The real-export matrix now begins with empty context storage instead of seeding
completed onboarding. It checks empty-name disablement, invalid body-weight
validation, name/height/decimal-comma draft retention across Back, goal and
experience selection, program preview, recommended schedule and reduced-first-
session selection. It accepts the Build muscle / Beginner baseline without
starting a workout or creating History, compares installed templates to the
accepted assignment and verifies unchanged onboarding/program/Core after reload.
The previous plan/technique/workout/retry/discard scenarios then run on this
onboarded state. Reloads no longer overwrite saved onboarding answers with a QA
completed-state fixture.

This is one representative goal/experience variant and its recommended schedule,
not all nine variants, manual setup, custom/date-wheel schedules or physical
keyboard/accessibility acceptance. It verifies the reduced-session preference at
acceptance, not a separately started program workout. Existing full web/native
and linguistic gates remain pending; RU/DE/FR remain release-disabled.

Evidence: [onboarding browser report](qa/2026-10-24-onboarding-web/report.json),
16/16 cases and 656 checkpoints passed, with no recorded JS errors or external
requests. The baseline commit and export hash identify the tested application;
this follow-up changes only development QA and documentation. Full quality
checks passed (135 suites / 1082 tests); independent review found no material
issues. Physical-device acceptance remains pending.

## Planned workout start browser follow-up — 2026-10-24

The representative accepted Build muscle / Beginner program is now started from
Home's planned-workout action. Its first slot must create exactly one set per
exercise, preserve authored targets and exercise IDs, and bind the correct
assignment/week/slot/date. Weight and repetitions stay blank and no completed
sets or History entries are invented. Reload/resume must preserve the complete
active session. Saved templates, onboarding and the assignment stay unchanged.

After discarding that test session, the second scheduled slot is selected and
started. It must use the original authored set counts rather than inherit the
first-slot reduction, with a new session ID and the second slot's context/date.
Discarding it must restore the original persisted baseline before the remaining
manual-plan/workout flows run. This is not a completed program workout or
program History/progression acceptance; other variants and native checks remain
pending.

This run reproduced Russian repetitions-placeholder overflow in empty set cells
at 320px. Constraining the existing value text to its cell width allows wrapping
without shrinking typography or changing values, targets or workout logic.

Evidence: [planned-start browser report](qa/2026-10-24-program-start/report.json),
16/16 cases and 720 checkpoints passed; no recorded runtime errors or external
requests. Baseline commit and export hash identify the tested bundle including
the local text-width fix. Full quality checks passed (135 suites / 1082 tests),
as did iOS/Android exports and final affected type/lint/format checks. Independent
review found no material issues. Full web/native acceptance remains pending.

## Completed planned workout browser follow-up — 2026-10-25

The representative first reduced program session is now logged through all eight
exercises (one set each), including bilateral input, rest transitions and the
full-completion confirmation. Exact exercise/set IDs, targets, values and program
slot context must survive saving. The earlier manual History record stays exact.
Seven ordinary sets at 12.5 × 10 and one bilateral 12.5 × 10/10 produce 1125 kg
of recorded volume; Progress must show 1225 kg including the prior 100 kg session,
and its workout-volume list must show the 1125 kg entry. History must show both
ordinary and bilateral values.

Home must mark the finished slot complete and suppress its planned-start action.
The following slot must retain every authored exercise in order, its exact context
and ordinary set counts. Discarding that new session and reloading must retain
exactly two History records, the completed marker and unchanged program snapshot.
This is representative program completion, not all variants, multi-week/adaptive
progression, full web/native or physical-device acceptance. Locale flags stay off.

Evidence: [completed-program browser report](qa/2026-10-25-program-completion/report.json),
16/16 cases and 960 checkpoints passed with no recorded JS errors or external
requests. Baseline commit and export hash identify the tested application. Full
quality checks passed (135 suites / 1082 tests), as did iOS/Android exports and
final script lint/format checks. Independent review found two evidence gaps
(full-confirmation wording and following-slot completeness); both are covered by
assertions in the passing matrix. The test handles locale nonbreaking grouping
spaces through normalized text matching. No production logic changed.

## Automatic language-wheel entries — 2026-11-18

LanguageSettings derives its alphabetized options from enabled locale registry
entries. Each registry entry owns its native name and flag; there is no separate
menu flag map or locale list to update. Cache those options while the wheel moves.
New locales still require complete messages, catalog guides and search aliases in
the same PR before becoming selectable. Registry types require the presentation
metadata; wheel tests verify a newly registered entry appears automatically.
