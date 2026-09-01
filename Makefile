UUID := Knotifly@godd0t
ZIP := dist/$(UUID).shell-extension.zip
SCHEMA := schemas/org.gnome.shell.extensions.knotifly.gschema.xml
SCREENSHOT ?= /tmp/knotifly-smoke.png

.PHONY: help lint validate test pack check smoke screenshot release install \
	reload enable disable uninstall status prefs notify notify-critical \
	notify-actions logs clean

help:
	@echo 'Build: make check | smoke | screenshot | release'
	@echo 'Desktop: make install | reload | status | prefs | logs'
	@echo 'Try: make notify | notify-critical | notify-actions'

lint:
	npm run lint

validate:
	glib-compile-schemas --strict --dry-run schemas

pack: lint validate
	mkdir -p dist
	gnome-extensions pack --force --out-dir=dist \
		--schema=$(SCHEMA) \
		--extra-source=bannerManager.js \
		--extra-source=LICENSE .

test: lint validate
	glib-compile-schemas --strict schemas
	gjs -m tests/settings-model.test.js

check: test pack

smoke: pack
	dbus-run-session -- gnome-shell-test-tool --headless \
		--extension $(ZIP) tests/smoke.js

screenshot: pack
	KNOTIFLY_SCREENSHOT=$(SCREENSHOT) dbus-run-session -- \
		gnome-shell-test-tool --headless --extension $(ZIP) tests/smoke.js
	@echo 'Screenshot: $(SCREENSHOT)'

release: clean
	$(MAKE) test smoke

install: pack
	gnome-extensions install --force --print-uuid $(ZIP)

reload:
	-gnome-extensions disable $(UUID)
	$(MAKE) install
	gnome-extensions enable $(UUID)

enable:
	gnome-extensions enable $(UUID)

disable:
	gnome-extensions disable $(UUID)

uninstall:
	gnome-extensions uninstall $(UUID)

status:
	gnome-extensions info $(UUID)

prefs:
	gnome-extensions prefs $(UUID)

notify:
	notify-send 'Knotifly' 'A calmer notification banner'

notify-critical:
	notify-send --urgency=critical 'Knotifly' 'Critical notifications stay visible'

notify-actions:
	gdbus call --session --dest org.freedesktop.Notifications \
		--object-path /org/freedesktop/Notifications \
		--method org.freedesktop.Notifications.Notify \
		'Knotifly' 0 'dialog-information' 'Review ready' \
		'Choose an action directly from the banner' \
		"['open', 'Open', 'later', 'Remind me later']" '{}' 10000

logs:
	journalctl --user -f -o cat /usr/bin/gnome-shell

clean:
	rm -rf dist
	rm -f schemas/gschemas.compiled
