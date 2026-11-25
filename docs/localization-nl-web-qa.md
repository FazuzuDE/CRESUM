# Dutch web localization QA

Date: 2026-11-25. The tested build came from
[the PR code snapshot](https://github.com/FazuzuDE/CRESUM/commit/0268115d0fc808fb8a2ea7fd48607210a4e56fbf)
with Git tree `414251e62309b351f61a1f0c2ecd1d7dcad4b670`. The local commit used
to generate the report was `b5f4d8c`. The exported web entry SHA-256 was
`2daf0fad88eb4d33f3b94f083af3189d10f8ab87a9e6612c64db7bb0ab2ff0d6`.

`npm run i18n:web:qa -- --no-screenshots` passed all 80 scenarios across
20 locales. Each locale ran at 320 and 390 CSS px with normal and
expanded text. The QA server enabled the languages in memory for the test.
The exported bundle stayed intact.

| Locale    | Passed / expected |
| --------- | ----------------- |
| `en`      | 4 / 4             |
| `ru`      | 4 / 4             |
| `de`      | 4 / 4             |
| `fr`      | 4 / 4             |
| `uk`      | 4 / 4             |
| `es`      | 4 / 4             |
| `pt-BR`   | 4 / 4             |
| `it`      | 4 / 4             |
| `pl`      | 4 / 4             |
| `tr`      | 4 / 4             |
| `zh-Hans` | 4 / 4             |
| `hi`      | 4 / 4             |
| `bn`      | 4 / 4             |
| `ar`      | 4 / 4             |
| `ja`      | 4 / 4             |
| `vi`      | 4 / 4             |
| `mr`      | 4 / 4             |
| `id`      | 4 / 4             |
| `ko`      | 4 / 4             |
| `nl`      | 4 / 4             |

In all four Dutch scenarios, the local alias `dumbbell zijwaarts heffen` worked
with the dumbbell filter. The test entered `62,5` kg and eight repetitions,
verified the persisted `62.5` and completed workout in History, and
checked the Muscle Map and reload. It exercised the technique phases and
error/retry and confirmation paths. The report recorded no browser runtime
errors or external requests for Dutch.

Dutch acceptance records this browser pass. Physical iPhone and Android checks
and independent Dutch review are pending. Use the
[Dutch checklist and phone setup](LOCALIZATION.md#dutch-nederlands).
