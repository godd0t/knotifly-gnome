/* SPDX-License-Identifier: GPL-3.0-or-later */

import Gio from 'gi://Gio';

const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
    'schemas',
    Gio.SettingsSchemaSource.get_default(),
    false
);
const schema = schemaSource.lookup(
    'org.gnome.shell.extensions.knotifly',
    false
);

if (!schema)
    throw new Error('Knotifly settings schema was not found');

const expectedKeys = [
    'appearance',
    'auto-expand-actions',
    'click-to-expand',
    'density',
    'display-duration-ms',
    'interruption-mode',
    'position',
];
const actualKeys = schema.list_keys().sort();

if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(
        `Unexpected schema keys: ${JSON.stringify(actualKeys)}`
    );
}

print('Knotifly settings schema is valid');
