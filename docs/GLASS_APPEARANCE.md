# Glass appearance

Use the dock glass material for the fixed brand header. Let scrolling page
content move behind the header and keep the wordmark and slogan above the glass.
Respect Reduce Transparency and keep header opacity independent of dock
transparency. Both controls live in Appearance and preview their own target.

Use `AppSlider` for comparable sliders throughout CRESUM. The shared component
uses a clear glass thumb and keeps the underlying native adjustable control.
Place percentage values beside their labels when showing percentages.

The Workout tab shows the plan action, an outlined empty workout action and saved
templates when there is no active session. Start from plan uses the next program
slot when available and otherwise opens the plan chooser. An empty session uses
the standard workout editor and is independent of saved templates.
