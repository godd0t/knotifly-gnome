/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const APPEARANCES = ['auto', 'light', 'dark'];
const DENSITIES = ['compact', 'comfortable'];
const POSITIONS = ['top-left', 'top-center', 'top-right'];
const INTERRUPTION_MODES = ['calm', 'balanced', 'immediate'];

export default class KnotiflyPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage({
            title: _('Knotifly'),
            icon_name: 'preferences-system-notifications-symbolic',
        });
        const deliveryGroup = new Adw.PreferencesGroup({
            title: _('Delivery'),
            description: _('Control when and where banners arrive.'),
        });
        const interactionGroup = new Adw.PreferencesGroup({
            title: _('Interaction'),
            description: _('Keep useful controls close without adding noise.'),
        });
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Keep the banner quiet, readable, and consistent with the desktop.'),
        });

        const duration = new Adw.SpinRow({
            title: _('Display duration'),
            subtitle: _('How long noncritical banners stay visible, in seconds'),
            digits: 1,
            adjustment: new Gtk.Adjustment({
                lower: 1.5,
                upper: 10,
                step_increment: 0.5,
                page_increment: 1,
                value: settings.get_int('display-duration-ms') / 1000,
            }),
        });
        duration.connect('notify::value', row => {
            settings.set_int('display-duration-ms', Math.round(row.value * 1000));
        });
        const durationChangedId = settings.connect('changed::display-duration-ms', () => {
            const value = settings.get_int('display-duration-ms') / 1000;
            if (duration.value !== value)
                duration.value = value;
        });
        window.connect('destroy', () => settings.disconnect(durationChangedId));

        const density = this._createComboRow(
            _('Density'),
            _('Choose compact spacing or a roomier layout'),
            [_('Compact'), _('Comfortable')],
            DENSITIES,
            settings,
            'density'
        );
        const appearance = this._createComboRow(
            _('Appearance'),
            _('Follow the desktop or force a light or dark card'),
            [_('Automatic'), _('Light'), _('Dark')],
            APPEARANCES,
            settings,
            'appearance'
        );
        const position = this._createComboRow(
            _('Position'),
            _('Choose the corner or center of the primary display'),
            [_('Top left'), _('Top center'), _('Top right')],
            POSITIONS,
            settings,
            'position'
        );
        const interruptionMode = this._createComboRow(
            _('Notification flow'),
            _('Choose what may interrupt the current banner'),
            [_('Calm'), _('Balanced'), _('Immediate')],
            INTERRUPTION_MODES,
            settings,
            'interruption-mode'
        );
        const autoExpandActions = new Adw.SwitchRow({
            title: _('Show quick actions immediately'),
            subtitle: _('Expand notifications when an app provides action buttons'),
        });
        settings.bind(
            'auto-expand-actions',
            autoExpandActions,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        const expandOnHover = new Adw.SwitchRow({
            title: _('Expand details on hover'),
            subtitle: _('Hovering pauses dismissal and reveals the full message'),
        });
        settings.bind(
            'click-to-expand',
            expandOnHover,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        deliveryGroup.add(position);
        deliveryGroup.add(duration);
        deliveryGroup.add(interruptionMode);
        interactionGroup.add(autoExpandActions);
        interactionGroup.add(expandOnHover);
        appearanceGroup.add(density);
        appearanceGroup.add(appearance);
        page.add(deliveryGroup);
        page.add(interactionGroup);
        page.add(appearanceGroup);
        window.add(page);
    }

    _createComboRow(title, subtitle, labels, values, settings, key) {
        const row = new Adw.ComboRow({
            title,
            subtitle,
            model: Gtk.StringList.new(labels),
        });
        const syncFromSettings = () => {
            const index = values.indexOf(settings.get_string(key));
            row.selected = index >= 0 ? index : 0;
        };
        row.connect('notify::selected', () => {
            const value = values[row.selected];
            if (value && settings.get_string(key) !== value)
                settings.set_string(key, value);
        });
        const changedId = settings.connect(`changed::${key}`, syncFromSettings);
        row.connect('destroy', () => settings.disconnect(changedId));
        syncFromSettings();
        return row;
    }
}
