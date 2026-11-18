# CRESUM native picker

Local Expo module, automatically linked from `modules/` in iOS builds. No external picker dependency and no production storage changes. `AppPicker` is the single application entry point, including date and History count wheels.

UIKit owns the wheel rendering, scrolling, accessibility and standard wheel click. Discrete UISelectionFeedbackGenerator feedback is emitted on changed selections, not prop updates. Availability and audio are system/device controlled; do not force a private system sound. All date columns use explicit day/month/year order regardless of locale.

Set entry observes a simultaneous public pan gesture and reports interaction activity until UIKit's settled `didSelectRow`, including an unchanged row. Save/mode/step controls wait for that event; unrelated React clock renders must not reset a moving native wheel. Cancellation/detachment releases activity. No private UIKit scroll subviews or private sound IDs are used. iPhone acceptance must include fast flick → Save/Keypad, unchanged-row release and gesture cancellation; TypeScript/Jest and JS export do not compile or validate this Swift interaction.

Expo Go cannot load custom native modules. Android, web and missing-module environments use the shared accessible fallback, with supported selection haptics and no claimed native audio. A new iOS native/development build is required after adding this module. No Expo/native app was launched during this implementation.

Verified locally: autolinking resolves CresumPicker / CresumPickerModule, TypeScript adapter and selection/date/draft tests. Linux cannot compile UIKit; existing JS-export CI does not replace an iOS build. Before release, compile with Xcode and review on a physical iPhone: click under system sound/mute preferences, haptic availability, VoiceOver per column, Dynamic Type, month/day clamping, and modal dismissal.

## Cyclic language selection

`AppPicker` accepts an opt-in `cyclic` mode used by the language dialog. Cyclic
wheels use the same accessible virtualized JS renderer on every platform,
including custom iOS builds that contain this module. The UIKit adapter remains
bounded and is used by ordinary date/number wheels. No Swift or SDK update is
required for cyclic language selection in Expo Go.

The renderer repeats the logical options on a virtualized runway and silently
recenters after drag/momentum settles. Public selection events and accessibility
values use the original option indices, never repeated-row indices. Recentring
and prop/geometry synchronization must not emit haptics or persist a draft.
Language confirmation waits for motion to stop; a release without momentum also
releases the confirmation lock. Native gesture feel and screen-reader behavior
still require physical-device acceptance.

### Momentum follow-up

Cyclic wheels use normal platform deceleration and native-driver Animated scroll
mapping on iOS/Android (JS driver on web). Movement only updates physical-index
refs; draft selection and haptic feedback publish once after settling. The idle
fallback extends on each coast event when momentum callbacks are missing, rather
than interrupting motion a fixed delay after finger release. This is JS adapter
work and does not modify or compile the bounded UIKit module.

### Opt-in language click

LanguageSettings opts the cyclic JS wheel into a quiet bundled 35 ms click using
expo-audio. It is an application effect, not UIKit's system click. Bounded UIKit
wheels do not opt in. The mounted language wheel owns two players that rewind
after playback and are released on dismissal. The effect respects silent mode
and mixes with music. Requests play only when a player is ready and remain
throttled. This uses the existing SDK and its public foreground audio APIs.
