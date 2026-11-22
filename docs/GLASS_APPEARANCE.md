# Glass appearance

Use the dock glass material for the fixed brand header. Let scrolling page
content move behind the header and keep the wordmark and slogan above the glass.
Extend the glass across the top safe area to the screen edge. Fade the material
into the content at the bottom without a border.
Respect Reduce Transparency and keep header opacity independent of dock
transparency. Both controls live in Appearance and preview their own target.

## Slider standard

Approved on 2026-11-22. Use the `AppSlider` implementation shipped in PR #303
as the default for existing and future sliders throughout CRESUM. The
standard native thumb and track are approved both at rest and during touch.
Keep the opaque native thumb at rest and preserve the platform's native
press and drag feedback. Use the shared component without custom thumb
overlays or changes to its pressed state.
Place percentage values beside their labels when showing percentages.

## Workout tab

The Workout tab shows the plan action, an outlined empty workout action and saved
templates when there is no active session. Start from plan uses the next program
slot when available and otherwise opens the plan chooser. An empty session uses
the standard workout editor and is independent of saved templates.
