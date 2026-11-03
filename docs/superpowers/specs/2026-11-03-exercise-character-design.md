# Exercise character selection

Approved by the user on 2026-11-03. Choose the illustration character during
first-run welcome and change it through a Male / Female segmented selector in
Profile. This is a display preference, independent of personal body details.

Use the existing persisted onboarding document as the single source of truth:
optional `answers.artworkModel: 'male' | 'female'`. Missing values in existing
installations resolve to male. Preserve existing onboarding and backup versions.
Expose this value through a shared context used by every artwork component.
Profile writes must finish successfully before the selected value changes;
failures keep the previous value and expose retry. Block overlapping writes and
local restore/reset operations. First-run selection uses existing progress saves.

Bind images by exact exercise variant, model and phase. Register complete pairs
together. Integrate the user-approved female dumbbell goblet-squat pair; never
attach it to kettlebell-goblet-squat. Missing female pairs show a localized
placeholder, never a male fallback. Equipment thumbnails remain model independent.
Existing male muscle-map anatomy is outside the exercise-artwork preference.

Approach: extend existing onboarding persistence rather than introducing another
store/key or changing workout identities. Separate exercise records per model
would fragment history; separate preference copies would risk disagreement.
Preserve all workout data, IDs, technique guidance, muscles and offline use.
Approved new pairs will be integrated exercise by exercise after this foundation.

Acceptance: first-run choice/back/relaunch; Profile change and relaunch; all
thumbnail/phase/fullscreen images update; absent female assets never borrow male
assets; save failures/retries and old backups remain safe. Validate native bundles
and existing automated checks; report physical-device review separately.
