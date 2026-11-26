# Thai localization QA · 2026-11-26

Verified [commit](https://github.com/FazuzuDE/CRESUM/commit/5a817b7e254f5689622817b2f4c3a251b028f6c3) in PR #331, CRESUM 0.3.31.
The local test commit `d41b7d5d992ab289f21ab5ae0f49562796caae15` has the identical Git tree `1a17e70f713ce602a4d364a3da3660d12f780c27`.

Chromium 158.0.8127.0. The web entry SHA-256 is
`5e76a917c7baec0fb0e4a6c63a7a944891d165e479c241dafbab352374aeabdf`.
The runner used the ordinary export in normal mode. In expanded mode it
replaced only the served message catalog. It verified the integrity of the
original export and did not override language availability.

The catalog covers 72 exercises, 18 equipment and attachment records, 17 muscles,
14 built-in programs and three templates. Offline search contains 217 Thai-script
aliases and 104 additional aliases over 107 catalog records.

## Browser matrix

All 88/88 cases passed across 22 locales.
Each locale ran at 320 and 390 px with normal and expanded text.
The onboarding tagline cleared the language control in every case.
The matrix contained each combination exactly once. No runtime errors or external requests were recorded.

| Locale    | Passed | Expected |
| --------- | ------ | -------- |
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

## Thai scenarios

| Width  | Text     | Manual ไทย selection   | Screen/action checkpoints |
| ------ | -------- | ---------------------- | ------------------------- |
| 320 px | Normal   | Passed                 | 56                        |
| 320 px | Expanded | Covered in normal mode | 56                        |
| 390 px | Normal   | Passed                 | 56                        |
| 390 px | Expanded | Covered in normal mode | 56                        |

The scenarios used a Thai exercise alias, the dumbbell equipment filter,
technique phases, and Thai numeric input `๖๒.๕` and `๘`. The saved set kept
the exact weight and reps. The timeline covered recording, active rest across
reload, finishing, History across reload, progress records and Muscle Map.
Tests separately verified changing languages with an unfinished draft and
rest deadline.

## Other commands

- `npm run i18n:report` and `npm run i18n:check` passed. The Thai catalog has 1,746 messages including 540 technique messages. The inventory has zero pending or unclassified copy candidates.
- `npm run check` passed. Test Suites: 158 passed, 158 total · Tests: 1714 passed, 1714 total.
- Deliberately removing a Thai UI key, a Smith squat setup instruction and its alias array caused named localization errors. Restoring the data passed the check.
- `npm run export:check` produced iOS and Android bundles.
- [GitHub CI](https://github.com/FazuzuDE/CRESUM/actions/runs/45744572900) passed for the verified commit.

Physical iPhone/Android, native font scaling, system keyboard, VoiceOver,
TalkBack and independent linguistic review remain unverified. See the
[Thai phone preview checklist](../../LOCALIZATION.md#thai-phone-preview).
