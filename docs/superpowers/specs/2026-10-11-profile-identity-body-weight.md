# Profile identity and body-weight follow-up

Approved scope from the user's 2026-10-11 request; owning rules are synchronized in PRODUCT, DESIGN_SYSTEM, ROADMAP and DECISIONS.

- Profile keeps a compact WORKOUTS wordmark entry. Saved routines open on a separate page with all existing management operations and protected editor drafts.
- Welcome collects the display name; optional Body details follows with DOB, height and initial kg; Goal/Experience/program acceptance retain existing logic. Home uses the saved name. Legacy users remain ungated.
- Store DOB as a valid local calendar date; keep old age reads for compatibility. Birthday greetings are deferred.
- Progress keeps a separate append-only local body-weight journal, seeded once on setup completion. Show initial/current kg, neutral change, selected-period curve and Add measurement. Saved workout statistics never include profile measurements.
- Reads/writes serialize. Corrupt records are retained with an explicit error. Retry recovers the initial seed. Reset waits for pending writes, removes the journal, and reconciles restored measurements on failure.
- Primary text uses existing dark theme tokens. The in-chat adaptation scopes its CSS to avoid host dark-mode and utility collisions.

No cloud sync, automatic working-weight prescription, birthday notification, dependency addition or Expo server is included. Native keyboard, gesture, safe-area and Dynamic Type acceptance requires physical-phone review.
