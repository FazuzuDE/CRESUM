# Tamil localization QA · 2026-11-26

CRESUM 0.3.34. [Tested source](https://github.com/FazuzuDE/CRESUM/commit/94419fa78635f14f60359f0e928939c1e274fb0e).
The local checkout `20054abd2fa414891316d518c0d99124869c90a6` has the same Git tree `ba9d895150de94ac4c9cdd32fd9d81cfcdbeba3f`.
Chromium 158.0.8127.0. Web entry SHA-256 `b2876e398af65429b09d3a298c8c0f2c59dcd872893aed7d1c59027a6e90eb62`.

## Coverage and checks

- 1,746 localized keys, including 540 guide strings for all 72 exercise cards.
- Offline search covers 107 records, including 72 exercises, 18 equipment or attachment entries and 17 muscles.
- `npm run i18n:check` passed with 2,929 source candidates classified. `npm run check` passed with 158 suites and 1,751 tests. The local Expo dependency check used the offline SDK compatibility data.
- `npm run export:check` generated the iOS and Android bundles.
- [GitHub CI for the tested source](https://github.com/FazuzuDE/CRESUM/actions/runs/45782687622).

The initial online local dependency check timed out at the HTTP proxy. A run concurrent with Metro export also exceeded the 5-second Jest deadline in the existing workout-editor and backup tests. The local retry and the GitHub CI run completed on the tested source.

A mutation test in a temporary checkout removed `onboarding.name`, the treadmill setup step and the treadmill alias list. The localization check rejected all three omissions and passed after restoration. Jest also covers missing placeholders, copied or English-only text and aliases, Tamil plural forms, Unicode normalization and distinct equipment variants.

## Browser matrix

The full run on the tested source passed 100/100 cases. The matrix covers all 25 registry locales at 320 and 390 px with normal and expanded text. The version check confirmed 0.3.34 in the rendered Profile.

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
| `zh-Hans` |        4/4 |      4/4 |
| `pt-BR`   |        4/4 |      4/4 |

An earlier four-case Tamil diagnostic exposed two Settings locator failures and a clipped Overview label with expanded text at 320 px. The Settings test now matches the button whose accessible name includes the current language, and the Overview label is shorter. In a separate preview of the first versioned export, some weekday abbreviations showed missing-glyph boxes in Chromium. Setting the document language to the selected locale corrected font fallback. The tested export includes both fixes. The cached versioned preview was stopped after Profile showed 0.3.33 rather than the branch’s 0.3.34. A clean Metro export and the browser assertion verified the correct visible version.

The final Profile wording refinement affected five Tamil strings for the model in exercise illustrations. All four Tamil cases passed again on local source `f0a6cbee467c1a3d7e2f6984810eb19a4fcae105`. The updated localization bundle SHA-256 is `3d624776104188a6a8088a6c89453e87739ed0a7a565a6dfb01c66054e43340e`. The Profile screenshot and the final iOS and Android exports include that wording.

## Tamil checks

Device tags `ta`, `ta-IN` and `ta-LK` each started in Tamil. A manual English selection and a return to the device language survived browser reloads. In both normal-text cases, Tamil was selected through onboarding and Settings, and switching through Urdu restored left-to-right layout.

The browser context went offline after the exercise picker loaded. Search, technique, workout and History worked offline. Saving and reloading preserved the same recorded values after reconnecting.

|  Width | Text mode | Entered    | Stored      |
| -----: | --------- | ---------- | ----------- |
| 320 px | Normal    | `௬௨.௫ × ௮` | 62.5 kg × 8 |
| 320 px | Expanded  | `௬௨.௫ × ௮` | 62.5 kg × 8 |
| 390 px | Normal    | `62.5 × 8` | 62.5 kg × 8 |
| 390 px | Expanded  | `62.5 × 8` | 62.5 kg × 8 |

## Screenshots

- [First launch (320 px)](onboarding.png)
- [Profile and Settings (390 px)](settings.png)
- [Calendar and weekday glyphs (320 px)](calendar.png)
- [Offline exercise search (320 px)](library.png)
- [Exercise guide with expanded text (320 px)](technique-expanded.png)
- [Saved workout in History (390 px)](history.png)
- [Progress (320 px)](progress.png)
- [Muscle map (320 px)](muscles.png)
- [Exact keypad values after Tamil input was normalized (320 px)](numeric-entry.png)

## Pending acceptance

Physical iPhone and Android checks, native keyboard and font scaling, and VoiceOver/TalkBack remain pending. Independent linguistic review was not performed. Tamil remains selectable with the release flag pending.
