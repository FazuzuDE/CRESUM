# Remaining visual review — 2026-10-20

After accepting fibularis-longus revision 2 from image(7).png, the current
bounded source-surface queue contains **six review blocks / 30 regions**.
This is an execution queue for this character, not a count of every human
muscle or a guarantee that all anatomical surfaces can be resolved.

| Block                                          | Regions | Current state                                                                   |
| ---------------------------------------------- | ------: | ------------------------------------------------------------------------------- |
| Soleus visible windows                         |       4 | Revision-3 unapproved candidates; medial/lateral windows per side, not heads    |
| Rectus abdominis segments and external oblique |      10 | Screenshot parameters selected; combined appearance not explicitly approved     |
| Serratus visible patches                       |       6 | Screenshot parameters selected; identity and combined appearance pending        |
| Anterior/lateral deltoid                       |       4 | Screenshot parameters selected; combined appearance and head assignment pending |
| Biceps femoris/semitendinosus                  |       4 | Parameters selected; combined appearance pending; inner strips deferred         |
| Tibialis anterior                              |       2 | Parameters selected; visual approval/load assignment still pending              |

Next: review soleus. Then revisit the five existing selections in queue order,
using saved parameters; do not silently promote them to approved status.
Any correction may require another pass, so this count is not a promise of six
remaining messages. Existing earlier approvals remain in REVIEW_CHECKPOINT.md.

After this queue, inspect a combined front/back composition for gaps, shared
borders and overlaps; resolve posterior-shoulder identity and load assignments
separately. Production SVG assembly, native integration and runtime intensity
review remain separate tasks. No production renderer is changed by these studies.

Deferred source limitations are outside this count: ECRB separation, inner
hamstring strips, deeper covered muscles, unclear lower-back muscle surfaces
under fascia, hidden attachments, distal tendons and foot detail. Do not invent
new contours merely to make every source pixel colored.
