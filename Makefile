UUID := Knotifly@godd0t
ZIP := dist/$(UUID).shell-extension.zip
SCHEMA := schemas/org.gnome.shell.extensions.knotifly.gschema.xml

.PHONY: lint validate pack test smoke install enable disable uninstall clean

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

smoke: pack
	dbus-run-session -- gnome-shell-test-tool --headless \
		--extension $(ZIP) tests/smoke.js

install: pack
	gnome-extensions install --force --print-uuid $(ZIP)

enable:
	gnome-extensions enable $(UUID)

disable:
	gnome-extensions disable $(UUID)

uninstall:
	gnome-extensions uninstall $(UUID)

clean:
	rm -rf dist
