# Repository Guidelines

## Project Structure & Module Organization

Knotifly is a GNOME Shell 50 extension. Runtime code lives at the root: `extension.js` owns lifecycle, `bannerManager.js` manages banners, and `prefs.js` builds settings. Styles are in `stylesheet.css`, settings in `schemas/`, and checks in `tests/`. `PRODUCT.md` records product constraints; `.impeccable/surfaces/` records durable UX decisions. Treat `dist/` and `schemas/gschemas.compiled` as generated output.

## Build, Test, and Development Commands

- `npm ci` installs dependencies from the lockfile.
- `make lint` runs ESLint over runtime and test JavaScript.
- `make validate` checks the GSettings schema without modifying it.
- `make test` compiles schemas and runs the settings-model test with GJS.
- `make pack` validates the project and creates `dist/Knotifly@godd0t.shell-extension.zip`.
- `make smoke` launches the packaged extension in a temporary headless GNOME Shell session.
- `make install` installs locally; use `make enable` afterward.

Run `make lint`, `make validate`, and `make test` before submitting. UI changes need `make smoke` and a real Wayland-session check; headless Shell cannot verify appearance or motion quality.

## Coding Style & Naming Conventions

Use ES modules and GJS patterns. Indent JavaScript with four spaces, use single quotes and semicolons, `camelCase` for values, `PascalCase` for classes, and leading underscores for private details. Prefix extension CSS classes with `knotifly-`. `eslint.config.mjs` is authoritative.

## Design & Interaction Guidelines

Preserve GNOME's native `NotificationMessage`, application-provided actions, notification history, per-app policy, and `Super+N` focus shortcut. Knotifly adds progressive disclosure and delivery behavior; it is not a second notification center. Keep banners compact until engaged, never steal focus, pause dismissal while hovered or keyboard-focused, and make critical/actionable states clear without decorative color. Every control needs a visible focus state and accessible name. Respect `org.gnome.desktop.interface enable-animations`.

## Testing Guidelines

Tests are executable GJS scripts, not framework suites. Name isolated checks `tests/*.test.js`; keep Shell integration in `tests/smoke.js`. Add a regression check that fails without the change. Test actionable banners through D-Bus, not title/body-only `notify-send` calls. No coverage threshold is configured.

## Commit & Pull Request Guidelines

Git history is unavailable in this checkout. Use short imperative subjects such as `Expose notification quick actions`. Pull requests should explain behavior, list checks run, name the GNOME Shell version tested, link relevant issues, and include before/after screenshots for visual changes.

## Compatibility Notes

The extension uses private GNOME Shell APIs and currently targets Shell 50. Do not add another Shell version to `metadata.json` without reviewing those APIs and completing the smoke and desktop checks.
