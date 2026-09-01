# Knotifly

Knotifly gives GNOME Shell 50 calmer, compact notification banners while
leaving notification history, application actions, sounds, privacy, and
per-application controls to GNOME.

The first release targets Ubuntu 26.04 with GNOME Shell 50. It intentionally
does not change notifications in the clock/calendar menu or on the lock screen.

## What it changes

- Compact, rounded banners at the top center of the primary display
- Automatic light and dark styling
- Softer entrance and exit motion that respects reduced animations
- A 2.5-second default timeout for noncritical notifications
- Hover-to-pause and optional hover-to-expand behavior
- Persistent, automatically expanded critical alerts
- A quiet queue cue when more notifications are waiting
- Top-left, top-center, or top-right banner placement
- Calm, balanced, or immediate queue interruption modes

Knotifly uses internal GNOME Shell notification APIs. A compatibility review
will be required before supporting a newer major GNOME Shell release.

## Requirements

- GNOME Shell 50
- `gnome-extensions`
- `glib-compile-schemas`
- `gjs`
- `eslint` for development checks

Confirm your Shell version:

```sh
gnome-shell --version
```

## Build and install

From this directory:

```sh
make pack
make install
```

Log out and back in if this is the first installation, then enable Knotifly:

```sh
make enable
```

Open preferences with:

```sh
gnome-extensions prefs Knotifly@godd0t
```

Preferences are grouped into Behavior (duration, position, interruption mode,
and expansion) and Appearance (density and color scheme).

The packaged extension is written to
`dist/Knotifly@godd0t.shell-extension.zip`.

## Test a notification

If `notify-send` is installed:

```sh
notify-send "Knotifly" "A calmer notification banner"
```

Critical notifications stay visible until acknowledged:

```sh
notify-send --urgency=critical "Knotifly" "Critical notification test"
```

Plain `notify-send` messages only contain a title and body. The `notify-send`
build shipped by some distributions also rejects actions even when GNOME
supports them. This direct D-Bus call reliably exercises the richer layer:

```sh
gdbus call --session \
  --dest org.freedesktop.Notifications \
  --object-path /org/freedesktop/Notifications \
  --method org.freedesktop.Notifications.Notify \
  'Knotifly' 0 'dialog-information' \
  'Review ready' 'Choose an action directly from the banner' \
  "['open', 'Open', 'later', 'Remind me later']" '{}' 10000
```

Press `Super+N` while a banner is active to focus and expand it.

## Development checks

```sh
make lint
make validate
make test
make smoke
```

The smoke test starts a temporary headless GNOME Shell and isolated D-Bus
session. Final visual checks should still be performed in a real Wayland
desktop session.

View live Shell logs while debugging:

```sh
journalctl --user -f -o cat /usr/bin/gnome-shell
```

After changing extension code, disable and re-enable the extension. On Wayland,
logging out and back in is the most reliable way to start a completely fresh
GNOME Shell process.

## Disable or uninstall

```sh
make disable
make uninstall
```

Disabling Knotifly restores GNOME's original notification banner renderer.

## License

GPL-3.0-or-later.
