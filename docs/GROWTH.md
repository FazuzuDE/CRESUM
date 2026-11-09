# CRESUM Growth Foundation — approved marketing roadmap

> Status: approved strategy and planning workstream, **not** an implementation or launch record.
> Approved: 2026-11-09. Owner: CRESUM. Primary planning document: `docs/ROADMAP.md`.

## Positioning and audience

CRESUM is a free-at-launch, offline-first strength-training log with visual exercise guidance,
equipment choice, reusable workouts, History, and understandable Progress analytics.
Market the outcome: **start a session quickly, log reliably, and see progress**.
Do not claim unique features, published app availability, verified health benefits,
complete image coverage, or live cloud sync before their release gates pass.

First audience: recreational gym and strength-training users, starting with Germany
and relevant German- and Russian-speaking communities. Localize publishing and store
assets for DE, RU and FR when each locale is release-ready; expand English-language
promotion and other regions based on evidence. Do not assume a language's
in-app readiness from the existence of translation files.

## Independent phases and exit gates

| Phase | Scope | Proposed directional target | Gate to advance |
| --- | --- | --- | --- |
| G0 — preparation, before public release | Brand handles, landing page + beta opt-in, content templates, attribution conventions, privacy review and beta recruitment | 50–100 **active** beta testers | Core onboarding → logged sets → Finish → saved History/Progress is reliable on supported devices |
| G1 — first 1–3 months after release | Localized store pages/ASO, recurring short videos, creator outreach, feedback and onboarding improvements | 1,000–3,000 cumulative installs | Stable first-workout completion and healthy D7 cohorts |
| G2 — 3–6 months after release | Multiply winning formats, educational exercise pages, trainer pilots, small paid-channel experiments | 10,000 cumulative installs **aspiration** | D30 retention, acquisition quality and measurable landing/store conversion justify spend |
| G3 — 6–18 months and beyond | Expand high-performing markets/channels, partnerships and localized catalog content | 100,000+ cumulative installs **ambition**, not forecast | Repeatable sustainable growth, privacy compliance and reliable operations |

Targets are planning hypotheses, not promises or industry benchmarks. Adjust after measured cohorts.
Do not promise calendar launch dates while native/device and store readiness remain open.

## Channels and experiments

1. **Short-form video:** Prepare 4–7 pieces weekly as capacity permits; cross-post fitness
   technique, exercise variants, equipment differences, and real product demonstrations
   to Instagram Reels, TikTok and YouTube Shorts. Localize proven formats rather than
   creating unreviewed medical or biomechanical claims.
2. **Store discovery (ASO):** Test honest app title/subtitle/keywords, screenshot
   sequence, preview content and localized descriptions. Start with DE; then target
   supported locales. Measure store impression → page view → installation conversion.
3. **Coaches and micro-creators:** Pilot 10–20 relevant contacts per month, proposing
   test access, transparent sponsorship terms and measurable opt-in referral links.
   Never buy reviews or incentivize ratings.
4. **Educational search content:** Publish accessible, source-reviewed exercise
   pages based on approved CRESUM visuals and technique notes. Link to relevant
   functionality and the beta/store page. Respect source licenses and avoid plagiarism.
5. **Voluntary sharing:** Later propose branded shareable workout/progress cards,
   user-controlled exports and a referral program in separate reviewed PRs. No
   public social feed or automatic disclosure of workout/history data in this phase.

## Budget and measurement

Proposed *optional* monthly exploration envelope after beta:
- Content produced in-house: €0 marginal cash outlay (time still has a cost).
- Video/design tools: €0–30.
- Micro-creator trials: €0–150.
- Paid acquisition experiments: €100–300 **only after retention evidence**.
- Illustrative combined cash spend: €100–480/month if a paid test is authorized.
No amount is a budget commitment; do not create subscriptions, ad campaigns or purchases
without separate approval. CRESUM's **initial release remains free, without ads or paid plans**.

Proposed internal hypothesis metrics (not market benchmarks):
- First-workout completion: >=60% of new installers who reached onboarding.
- D7 retention: >=30% and D30 retention: >=20% of defined install cohorts.
- Typical weekly workouts per active user: 2–4 as a research hypothesis.
- Track qualitative feedback, core crash rate, store conversion and
  7/30-day active cohorts alongside install totals; define stable denominators.

**Analytics guardrail:** design minimal, privacy-respecting, consent-aware events,
aggregates and opt-outs before any SDK or tracking is shipped. Avoid collecting
exercise details, health data or user identifiers merely to improve advertising.
Respect EU privacy requirements and store policies. Tracking/attribution tools
are candidates, not authorized integrations.

## Focused task queue (not marked complete)

- [ ] `GROW-01` Reserve and consistently brand official handles; document ownership/access recovery.
- [ ] `GROW-02` Build an accessible, mobile-first, multilingual landing page with a privacy-reviewed beta opt-in.
- [ ] `GROW-03` Make a reusable 15–30 second product/exercise video format using approved visual assets.
- [ ] `GROW-04` Prepare truthful localized ASO metadata and screenshots, conditional on release readiness.
- [ ] `GROW-05` Set up opt-in beta recruitment, feedback intake, issue triage and small-phone QA loop.
- [ ] `GROW-06` Specify minimal aggregated funnel/retention metrics, data governance and admin dashboard;
  implementation is a separate technical PR and needs privacy review.
- [ ] `GROW-07` Run organic distribution experiments, record results and review them monthly.
- [ ] `GROW-08` Test creator outreach and paid channels only with explicit campaign/budget approval.
- [ ] `GROW-09` Design share-card and referrals as proposals, then obtain separate product approval before implementation.

## Coordination with engineering

This is an **independent, non-blocking** workstream. It does not displace the
Workout Engine, Exercise Library/equipment illustrations, offline reliability,
account/sync acceptance, localization or native/device release gates.
Each implementation gets its own narrow PR. Keep brand/asset acceptance and
license provenance intact; do not treat draft illustrations as production-ready.
