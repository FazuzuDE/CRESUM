# Urdu localization QA · 2026-11-26

CRESUM 0.3.32. Verified [source commit](https://github.com/FazuzuDE/CRESUM/commit/abbc5e8fd13f8af138604687e7243e4ca27d1cd7).
Local QA commit `5eacbbe6c96e7d6bbe6939073a55eb14e4c9b097` matches Git tree `8253e8b9561f3313a64b7b2ca495338f27d4d561`.

Chromium 158.0.8127.0. Web entry SHA-256 `3cfc41cfc3b1c1632b5f49e4294450f6d8001cd498f97a1ea5d1796972558588`.
Normal runs served the unchanged export. Expanded runs changed only the served
message catalog. The runner blocked non-local requests during the workout scenario.

## Coverage and results

- 1,746 message keys, including 540 technique messages for 72 exercises. The catalog also covers 18 equipment and attachment entries, 17 muscles, 14 built-in programs and three templates.
- Exercise, equipment and muscle search has 290 alternatives across 107 records, including Urdu, Roman Urdu and common English gym terms.
- `npm run i18n:report` and `npm run i18n:check` passed with no unclassified source candidates. Removing an Urdu catalog label and a required placeholder produced explicit failures. Restoring both passed.
- `npm run check` passed 1727 tests. `npm run export:check` produced iOS and Android bundles.
- `npm run i18n:web:qa` covered 92 distinct scenarios across 23 locales. All passed after any targeted retries.
  - Initial mr at 320 px (normal): locator.waitFor: Timeout 12000ms exceeded. The isolated retry passed on the identical commit, bundle and browser.
  - Initial ur at 390 px (expanded): locator.waitFor: Timeout 12000ms exceeded. The isolated retry passed on the identical commit, bundle and browser.
- [GitHub CI](https://github.com/FazuzuDE/CRESUM/actions/runs/45748664458) passed for the verified code commit.

| Locale    | Passed | Expected |
| --------- | ------ | -------- |
| `ur`      | 4      | 4        |
| `th`      | 4      | 4        |
| `sv`      | 4      | 4        |
| `nl`      | 4      | 4        |
| `en`      | 4      | 4        |
| `ru`      | 4      | 4        |
| `de`      | 4      | 4        |
| `fr`      | 4      | 4        |
| `uk`      | 4      | 4        |
| `es`      | 4      | 4        |
| `it`      | 4      | 4        |
| `pl`      | 4      | 4        |
| `tr`      | 4      | 4        |
| `hi`      | 4      | 4        |
| `bn`      | 4      | 4        |
| `ar`      | 4      | 4        |
| `ja`      | 4      | 4        |
| `ko`      | 4      | 4        |
| `id`      | 4      | 4        |
| `mr`      | 4      | 4        |
| `vi`      | 4      | 4        |
| `zh-Hans` | 4      | 4        |
| `pt-BR`   | 4      | 4        |

## Urdu RTL results

| Width  | Text     | RTL layout | Manual English → Urdu → English → Urdu | Numeric entry and history |
| ------ | -------- | ---------- | -------------------------------------- | ------------------------- |
| 320 px | Normal   | Passed     | Passed                                 | 62.5 kg × 8               |
| 320 px | Expanded | Passed     | Covered in normal mode                 | 62.5 kg × 8               |
| 390 px | Normal   | Passed     | Passed                                 | 62.5 kg × 8               |
| 390 px | Expanded | Passed     | Covered in normal mode                 | 62.5 kg × 8               |

The real UI exercised offline alias search, the technique sheet, a workout,
entry of `۶۲٫۵` and `۸`, the rest timer, completion, History and reload,
as well as progress, the muscle map and the mirrored calendar controls.
Tests verify identical numeric normalization for `62.5` and `8`.

## Screenshots

All screenshots use a 320 px viewport. The two large-text screenshots use
125% browser text sizing applied to the rendered text and inputs. The full
matrix used both normal and expanded copy on 320 and 390 px viewports.

- [Onboarding and CRESUM wordmark](onboarding.png)
- [Calendar navigation](calendar.png)
- [Offline exercise library](library.png)
- [Technique at 125% font size](technique-large.png)
- [Weight and repetitions at 125% font size](entry-large.png)
- [Persisted history and exercise name](history.png)
- [Progress](progress.png)
- [Muscle map with aligned captions](muscles.png)

## Pending acceptance

Physical iPhone and Android, native system font scaling, hardware gestures
and screen readers remain unverified. The back-swipe implementation is
native-only. The app records kilograms. Independent linguistic review was
not performed. See the [Urdu physical-device checklist](../../LOCALIZATION.md#urdu-اردو).
