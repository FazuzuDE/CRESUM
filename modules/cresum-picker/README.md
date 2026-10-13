# CRESUM native picker

Local Expo module, automatically linked from `modules/` in iOS builds. No external picker dependency and no production storage changes. `AppPicker` is the single application entry point, including date and History count wheels.

UIKit owns the wheel rendering, scrolling, accessibility and standard wheel click. Discrete UISelectionFeedbackGenerator feedback is emitted on changed selections, not prop updates. Availability and audio are system/device controlled; do not force a private system sound. All date columns use explicit day/month/year order regardless of locale.

Set entry observes a simultaneous public pan gesture and reports interaction activity until UIKit's settled `didSelectRow`, including an unchanged row. Save/mode/step controls wait for that event; unrelated React clock renders must not reset a moving native wheel. Cancellation/detachment releases activity. No private UIKit scroll subviews or private sound IDs are used. iPhone acceptance must include fast flick → Save/Keypad, unchanged-row release and gesture cancellation; TypeScript/Jest and JS export do not compile or validate this Swift interaction.

Expo Go cannot load custom native modules. Android, web and missing-module environments use the shared accessible fallback, with supported selection haptics and no claimed native audio. A new iOS native/development build is required after adding this module. No Expo/native app was launched during this implementation.

Verified locally: autolinking resolves CresumPicker / CresumPickerModule, TypeScript adapter and selection/date/draft tests. Linux cannot compile UIKit; existing JS-export CI does not replace an iOS build. Before release, compile with Xcode and review on a physical iPhone: click under system sound/mute preferences, haptic availability, VoiceOver per column, Dynamic Type, month/day clamping, and modal dismissal.
