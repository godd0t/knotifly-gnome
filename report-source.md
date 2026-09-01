# Knotifly v0.1: Product and Technical Research Brief

Audience: Knotifly co-author and implementer  
Date: 2026-08-16  
Scope: GNOME Shell 50 on Ubuntu 26.04; initial release feature planning; macOS-inspired interaction patterns without cloning macOS  
Assumptions: Knotifly remains a GNOME Shell extension, keeps GNOME notification history as the source of truth, and favors a small native implementation over a new runtime or service.

## Executive answer

Knotifly should ship as a focused “notification stage,” not as a second notification center. The product should keep the current native GNOME `MessageList.NotificationMessage` for content, actions, expansion, and accessibility, then add a distinctive layer of choreography around it: one calm foreground card, a quiet depth cue for queued items, an interruption policy that batches low-value bursts, and a small set of user controls for position, density, motion, and focus behavior.

The macOS inspiration is useful at the level of behavior: grouping, catch-up, per-app control, interruption levels, and a clear distinction between immediate alerts and deferred information. Apple’s guidance explicitly frames Focus and scheduled delivery as ways to filter interruption while keeping the notification available, and its Mac guidance uses grouped stacks in Notification Center. [1][2] The Knotifly version should translate those ideas into GNOME’s existing notification list and session modes instead of recreating the history surface.

The strongest initial-release identity is “calm motion with visible depth”: a notification arrives as a soft, compact card; queued items appear as restrained offset layers or an app-icon/count rail; the current item remains the only fully readable surface; hover pauses time; click expands context; urgency controls interruption. This is more ownable than copying macOS translucency or making a generic glassmorphism card.

Do not add a library, daemon, database, custom notification history, cloud sync, or theme editor in v0.1. GJS, St, Clutter, GLib, Gio, GNOME Shell’s existing message-list widget, and the already-used GTK 4/libadwaita preferences stack are enough. GNOME’s extension documentation also warns that Shell internals change and recommends leaning on stable platform APIs where possible. [3][4]

## What exists today

The repository is intentionally small and already has a coherent base:

- `extension.js` owns the normal enable/disable lifecycle and creates one `BannerManager`.
- `bannerManager.js` blocks the native banner renderer, watches `Main.messageTray` sources, queues up to three noncritical notifications, sorts by urgency, respects fullscreen/busy/session conditions, and renders GNOME’s `MessageList.NotificationMessage`.
- The current card already inherits source icon, title, body, expansion, actions, critical urgency behavior, and sound behavior from GNOME’s native message widget.
- `stylesheet.css` provides light/dark appearance, compact/comfortable density, rounded geometry, hover states, and reduced-motion handling through the manager.
- `prefs.js` already uses `Adw.PreferencesPage`, `Adw.PreferencesGroup`, `Adw.SpinRow`, `Adw.ComboRow`, and `Adw.SwitchRow`.
- The schema exposes four settings: appearance, density, display duration, and click-to-expand.

The repository’s local validation shows the schema and GJS settings-model check pass. `make test` and `make pack` currently stop before those checks because the `eslint` executable is not installed in the environment; this is an environment/tooling gap, not evidence of a product defect. The generated package inspected during research contains the XML schema rather than the compiled schema binary, which is the correct packaging direction for GNOME 44+ guidance. [5]

## Product thesis: a notification stage

### The feeling

Knotifly should feel like a quiet, responsive layer that notices events without demanding the whole desktop’s attention. Use macOS as a reference for restraint and grouping, but make the signature GNOME-native:

- “One thing at a time” keeps the foreground readable.
- “Quiet depth” makes waiting work visible without showing a noisy list.
- “Interruption is earned” means low/normal/critical are materially different.
- “History stays GNOME” avoids a duplicate notification center and reduces state drift.
- “Motion explains state” means entrance, pause, queueing, and dismissal are visually legible.

### The signature interaction

Call the behavior `Flow` in product copy and keep the implementation name simple. The stage has three visual states:

1. **Arrive** — the active card enters with the existing soft motion, plus a small source accent or edge signal. Do not animate text, flash, or pulse continuously.
2. **Wait** — queued items create a shallow depth cue behind the active card, showing at most two app icons and a count. The queue is information, not another stack of full cards.
3. **Catch up** — when the user hovers or clicks, the active card pauses and expands; when several items were held during busy/fullscreen/DND conditions, the stage shows a compact “N waiting” summary state that hands off to GNOME’s existing notification list after the integration path is validated.

This makes the extension feel richer without turning every incoming event into a separate custom widget.

## Initial-release scope

### Ship in v0.1

**1. Queue choreography**

Keep the existing queue, but add a quiet depth indicator for up to two waiting items and a count when more exist. Preserve urgency ordering and the current three-item cap unless a test shows that dropping normal notifications is confusing. Add deterministic tests for ordering, duplicate suppression, removal, and critical bypass behavior.

**2. Placement and responsive geometry**

Add top-center, top-right, and top-left placement with a safe monitor-edge margin. Keep the default top-center for GNOME coherence. Make width use a bounded range rather than a fixed `em` width so narrow displays, large text, and translated strings remain usable.

**3. Interruption modes**

Expose three plain-language choices: `Calm`, `Balanced`, and `Immediate`. They should map to timing/queue presentation, not override GNOME’s app policies or urgency semantics. `Calm` batches noncritical bursts more aggressively; `Balanced` is the current behavior; `Immediate` shows the queue promptly but still respects fullscreen, busy, session mode, and app policy.

**4. Focus-aware hold state**

Keep using GNOME’s existing busy/fullscreen/session checks. Represent held notifications with a small count indicator rather than silently dropping them. Do not invent a second Do Not Disturb system; GNOME’s notification availability and history should remain authoritative.

**5. Motion and accessibility controls**

Keep the current reduced-animation behavior and add an explicit `Motion: System / Gentle / Off` preference only if the visual system needs it after testing. Ensure every new clickable affordance has a label, can be reached with the keyboard where the Shell allows it, and does not rely on color alone. GNOME’s HIG specifically calls for careful notification volume, summaries for high-event apps, and non-color-only communication. [6]

**6. Preferences that describe outcomes**

Organize settings into two groups: `Behavior` (placement, interruption mode, duration, click-to-expand) and `Appearance` (density, system/light/dark, motion). Keep the current Adwaita preference rows. Do not add an advanced page until the basic model has stabilized.

### Defer to v0.2+

- Per-application rules such as mute, always show, or custom duration. This is high-value, but it needs a durable source identifier and clear policy semantics rather than matching only visible app titles.
- User-controlled grouping by app or topic. macOS’s grouping model is useful, but GNOME notification sources and notification objects need to be mapped and tested before making grouping promises.
- A persistent notification journal or search UI. GNOME already owns notification history; storing a second copy creates privacy, deletion, and consistency work.
- Snooze, undo, reminders, and “mark read.” These require action semantics and app cooperation that the renderer should not fake.
- User-selected accent colors, blur strength, corner-radius sliders, and a theme editor. They produce option density and compatibility cost before the core interaction is proven.

### Do not build for the initial release

- A new runtime dependency or web UI toolkit.
- A background daemon or D-Bus service solely for rendering banners.
- A replacement notification center.
- Custom reimplementation of notification content/actions.
- Fullscreen blur/backdrop effects. GNOME Shell CSS and compositor behavior make this a fragile identity anchor; translucent color, border, shadow, and depth are safer.
- Cross-version compatibility adapters for several Shell majors before GNOME 50 behavior is solid.

## Technical recommendation

### Keep the native stack

Use the existing native stack:

- `MessageList.NotificationMessage` for notification content and actions.
- `St.Widget` and `Clutter` for the Shell actor tree and motion.
- `GLib` for timers and monotonic deadlines.
- `Gio.Settings` for preferences and the desktop interface settings.
- `Gtk 4` and `Adw` for preferences.

The GNOME Shell source documents the notification object as carrying title, body, icon, urgency, acknowledgement, actions, and activation behavior. The existing Knotifly code benefits from this by decorating the native message rather than owning those behaviors. [7]

Avoid a React/WebKit/TypeScript runtime, animation library, or CSS utility layer. If editor autocomplete becomes a bottleneck, type definitions can be considered as a development-only aid later; they are not needed to ship the extension.

### Minimal code shape

Keep `BannerManager` as the owner of lifecycle and actors. Add only small pure policy helpers when the new queue behavior needs them:

- `getNotificationPriority(notification)`
- `shouldHoldNotification(notification, shellState, settings)`
- `getQueueSummary(queue)`

Those helpers are worth extracting only when they can be tested without a running Shell. Until then, the current file is smaller and easier to reason about. The queue model should not become a framework.

### Compatibility boundary

The current implementation imports private Shell modules such as `main.js`, `layout.js`, `messageList.js`, and `messageTray.js`. This is acceptable for a GNOME Shell extension, but it is an explicit compatibility boundary. GNOME’s documentation explains that Shell extensions patch a moving implementation surface; APIs such as GLib/GIO are stable, while Shell internals can change. [3][4]

For v0.1:

- Target GNOME Shell 50 only, as the metadata already does.
- Keep every private import in one manager file.
- Add a release checklist that runs the smoke test on the target Shell version.
- Before supporting GNOME 51, inspect the changed Shell notification classes and update the smoke test first.
- Do not hide version-specific differences behind a compatibility abstraction until a second Shell version actually requires one.

### Settings and packaging

Use GSettings for durable user preferences. Prefer a small number of semantic enum strings over many booleans. The existing schema is a good base; add keys only when a visible behavior ships. Keep the schema XML in the package and avoid shipping `gschemas.compiled`, consistent with GNOME’s extension upgrade guidance. [5]

The existing preferences implementation already follows the current GNOME extension pattern: preferences run in a separate GTK/libadwaita process, while `extension.js` runs inside the Shell process. Keep that separation; it limits the blast radius of preferences bugs. [8]

### Visual language

Use a restrained “soft material” treatment:

- 16–18px radius, not an exaggerated pill for every component.
- One source accent line or icon treatment, not a full rainbow card.
- A subtle elevation shadow and 1px outline.
- System light/dark by default.
- Existing Adwaita/GNOME style variables where available; keep custom CSS small.
- Content-first typography: source and title carry hierarchy, body remains quieter.
- One progress/life cue at most, and only if it communicates remaining time without becoming a countdown distraction.

GNOME’s styling guidance recommends minimizing custom styling and reusing existing style classes and color variables so light, dark, high-contrast, accessibility, and future compatibility remain viable. [9]

## Competitive and pattern scan

The GNOME Extensions catalog shows demand for notification position, animation, expansion, and content customization. Notification Banner Reloaded focuses on position and animation and has broad historical Shell-version coverage; Expandable Notifications focuses on expansion modes in the notification list. These are useful signals that users want control over placement and expansion, but they also leave room for Knotifly to own queue choreography and interruption rhythm rather than compete on a settings checklist. [10][11]

The Apple pattern worth borrowing is not the visual glass. It is the behavior model: grouped stacks for catch-up, notification settings per app, and a distinction between passive, active, time-sensitive, and critical interruption. Apple’s guidance also warns that critical or time-sensitive delivery should be reserved for information that genuinely matters now. [1][2][12] On GNOME, translate that principle into respectful handling of existing urgency rather than allowing Knotifly to promote normal notifications into critical ones.

## Suggested build order

1. **Baseline hardening:** preserve current behavior; add missing test coverage around queue ordering, source removal, timeout pause/resume, critical persistence, disable cleanup, and setting changes.
2. **Flow foundation:** add a queue-summary model and render a small depth/count cue without replacing `NotificationMessage`.
3. **Placement:** add safe top-left/top-center/top-right positioning and responsive width constraints.
4. **Interruption mode:** add Calm/Balanced/Immediate with one setting and observable queue behavior.
5. **Hold state:** make busy/fullscreen/session-held items visible through the count cue and verify no duplicate sound or acknowledgement behavior.
6. **Preferences polish:** split Behavior and Appearance groups, add only the settings now proven by the renderer.
7. **Visual QA:** test normal, long, translated, action-rich, critical, high-contrast, large-text, reduced-motion, fullscreen, busy, and multi-monitor scenarios.
8. **Release gate:** run schema validation, GJS model checks, lint, packaging, headless smoke, and a real Wayland visual check on GNOME Shell 50.

## Acceptance criteria for v0.1

- A normal notification appears once, remains readable, pauses on hover, and can expand on click.
- A critical notification is not hidden by the normal queue and remains available until acknowledged.
- A burst of notifications is represented by one readable foreground card plus a quiet count/depth cue; no notification storm is created.
- Removing a source or disabling the extension leaves no actors, timers, signal handlers, or banner-blocking state behind.
- Fullscreen, busy, session, and existing application notification policies continue to work.
- Light, dark, reduced-motion, large text, high-contrast, narrow display, and translated strings remain usable.
- Users can discover the core behavior in preferences without needing to understand internal terms such as “source,” “actor,” or “urgency enum.”
- The extension adds no runtime dependencies and does not create a second notification history.

## Open decisions

The following decisions should be made with a quick prototype rather than extended debate:

- Is the depth cue more legible as offset cards, app-icon chips, or a single count pill?
- Should a held queue automatically reappear when the user leaves fullscreen/busy state, or should it wait for the next notification?
- Does top-right feel more GNOME-native for a compact card, or does top-center better preserve discoverability?
- Is the life/progress cue calming or distracting at the default 2.5 seconds?
- Can the notification-list handoff be reached without depending on an overly private Shell path?

## Uncertainty and limitations

This brief is grounded in the current local repository, GNOME’s current HIG and extension documentation, GNOME Shell source/documentation, the GNOME Extensions catalog, and Apple’s current notification guidance. It does not include user interviews, telemetry, an accessibility audit with assistive technologies, or a multi-version Shell compatibility run. The recommendations about Knotifly’s unique feel are product inference, not claims that a particular interaction will be preferred by users.

The most important technical uncertainty is Shell-internal API drift. The safest response is a narrow GNOME 50 target, a small private-import surface, and a release smoke test—not a speculative compatibility layer.

## Claim-to-source ledger

1. Apple Developer Documentation, “Managing notifications,” Apple, updated/crawled 2026. https://developer.apple.com/design/human-interface-guidelines/managing-notifications — Focus, scheduled delivery, interruption levels, and the distinction between immediate and deferred notifications. citeturn6search0
2. Apple Support, “Notification Center on your Mac” and “Notifications settings on Mac,” Apple, current support pages crawled 2026. https://support.apple.com/guide/mac-studio/notification-center-apd6d7eb47b9/mac and https://support.apple.com/en-mide/guide/mac-help/-mh40583/mac — Grouped stacks, catch-up, per-app settings, and notification grouping. citeturn6search1 citeturn6search2
3. GNOME Developer Documentation, “API Stability,” GNOME Project, current 2026. https://developer.gnome.org/documentation/guidelines/maintainer/api-stability.html — Stability boundaries for platform and internal APIs. citeturn5view1
4. GJS Guide, “Updates and Breakage” and “GNOME Shell Extensions,” GNOME community documentation, current 2026. https://gjs.guide/extensions/overview/updates-and-breakage.html and https://gjs.guide/extensions/ — Shell extension architecture, private surface risk, ES modules, preferences process, and extension packaging. citeturn8search10 citeturn8search5
5. GJS Guide, “Port Extensions to GNOME Shell 44,” GNOME community documentation, current 2026. https://gjs.guide/extensions/upgrading/gnome-shell-44.html — Schema packaging guidance for GNOME 44+. citeturn8search8
6. GNOME Human Interface Guidelines, “Notifications,” GNOME Project, current 2026. https://developer.gnome.org/hig/patterns/feedback/notifications.html — Notification volume, summaries, user control, content hierarchy, and action guidance. citeturn5view0
7. GNOME Shell source, `js/ui/messageTray.js`, GNOME GitLab, current main branch accessed 2026. https://gitlab.gnome.org/gnome/gnome-shell/blob/main/js/ui/messageTray.js — Notification object fields and behavior surfaced through the Shell message tray. Context7 query result selected `/git_gitlab_gnome_org/gnome_gnome-shell`.
8. GJS Guide, “Anatomy” / preferences examples, current 2026. https://gjs.guide/extensions/ — `ExtensionPreferences`, `Adw.PreferencesPage`, GTK process separation, and extension metadata. citeturn8search5
9. GNOME Human Interface Guidelines, “UI Styling,” GNOME Project, current 2026. https://developer.gnome.org/hig/guidelines/ui-styling.html — Minimize custom styling; reuse system style variables; preserve light/dark/high-contrast behavior. citeturn0search10
10. GNOME Shell Extensions, “Notification Banner Reloaded,” GNOME Project catalog, current 2026. https://extensions.gnome.org/extension/4651/notification-banner-reloaded/ — Existing demand and precedent for position/animation controls. citeturn5view2
11. GNOME Shell Extensions, “Expandable Notifications,” GNOME Project catalog, current 2026. https://extensions.gnome.org/extension/4463/expandable-notifications/ — Existing demand and precedent for configurable expansion. citeturn5view3
12. Apple Developer Documentation, “Notifications,” Apple, updated/crawled 2026. https://developer.apple.com/design/human-interface-guidelines/notifications — Notification anatomy, app icon/title/body/actions, and interruption framing. citeturn6search6

Local evidence: `/home/godd0t/Desktop/knotifly/extension.js`, `bannerManager.js`, `prefs.js`, `stylesheet.css`, `schemas/org.gnome.shell.extensions.knotifly.gschema.xml`, `tests/settings-model.test.js`, `tests/smoke.js`, `Makefile`, `README.md`; inspected 2026-08-16. Runtime checks: GNOME Shell 50.1, GJS 1.88.0, GLib 2.88.0; schema validation and GJS settings model passed; lint/pack were blocked by missing `eslint` executable.
