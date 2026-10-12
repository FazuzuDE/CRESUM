# Native pickers and calendar implementation plan

> **For agentic workers:** Execute inline with superpowers:executing-plans; use one final independent review.

**Goal:** Apply the approved day/month/year wheel interaction, add Profile library navigation, and put Home's week above the workout with a full monthly calendar.

**Architecture:** Shared AppPicker wraps a local iOS UIPickerView and a snapping accessible fallback. AppDatePicker normalizes local dates; confirmation owns drafts. Library reuses existing content. Monthly calendar reads saved History only.

**Tech Stack:** React Native, TypeScript, Expo Modules, UIKit, existing Expo Haptics.

**Spec:** User request of 2026-10-11; synchronized rules in PRODUCT.md and DESIGN_SYSTEM.md.

## Global constraints

- No Expo server, native launch, auto-merge or changes to workout storage.
- Use native light system typography, existing theme tokens and practical touch targets.
- Date order is day, month, year. Unconfirmed selections must not change stored answers or filters.
- Native system sound follows iOS settings; no undocumented sound IDs or synthetic click assets.
- All existing/future wheels use the shared component; browser fallback cannot reproduce native audio.

## Review focus

- Leap day and shorter-month changes clamp the day without rolling into another month.
- Mount, prop synchronization and repeated rows must not emit selection feedback.
- Cancel or dismiss retains the previously applied birthday/date/count.
- Profile browsing must not show inert Add actions or mutate a workout.
- Calendar marks completed sessions only, including multiple sessions per local date.

### Task 1: Shared wheels and date entry

Files: components/AppPicker.tsx, AppDatePicker.tsx, DatePickerSheet.tsx, HistoryCountWheel.tsx, HistoryDatePicker.tsx, Onboarding.tsx; lib/picker-date.ts; modules/cresum-picker; picker and onboarding tests.

- [x] Write/run failing tests for date clamping, feedback deduplication, confirmed/cancelled birthdays and existing count interactions.
- [x] Implement shared native iOS view and accessible snapping fallback; replace date text input and date/calendar filter selectors; retain ISO persistence.
- [x] Run picker/onboarding/history tests and typecheck.

### Task 2: Profile library and monthly Home calendar

Files: ProfileSettings.tsx, ExerciseLibrary.tsx, HomeDashboard.tsx, CalendarMonth.tsx, HomeCalendar.tsx, lib/home-dashboard.ts; relevant screen tests.

- [x] Write/run failing tests for Profile navigation, read-only library, calendar-first order and saved-session month markers.
- [x] Reuse library in page presentation; insert compact entry after WORKOUTS. Move week first; implement monthly modal with month navigation and selected-day details.
- [x] Run affected tests; preserve Start/Resume, filters and shared smooth up-arrow.

### Task 3: Validation and delivery

- [x] Sync product/design/roadmap/decision documents and update the source-derived in-chat preview.
- [x] Run full tests, typecheck, lint, formatting, config and dependency checks; verify local module autolinking without launching Expo.
- [x] Obtain final independent review and fix all five material findings with regression tests.
- [ ] Commit and open focused PR against verified develop HEAD.
- [ ] Deliver PR, inline test-data preview, and explicit native-build/physical-device limitations.

## Verification record

- Full suite: 558 tests in 58 suites; TypeScript, lint, formatting and public config checks passed.
- Dependency network check timed out; offline SDK compatibility check passed.
- Local native-module autolinking resolves CresumPicker / CresumPickerModule.
- In-chat preview: Home order, month navigation, browse/search, History, dark host isolation, DOB confirmation/cancellation and onboarding to START verified without JavaScript errors.
- Review fixes: rejected row resynchronization, Dynamic Type recentering, valid DOB year floor, drag ownership, and non-nested wheel scrolling.
- UIKit compilation and physical iPhone sound/haptics/VoiceOver/Dynamic Type remain unverified; no native app or Expo server was launched.
