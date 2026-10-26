# Independent review and verification

The independent reviewer inspected `4cb68ae..94e8074`, ran 38 focused tests and
reported no Critical, five Important and one Minor finding. All six findings
were fixed in one RED→GREEN pass at `a8377dd`; the preview omission was re-graded
Important because a recipient must see prescriptions before Add & Start.
No second independent review is claimed.

| Finding                          | Regression evidence                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Stale sibling draft              | Whole-station cache is shared; successful apply invalidates older content; clicked child is selected.         |
| Scalar imported V2 prescriptions | Row IDs/weights/reps and group membership survive editing; count growth and clearing defaults are explicit.   |
| Generic pulldown conversion      | Explicit exact-handle conversion retains weight, count and program target/provenance.                         |
| Missing History labels           | Frozen child names remain visible for retired and unmapped equipment.                                         |
| Old-client cloud flattening      | Versioned RPC negotiation plus legacy get/pull/write/resolution rejection; ordinary history stays compatible. |
| Missing shared preview           | Station headers and actual individual prescriptions are visible; excluded weights stay absent.                |

Final verification: **142 suites / 1115 tests**, full project check,
**iOS and Android exports**, seven disposable PostgreSQL contract groups,
and eight real Expo web-export smoke scenarios at 320/390px in EN/RU/DE/FR.
The browser also checks static/unmapped equipment, focus, restart, History and
image dimensions/decoding. See [machine-readable evidence](report.json).

## Decisions and limits carried from execution

The following is the exhaustive execution/review ruling record. It explains
tradeoffs, not new release approval. Device, translation and backend gates remain
open, and no migration/Edge deployment or automatic merge occurred.

- Ruling: Use existing external-worktree layout at /workspace/cresum-equipment — avoids modifying another checkout or adding ignored folders to the repo — no product consequence.

- Ruling: Cloud skill helper scripts could not be read (failed to read skill resource); maintain their brief/BASE/verification ledger contract directly — preserves resumability, costs manual bookkeeping.

- Ruling: Treat a thrown storage write as committed only when saveVerified returns the exact new payload from its recovery readback — avoids duplicating a group after a write-then-throw failure — incorrect readback semantics could misreport durability; no success on an unknown/null result.

- Ruling: New group-bearing backups export envelope version 2 (legacy-only remains 1), because old V1 readers would silently discard new fields; new readers accept both. Cost if wrong: old apps cannot import the new files, intentionally requiring an update rather than losing data.

- Ruling: Gate grouped cloud writes and V2 publishing on an explicit backend capability, leave unsupported groups local with a localized status and continue other workout uploads. Cost: grouped cloud/share availability waits for separate reviewed deployment; offline logs/backup remain available.

- Final: Ruling: Re-grade preview omission (review #6) Important — Add & Start requires reviewing the actual per-row prescriptions and station structure, which were absent — cost if wrong: slightly more detail on recipient preview; preserves omitted weights.

- Final: Ruling: Version History RPC reads/writes as *_v2 after explicit historyProtocol=2 negotiation; legacy endpoints reject grouped entities/pages and writes that could erase them — old readers cannot silently flatten metadata — cost: after backend activation old clients need an update to read a page containing groups; ordinary legacy-only history remains supported. No live activation.

- Final: Ruling: Physical gestures/accessibility/Dynamic Type/reduced-motion remain acceptance gates — browser/exports cannot certify them — cost: device-specific defects may remain until that check.

- Final: Ruling: Live migration/RLS/Edge/two-device behavior remains a deployment gate — only disposable PGlite contracts ran — cost: staging may expose deployment-specific incompatibility.

- Final: Ruling: User-selected image reference integration is not clinical/CAD/efficacy certification — exact resolver and visual consistency reviewed, source pack not independently certified by reviewer — cost: later visual/biomechanics review may request revision.

- Final: Ruling: Native-speaker translation acceptance and locale activation remain open — typed locale contracts and browser layout are evidence only — cost: wording may still need native-speaker corrections.

- Final: Ruling: Reviewer did not rerun full matrix, parent did — independent 38 tests plus parent full check/exports/eight browser smokes — cost: author-run checks provide less independence than a separate full rerun.

- Final: Ruling: Unrelated baseline issues and concurrent QA documentation are outside this feature review — preserve focused scope; code changes above cover feature findings — cost: unrelated product debt remains.

- Final: minor (deferred): none; the one reviewer-labelled Minor was re-graded and fixed by user-facing effect.
