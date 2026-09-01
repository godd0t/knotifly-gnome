# Product

<!-- impeccable:product-schema 1 -->

## Platform

desktop

## Users

GNOME Shell 50 users who want notifications to remain useful without feeling noisy, oversized, or disruptive during focused desktop work.

## Product Purpose

Knotifly replaces GNOME's default transient banners with a calmer interaction layer. It should make notifications easy to scan, act on, defer, and dismiss without duplicating the notification history already provided by GNOME.

## Positioning

Knotifly combines restrained presentation with fast, in-place notification handling: compact by default, richer only when the user engages.

## Operating Context

The extension runs continuously inside GNOME Shell. Users encounter it while working in other applications, often through bursts of notifications, critical alerts, or notifications with application-provided actions.

## Capabilities and Constraints

- Target GNOME Shell 50 and preserve native notification history, privacy, sounds, and per-application controls.
- Support compact banners, priority-aware queuing, quick actions, progressive expansion, and clear critical/progress states.
- Respect reduced animations and GNOME light/dark appearance.
- Preserve GNOME's `Super+N` shortcut for focusing the active banner.
- Use internal GNOME Shell APIs; each new major Shell version requires compatibility review.
- Keep behavior reversible: disabling the extension restores GNOME's banner renderer.

## Brand Commitments

The product name is Knotifly. The experience remains calm, compact, direct, and recognizably native to GNOME even as interaction becomes richer.

## Evidence on Hand

The runnable extension, GSettings preferences, automated GJS checks, headless Shell smoke test, and `Knotifly-v0.1-research-brief.docx` are present in this repository. No external customer claims or usage benchmarks are available.

## Product Principles

- Reveal depth progressively; do not demand attention before it is earned.
- Keep the primary message and next action scannable at a glance.
- Prefer application-provided actions over invented workflows.
- Preserve GNOME behavior outside transient banners.
- Make urgency clear without turning every alert into an alarm.

## Accessibility & Inclusion

All controls must be keyboard reachable, carry meaningful accessible labels, maintain readable contrast, and honor the system animation preference.
