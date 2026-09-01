---
version: 1
slug: "bannermanager-js"
primary_target: "bannerManager.js"
related_targets: ["stylesheet.css","prefs.js"]
---

# Banner interaction layer

- Scope: `bannerManager.js`, `stylesheet.css`, and the related preferences; mode: Operate.
- Audience/job: GNOME Shell 50 users triaging notifications without leaving their current task.
- Task: identify the source and urgency, read enough context, invoke an app-provided action, expand details, dismiss, or advance to the next queued item.
- Constraints: preserve GNOME's notification history, native `NotificationMessage`, and `Super+N` focus shortcut; never steal focus; respect per-app banner policy, fullscreen/busy state, reduced animations, and critical persistence.
- Direction: evolve the incumbent calm GNOME-native surface into a compact one-at-a-time control strip. Neutral cards use a restrained system palette; actionable and critical states receive purposeful accent, not decoration.
- Form record: `local-extension-no-roll`; the established GNOME surface was extended directly, as required for a local extension, without a replacement-world concept tournament.
- Memorable moment: engaging with the banner reveals native actions while pausing dismissal; the attached queue control turns “waiting” into a clear Next action.
- Motion: 220 ms settle-in, 160 ms exit, and a 450 ms calm gap between queued banners; all become immediate when animations are disabled.
- Verified: GNOME Shell 50.1 Wayland covered actionable-critical delivery, hover pause, `Super+N` focus, reduced motion, preferences, and clean disable/re-enable.
