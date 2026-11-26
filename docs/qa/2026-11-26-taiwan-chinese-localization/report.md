# Taiwan Traditional Chinese QA · 2026-11-26

CRESUM 0.3.35. [Tested source](https://github.com/FazuzuDE/CRESUM/commit/bfc1934f7d6c74a848677708727d51c6877398ad).
The local checkout `545e214b4c316dad59432fd4a58600b9d3994ec9` had the same Git tree `e656f1fe135d26777168e9423c92a8da5668c8d5`.
Chromium 158.0.8127.0. Web entry SHA-256 `a82eb0386d917426271a292eacb8517041f6056d461b67c6ee5ac3cc9218c7a4`.

## Coverage and checks

- The baseline was [develop after Tamil #334](https://github.com/FazuzuDE/CRESUM/commit/12509a73a668e22c39ea00142710d5ea2e2215a4). The [25-locale browser baseline](../2026-11-26-tamil-localization/report.md) passed 100 cases. The Settings test confirms all 26 locale names and their order on the new source.
- 1,746 Taiwan Traditional Chinese messages, including 540 technique messages for 72 exercises. The offline dictionary covers 72 exercises, 18 equipment and attachment entries, and 17 muscle entries.
- The local `npm run i18n:check` and the GitHub Actions `npm run check` passed. The local run passed 158 suites and 1,767 tests. Expo dependency validation used offline SDK data.
- `npm run export:check` generated iOS and Android bundles.
- [GitHub CI for the tested source](https://github.com/FazuzuDE/CRESUM/actions/runs/45823892568).

The isolated mutation test removed `onboarding.name`, the treadmill preparation step and the treadmill search alternatives. The existing CI localization command rejected all three omissions and passed after restoration. Coverage tests also reject broken placeholders and Simplified-only fallback text.

## Browser matrix

The complete run passed 102/104 cases. All 26 locales ran at 320 and 390 px with normal and automatically lengthened strings. The browser verified 0.3.35 in Profile on an ordinary export.

| Locale    | First pass | Verified |
| --------- | ---------: | -------: |
| `ta`      |        4/4 |      4/4 |
| `te`      |        4/4 |      4/4 |
| `ur`      |        4/4 |      4/4 |
| `th`      |        4/4 |      4/4 |
| `sv`      |        4/4 |      4/4 |
| `nl`      |        4/4 |      4/4 |
| `en`      |        4/4 |      4/4 |
| `ru`      |        4/4 |      4/4 |
| `de`      |        4/4 |      4/4 |
| `fr`      |        4/4 |      4/4 |
| `uk`      |        4/4 |      4/4 |
| `es`      |        4/4 |      4/4 |
| `it`      |        4/4 |      4/4 |
| `pl`      |        4/4 |      4/4 |
| `tr`      |        4/4 |      4/4 |
| `hi`      |        4/4 |      4/4 |
| `bn`      |        4/4 |      4/4 |
| `ar`      |        4/4 |      4/4 |
| `ja`      |        4/4 |      4/4 |
| `ko`      |        4/4 |      4/4 |
| `id`      |        4/4 |      4/4 |
| `mr`      |        4/4 |      4/4 |
| `vi`      |        4/4 |      4/4 |
| `zh-Hant` |        2/4 |      4/4 |
| `zh-Hans` |        4/4 |      4/4 |
| `pt-BR`   |        4/4 |      4/4 |

| Scenario                    | First result                                                           | Isolated retries |
| --------------------------- | ---------------------------------------------------------------------- | ---------------- |
| `zh-Hant`, 320 px, expanded | Renderer crashed while reloading after discarding a subsequent session | Passed           |
| `zh-Hant`, 390 px, expanded | Renderer crashed while opening Progress                                | Passed           |

Chromium closed both affected pages after they had recorded a workout. It could not take a screenshot after the renderer crashes. The diagnostic archive retains both original Playwright traces, last renderer frames and History screenshots.

Isolated retries used separate fresh Chromium sessions and the original export. The web entry and localization bundle SHA-256 digests matched the complete run. The combined result was 104/104.

## Taiwan scenarios

- Chose 繁體中文 through first launch and Settings. Reloading preserved the manual preference. Returning to the device language selected Taiwan Traditional Chinese on a `zh-TW` browser. Unit tests cover explicit script priority, Hong Kong, Macao and existing saved Simplified Chinese choices.
- Saved a birth date with the localized wheel. Switching language left the birth date, training schedule and workout state unchanged. Date-picker tests cover December 31 and January 1.
- Used the offline exercise picker to find the bench press, V-handle pulldown and treadmill. Continued offline through the technique guide, recording a set and opening History. After reconnecting, a reload retained the record and its exact values.

|  Width | Text     | Entered         | Stored      |
| -----: | -------- | --------------- | ----------- |
| 320 px | Normal   | `６２．５ × ８` | 62.5 kg × 8 |
| 320 px | Expanded | `６２．５ × ８` | 62.5 kg × 8 |
| 390 px | Normal   | `62.5 × 8`      | 62.5 kg × 8 |
| 390 px | Expanded | `62.5 × 8`      | 62.5 kg × 8 |

## Screenshots

- [Onboarding at 320 px](onboarding.png)
- [Taiwan date wheel at 320 px](birthday-wheel.png)
- [Language visible in Profile](settings.png)
- [Offline library search](offline-library.png)
- [Technique guide with expanded text](technique-expanded.png)
- [Saved workout in History](history.png)
- [Calendar](calendar.png)
- [Muscle map](muscles.png)

A separate 320 px browser run checked six screens with their rendered text enlarged to 125%. The numeric keypad normalized full-width input to the exact decimal and repetition count.

- [Onboarding birthday wheel at 125% text size](birthday-wheel-large.png)
- [Taiwan entered set at 125% text size](numeric-entry-large.png)

## Pending acceptance

Physical iPhone and Android verification, native scaling and screen readers remain pending. Independent linguistic review was not counted. The language appears in onboarding and Settings with its release acceptance flag pending.
