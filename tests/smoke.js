/* SPDX-License-Identifier: GPL-3.0-or-later */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

export const METRICS = {};

Gio._promisify(Shell.Screenshot.prototype, 'screenshot');

function findActor(actor, predicate) {
    if (predicate(actor))
        return actor;

    for (const child of actor.get_children()) {
        const match = findActor(child, predicate);
        if (match)
            return match;
    }
    return null;
}

export async function run() {
    await new Promise(resolve => {
        GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 500, resolve);
    });

    const extension = Main.extensionManager.lookup('Knotifly@godd0t');
    if (!extension)
        throw new Error('Knotifly was not loaded');
    if (!Main.messageTray._bannerBlocked)
        throw new Error('Native GNOME banners were not blocked');

    const source = MessageTray.getSystemSource();
    const actionNotification = new MessageTray.Notification({
        source,
        title: 'Knotifly smoke test',
        body: 'The custom banner manager exposes useful actions.',
        isTransient: true,
    });
    const openAction = actionNotification.addAction('Open', () => {});
    source.addNotification(actionNotification);
    Main.notify('Knotifly queued item', 'The queue cue should appear.');
    Main.notify('Knotifly another item', 'The queue cue should count waiting items.');

    await new Promise(resolve => {
        GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 500, resolve);
    });

    const banner = findActor(
        global.stage,
        actor => actor.has_style_class_name?.('knotifly-banner')
    );
    if (!banner)
        throw new Error('The Knotifly banner was not rendered');
    if (!banner.expanded)
        throw new Error('The actionable notification was not expanded');

    const action = findActor(
        banner,
        actor => actor.has_style_class_name?.('notification-button') &&
            actor.visible
    );
    if (!action)
        throw new Error('The notification action was not visible');

    const queueCue = findActor(
        global.stage,
        actor => actor.has_style_class_name?.('knotifly-queue-cue') &&
            actor.visible
    );
    if (!queueCue)
        throw new Error('The Knotifly queue cue was not rendered');
    if (!queueCue.can_focus)
        throw new Error('The Knotifly queue control was not keyboard focusable');

    extension.stateObj._bannerManager._focusActiveBanner();
    if (global.stage.key_focus !== banner)
        throw new Error('The active banner did not accept keyboard focus');

    const screenshotPath = GLib.getenv('KNOTIFLY_SCREENSHOT');
    if (screenshotPath) {
        const stream = Gio.File.new_for_path(screenshotPath).replace(
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null
        );
        await new Shell.Screenshot().screenshot(false, stream);
        stream.close(null);
    }

    actionNotification.removeAction(openAction);
    await new Promise(resolve => {
        GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 250, resolve);
    });
    if (banner.has_style_class_name('knotifly-actionable'))
        throw new Error('A banner without actions remained actionable');
    if (banner.expanded)
        throw new Error('A banner without actions remained expanded');

    queueCue.emit('clicked', Clutter.BUTTON_PRIMARY);
    await new Promise(resolve => {
        GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 500, resolve);
    });

    const nextTitle = findActor(
        global.stage,
        actor => actor.has_style_class_name?.('message-title') &&
            actor.text === 'Knotifly queued item'
    );
    if (!nextTitle)
        throw new Error('The queue control did not show the next notification');

    Main.extensionManager.disableExtension('Knotifly@godd0t');
    await new Promise(resolve => {
        GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 100, resolve);
    });

    if (Main.messageTray._bannerBlocked)
        throw new Error('Native banners remained blocked after disable');
    if (findActor(global.stage, actor => actor.name === 'knotifly-container'))
        throw new Error('Knotifly left its actor behind after disable');

    Main.extensionManager.enableExtension('Knotifly@godd0t');
    await new Promise(resolve => {
        GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 100, resolve);
    });

    if (!Main.messageTray._bannerBlocked)
        throw new Error('Knotifly did not re-enable cleanly');

    print('Knotifly smoke test passed');
    return true;
}
