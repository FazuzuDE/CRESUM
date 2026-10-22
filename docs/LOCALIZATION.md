# Localization coverage and contribution rules

Implementation in progress. English is the only release-enabled locale.
Russian, German and French resources are being prepared; they are not complete
application translations and are not yet offered as production language choices.

## Current status

| Area                                               | EN                   | RU / DE / FR                    |
| -------------------------------------------------- | -------------------- | ------------------------------- |
| Locale engine, plural and interpolation contracts  | Tested               | Tested                          |
| Common language/settings message pack              | Complete             | Complete                        |
| Existing onboarding, Home, workout screens         | Existing copy        | Pending connection              |
| Catalog names and Exercise Library controls/search | Connected            | 105 labels + 29 messages tested |
| Program/technique presentation beyond library      | Existing copy        | Pending connection/translation  |
| History, Progress and muscle details               | Existing copy        | Pending connection              |
| Profile, account, backup and recovery              | Existing copy        | Pending connection              |
| Device rendering/accessibility acceptance          | Existing limitations | Pending                         |

`npm run i18n:report` emits catalog counts, enabled locales, and pending source
candidates grouped by file. `docs/localization-pending.json` contains their file,
line and text. The AST inventory includes technical candidates: counts are not a
claim about the percentage of translated UI. Classification and connection are
required before a target locale can be enabled.

The current resource catalog has 145 semantic messages per language (11 common,
105 catalog labels, 29 library controls). Matching key counts are a structural
check, not independent linguistic acceptance. The library's nested technique and
statistics pages remain part of the pending screen migration. The native picker
receives labels/values from JavaScript; it has no separate English UI copy in its
current Swift implementation.

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
