# Swedish localization web QA

The [tested PR code](https://github.com/FazuzuDE/CRESUM/commit/ed00451d6cd8dc5effc9993dd4453003568da31c)
has Git tree `0fd1a0f7495dd8930e7600555c35b22edc079e0f`. The identical local tree was checked out at
`5ecd5779bc8fe313d0cc4065edd9049b67124417`. The web entry SHA-256 is `00bf5fe5b9412e5736f1143a6e254daf9749cba80d3d9311dd001ca67b2c286a`.

The registry-driven matrix passed 84 of 84 scenarios on
Chromium. Every locale ran at 320 and 390 CSS pixels with normal and expanded
text. The QA server temporarily enabled the language choices in the served
bundle and checked that the exported source files stayed intact.

| Locale    | Passed / expected |
| --------- | ----------------- |
| `sv`      | 4 / 4             |
| `nl`      | 4 / 4             |
| `en`      | 4 / 4             |
| `ru`      | 4 / 4             |
| `de`      | 4 / 4             |
| `fr`      | 4 / 4             |
| `uk`      | 4 / 4             |
| `es`      | 4 / 4             |
| `it`      | 4 / 4             |
| `pl`      | 4 / 4             |
| `tr`      | 4 / 4             |
| `hi`      | 4 / 4             |
| `bn`      | 4 / 4             |
| `ar`      | 4 / 4             |
| `ja`      | 4 / 4             |
| `ko`      | 4 / 4             |
| `id`      | 4 / 4             |
| `mr`      | 4 / 4             |
| `vi`      | 4 / 4             |
| `zh-Hans` | 4 / 4             |
| `pt-BR`   | 4 / 4             |

All four Svenska scenarios used the local alias `hantellyft åt sidan` with
the exact Hantel filter. They entered `62,5` kg × `8`, verified the canonical
weight `62.5`, opened the saved workout in History and checked the Muscle Map.
The workflow verified saved state after a browser reload and exercised technique
illustrations, confirmation dialogs and failed-save recovery. No browser
runtime errors or external requests were recorded for Svenska. A separate
390 px run on the same export chose Svenska in the language wheel before
onboarding and verified the saved choice through reload.

The physical iPhone and Android checks remain pending. Independent linguistic
review has not been performed. Use the
[Swedish preview checklist](LOCALIZATION.md#swedish-svenska) to test phones.
