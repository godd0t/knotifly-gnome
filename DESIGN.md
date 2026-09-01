---
name: Knotifly
description: Calm, compact notification control surfaces for GNOME Shell 50.
colors:
  light-foreground: "rgba(22, 22, 24, 0.96)"
  dark-foreground: "rgba(250, 250, 252, 0.96)"
  light-card: "rgba(250, 250, 252, 0.98)"
  dark-card: "rgba(38, 39, 43, 0.98)"
  light-actionable: "rgb(244, 249, 254)"
  dark-actionable: "rgb(34, 43, 53)"
  light-critical: "rgb(255, 246, 235)"
  dark-critical: "rgb(57, 42, 31)"
  light-muted: "rgba(22, 22, 24, 0.68)"
  dark-muted: "rgba(250, 250, 252, 0.72)"
  light-action-text: "rgb(24, 82, 143)"
  dark-action-text: "rgb(190, 221, 255)"
  light-action-wash: "rgba(28, 113, 216, 0.10)"
  dark-action-wash: "rgba(120, 183, 250, 0.14)"
  light-action-hover: "rgba(28, 113, 216, 0.18)"
  dark-action-hover: "rgba(120, 183, 250, 0.24)"
  light-queue: "rgba(227, 240, 252, 0.98)"
  dark-queue: "rgba(39, 64, 91, 0.98)"
  light-queue-hover: "rgb(210, 231, 250)"
  dark-queue-hover: "rgb(51, 80, 111)"
  light-focus: "rgba(28, 113, 216, 0.9)"
  dark-focus: "rgba(120, 183, 250, 0.95)"
  shadow: "rgba(0, 0, 0, 0.26)"
typography:
  title:
    fontWeight: 600
  action:
    fontWeight: 600
  queue-label:
    fontSize: "0.82em"
    fontWeight: 600
rounded:
  action: "10px"
  queue: "12px"
  banner: "16px"
spacing:
  control-hit: "5px"
  compact: "6px"
  comfortable-content: "7px"
  host-top: "10px"
  queue-inline: "12px"
components:
  banner-compact:
    rounded: "{rounded.banner}"
    padding: "{spacing.compact}"
    width: "28em"
  banner-comfortable:
    rounded: "{rounded.banner}"
    padding: "10px"
    width: "30em"
  action-button-light:
    backgroundColor: "{colors.light-action-wash}"
    textColor: "{colors.light-action-text}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
  action-button-dark:
    backgroundColor: "{colors.dark-action-wash}"
    textColor: "{colors.dark-action-text}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
  queue-cue-light:
    backgroundColor: "{colors.light-queue}"
    textColor: "{colors.light-action-text}"
    typography: "{typography.queue-label}"
    rounded: "{rounded.queue}"
    padding: "3px 12px"
    width: "24em"
  queue-cue-dark:
    backgroundColor: "{colors.dark-queue}"
    textColor: "{colors.dark-action-text}"
    typography: "{typography.queue-label}"
    rounded: "{rounded.queue}"
    padding: "3px 12px"
    width: "24em"
---

# Design System: Knotifly

## Overview

**Creative North Star: "The Compact Control Surface"**

Knotifly treats a notification as a small, temporary control surface rather than a passive bubble or a second notification center. It extends GNOME's native `NotificationMessage` with quiet semantic surfaces, progressive expansion, purposeful actions, and an attached queue cue.

The interface stays calm and native: one readable card at a time, system typography, compact geometry, and accent only when action, focus, queue state, or urgency needs to be understood.

**Key Characteristics:**

- GNOME-native content and controls
- One compact foreground card
- Blue actionable states and warm critical states
- Progressive disclosure without focus theft
- Light, dark, compact, and comfortable variants

## Colors

The palette is semantic and appearance-aware: neutral cards carry ordinary content, cool blue surfaces identify interaction, and warm surfaces distinguish critical notifications.

### Primary

- **Action Blue:** `{colors.light-action-text}` and `{colors.dark-action-text}` identify native actions and the queue control; their wash and hover tokens provide state feedback.
- **Focus Blue:** `{colors.light-focus}` and `{colors.dark-focus}` form the visible two-pixel banner focus border.

### Tertiary

- **Critical Warmth:** `{colors.light-critical}` and `{colors.dark-critical}` distinguish urgency through the card surface rather than decorative color.

### Neutral

- **Quiet Card:** `{colors.light-card}` and `{colors.dark-card}` are the standard banner surfaces.
- **Primary Text:** `{colors.light-foreground}` and `{colors.dark-foreground}` keep message content prominent.
- **Muted Metadata:** `{colors.light-muted}` and `{colors.dark-muted}` recede source, time, icon, expand, and close affordances.
- **Actionable Tint:** `{colors.light-actionable}` and `{colors.dark-actionable}` subtly mark banners that contain application-provided actions.

**The Purposeful Accent Rule.** Use blue for action, focus, and queue state, and warm surfaces for critical urgency; do not add accent as decoration.

## Typography

Knotifly inherits GNOME Shell's native typeface and message hierarchy. It changes only the weights and queue-label size required by the compact control surface.

### Hierarchy

- **Title** (`{typography.title}`): source and notification titles use semibold emphasis.
- **Action** (`{typography.action}`): application-provided action buttons use semibold labels.
- **Queue label** (`{typography.queue-label}`): the attached queue cue is smaller but semibold so its count remains legible.
- **Body and metadata:** retain the native `NotificationMessage` typography.

**The Native Type Rule.** Inherit GNOME typography; do not introduce a custom font family or parallel text scale.

## Layout

The primary display carries one top-aligned banner. The default compact card is 28em wide with a 60px minimum height; comfortable density expands it to 30em and a 68px minimum. Position may be top left, top center, or top right, with an eight-pixel outer inset at the side positions and ten pixels above the banner stack.

The attached queue cue is 24em wide and appears only when an active banner has waiting notifications. The queue holds at most three notifications including the active one, sorts by urgency, and keeps only one fully readable card visible.

**The One Banner Rule.** Queue notifications behind a single active control surface; do not build a second notification list.

## Elevation & Depth

The banner uses one soft shadow (`0 6px 20px 3px {colors.shadow}`). Depth separates the temporary card from the current workspace; the queue cue attaches below through shape and color rather than another elevation layer.

**The One Soft Layer Rule.** Use the shipped banner shadow only; do not stack decorative shadows or glass effects.

## Shapes

The main card uses the largest radius (`{rounded.banner}`). Native quick actions use the tighter action radius (`{rounded.action}`). The queue cue uses only its bottom corners (`0 0 {rounded.queue} {rounded.queue}`), making it read as attached to the active banner.

The banner always reserves a transparent two-pixel border so keyboard focus can change color without changing geometry.

## Components

### Notification banner

- **Structure:** preserve GNOME's native source icon, source title, timestamp, message title/body, expand button, close button, and application-provided actions.
- **States:** standard uses the quiet card; actionable uses the cool tint; critical uses the warm surface and remains expanded and persistent.
- **Focus:** `Super+N` expands and focuses the active banner; focus receives the appearance-aware two-pixel border.
- **Motion:** enter over 220ms with opacity, a 12px upward offset, and 0.97 scale; exit over 160ms with opacity, a 10px upward offset, and 0.98 scale. Both become immediate when GNOME animations are disabled.
- **Engagement:** hover or keyboard focus pauses dismissal. Escape dismisses. Optional hover expansion and automatic action expansion are settings; critical notifications always expand.

### Native quick actions

- **Shape:** 34px minimum height with `{rounded.action}`.
- **Color:** blue text on a low-opacity blue wash, strengthened on hover or focus.
- **Source:** actions come from the application notification; Knotifly does not invent replacements.

### Queue cue

- **Content:** `Show next · N waiting`, with singular/plural accessible names generated from the current count.
- **Behavior:** keyboard-focusable and clickable; activation dismisses the current banner and immediately advances the queue.
- **State:** its light/dark surface strengthens on hover or focus. Calm flow otherwise leaves a 450ms gap between queued banners.

### Preferences

Use stock Libadwaita `PreferencesPage`, `PreferencesGroup`, `ComboRow`, `SpinRow`, and `SwitchRow` components. Keep settings grouped as Delivery, Interaction, and Appearance; do not apply the transient-banner palette or geometry to the preferences window.

## Do's and Don'ts

### Do:

- **Do** preserve native `NotificationMessage` structure, application actions, history, policy, sounds, and the `Super+N` focus shortcut.
- **Do** pause noncritical dismissal while the pointer or keyboard is engaged with the banner.
- **Do** give focusable controls visible state feedback and a meaningful accessible name.
- **Do** honor GNOME's light/dark appearance and `enable-animations` preference.

### Don't:

- **Don't** steal focus when a banner arrives.
- **Don't** auto-dismiss critical notifications.
- **Don't** use critical or actionable color decoratively.
- **Don't** turn the transient layer into another notification center.
