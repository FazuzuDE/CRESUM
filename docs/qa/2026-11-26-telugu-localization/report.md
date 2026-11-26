# Telugu localization QA · 2026-11-26

CRESUM 0.3.33. [Verified source commit](https://github.com/FazuzuDE/CRESUM/commit/3643c700876e114135359ad4204231a70d21bbce).
The local run recorded commit `abd4cf9cd2e5f943be5be4eeac969399525d350a` with the same Git tree `e9670645ad00244d484075a01134fdb7c550d266`.
Chromium 158.0.8127.0. Web entry SHA-256 `41bc163ee36a103e39720524dd6b0f97e3533f22d391234510d1789d30c2ac3a`.

## Coverage and commands

- 1,746 translated message keys, including 540 technique messages on 72 exercise cards.
- The catalogs cover 18 equipment and attachment entries, 17 muscles, 14 built-in programs and three templates.
- Offline search covers 107 records with 295 aliases. Tests verify bench press, treadmill variants and exact IDs for grips and Smith-machine exercises.
- `npm run i18n:report` and `npm run i18n:check` passed. All 2,929 source candidates were classified.
- `npm run check` passed with 1,736 tests. `npm run export:check` produced both iOS and Android bundles.
- `npm run i18n:web:qa` first run passed 95/96 combinations across 24 locales.
  - The French scenario at 390 px with normal text timed out after 12 seconds waiting for the plan editor’s “Continuer la modification” button. The isolated retry passed using the same source, bundle and browser. The combined results cover 96/96 combinations.
- [GitHub CI for the source commit](https://github.com/FazuzuDE/CRESUM/actions/runs/45755358435) passed.

In a temporary checkout, removing one required key, one setup step and one alias set produced these failures. The check passed after the data was restored.

- `te: missing onboarding.name`
- `te: missing technique translation guide.treadmill-walking.setup.0`
- `te: missing/empty search aliases exercise.treadmill-walking`

## Same workout values with both sets of digits

| Width  | Text     | Entered weight × reps | Persisted weight × reps | Offline workout and history |
| ------ | -------- | --------------------- | ----------------------- | --------------------------- |
| 320 px | Normal   | `౬౨.౫ × ౮`            | 62.5 kg × 8             | Passed                      |
| 320 px | Expanded | `౬౨.౫ × ౮`            | 62.5 kg × 8             | Passed                      |
| 390 px | Normal   | `62.5 × 8`            | 62.5 kg × 8             | Passed                      |
| 390 px | Expanded | `62.5 × 8`            | 62.5 kg × 8             | Passed                      |

In both normal scenarios, the language picker switched Telugu → Urdu → Telugu and the header changed LTR → RTL → LTR.
Separate browser sessions with system locales `te` and `te-IN` both opened in Telugu. A manual English choice and the return to the system language each persisted after reload.
The runner served the normal web export without a registry override, set the browser context offline after the library loaded and checked search, technique, workout, set entry and history during that period.
After reconnecting, a page reload confirmed the same stored values. The four Telugu scenarios also checked calendar navigation, progress and the muscle map.

## Full matrix

| Locale    | Passed | Expected |
| --------- | -----: | -------: |
| `te`      |      4 |        4 |
| `ur`      |      4 |        4 |
| `th`      |      4 |        4 |
| `sv`      |      4 |        4 |
| `nl`      |      4 |        4 |
| `en`      |      4 |        4 |
| `ru`      |      4 |        4 |
| `de`      |      4 |        4 |
| `fr`      |      4 |        4 |
| `uk`      |      4 |        4 |
| `es`      |      4 |        4 |
| `it`      |      4 |        4 |
| `pl`      |      4 |        4 |
| `tr`      |      4 |        4 |
| `hi`      |      4 |        4 |
| `bn`      |      4 |        4 |
| `ar`      |      4 |        4 |
| `ja`      |      4 |        4 |
| `ko`      |      4 |        4 |
| `id`      |      4 |        4 |
| `mr`      |      4 |        4 |
| `vi`      |      4 |        4 |
| `zh-Hans` |      4 |        4 |
| `pt-BR`   |      4 |        4 |

## Screenshots

Screenshots use a 320 px viewport. The two large-text captures scale rendered text and inputs to 125% in the browser. Expanded-text matrix scenarios use longer copy at both widths.

- [Telugu onboarding and CRESUM wordmark](onboarding.png)
- [Calendar navigation](calendar.png)
- [Offline exercise library and exact equipment filter](library.png)
- [Technique setup at 125% text size](technique-large.png)
- [Set editor at 125% text size](entry-large.png)
- [Persisted history with normalized weight and repetitions](history.png)
- [Progress](progress.png)
- [Muscle map](muscles.png)

## Pending acceptance

Physical iPhone and Android, system font scaling, native back gestures and screen readers remain unverified. Independent linguistic review was not performed. See the [Telugu physical-device checklist](../../LOCALIZATION.md).
