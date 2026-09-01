/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * THESIS: A notification is a compact control surface, not a passive bubble.
 * OWN-WORLD: GNOME-native message structure, quiet neutral cards, blue action
 * states, warm critical states, 16px corners, and one soft depth layer.
 * STORY: Identify the source and urgency, read, act, expand, dismiss, or move
 * to the next queued item without leaving the current task.
 * FIRST VIEWPORT: One 28em top banner carries app context, message, native
 * actions, and an attached Show next control when the queue is non-empty.
 * FORM: Incumbent GNOME notification surface, extended in Operate mode;
 * seed: local-extension-no-roll.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying
 * its provenance
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Layout from 'resource:///org/gnome/shell/ui/layout.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageList from 'resource:///org/gnome/shell/ui/messageList.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

const MAX_BANNERS = 3;
const CALM_NEXT_DELAY_MS = 450;
const ENTER_DURATION_MS = 220;
const EXIT_DURATION_MS = 160;
const SHELL_KEYBINDINGS_SCHEMA = 'org.gnome.shell.keybindings';

export class BannerManager {
    constructor(settings, logger) {
        this._settings = settings;
        this._logger = logger;
        this._queue = [];
        this._sources = new Set();
        this._active = null;
        this._timeoutId = 0;
        this._timeoutRemainingMs = 0;
        this._timeoutDeadlineUs = 0;
        this._presenceSignalId = 0;
        this._nextShowTimeoutId = 0;
    }

    enable() {
        this._interfaceSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.interface',
        });

        this._container = new St.Widget({
            name: 'knotifly-container',
            style_class: 'knotifly-host',
            visible: false,
            reactive: false,
            layout_manager: new Clutter.BinLayout(),
        });
        const monitorConstraint = new Layout.MonitorConstraint({primary: true});
        Main.layoutManager.panelBox.bind_property(
            'visible',
            monitorConstraint,
            'work-area',
            GObject.BindingFlags.SYNC_CREATE
        );
        this._container.add_constraint(monitorConstraint);

        this._bannerBin = new St.BoxLayout({
            style_class: 'knotifly-banner-bin',
            reactive: true,
            track_hover: true,
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.START,
            vertical: true,
        });
        this._queueCue = new St.Button({
            style_class: 'knotifly-queue-cue',
            visible: false,
            can_focus: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this._queueCue.connect('clicked', () => this._showNextQueued());
        this._container.add_child(this._bannerBin);
        this._bannerBin.add_child(this._queueCue);
        Main.layoutManager.addChrome(this._container);

        this._bannerBin.connectObject(
            'notify::hover', () => this._onEngagementChanged(),
            'key-release-event', (_actor, event) =>
                this._onKeyRelease(event),
            this._container
        );
        global.stage.connectObject(
            'notify::key-focus', () => this._onEngagementChanged(),
            this._container
        );
        Main.messageTray.connectObject(
            'source-added', (_tray, source) => this._watchSource(source),
            'source-removed', (_tray, source) => this._unwatchSource(source),
            this._container
        );
        global.display.connectObject(
            'in-fullscreen-changed', () => this._showNext(),
            this._container
        );
        Main.sessionMode.connectObject(
            'updated', () => this._showNext(),
            this._container
        );
        this._settings.connectObject(
            'changed::appearance', () => this._syncStyle(),
            'changed::density', () => this._syncStyle(),
            'changed::position', () => this._syncStyle(),
            'changed::display-duration-ms', () => this._restartTimeout(),
            'changed::click-to-expand', () => this._onEngagementChanged(),
            'changed::auto-expand-actions', () => this._syncExpansion(),
            'changed::interruption-mode', () => {
                this._clearNextShowTimeout();
                this._showNext();
            },
            this._container
        );
        this._interfaceSettings.connectObject(
            'changed::color-scheme', () => this._syncStyle(),
            'changed::enable-animations', () => this._syncAnimationState(),
            this._container
        );

        for (const source of Main.messageTray.getSources())
            this._watchSource(source);

        const presence = Main.messageTray._presence;
        if (presence) {
            this._presenceSignalId = presence.connectSignal(
                'StatusChanged', () => GLib.idle_add_once(
                    GLib.PRIORITY_DEFAULT,
                    () => this._showNext()
                )
            );
        }

        this._previousBannerBlocked = Main.messageTray._bannerBlocked;
        Main.messageTray.bannerBlocked = true;
        this._replaceFocusKeybinding();
        this._syncStyle();
        this._syncAnimationState();
    }

    disable() {
        this._clearTimeout();
        this._clearNextShowTimeout();
        this._queue.length = 0;

        if (this._presenceSignalId) {
            Main.messageTray._presence?.disconnectSignal(this._presenceSignalId);
            this._presenceSignalId = 0;
        }

        if (this._active)
            this._finishHiding();

        for (const source of this._sources)
            source.disconnectObject(this._container);
        this._sources.clear();

        if (this._container) {
            Main.layoutManager.removeChrome(this._container);
            this._container.destroy();
        }

        if (Main.messageTray)
            Main.messageTray.bannerBlocked = this._previousBannerBlocked ?? false;
        this._restoreFocusKeybinding();

        this._container = null;
        this._bannerBin = null;
        this._queueCue = null;
        this._interfaceSettings = null;
    }

    _watchSource(source) {
        if (this._sources.has(source))
            return;

        this._sources.add(source);
        source.connectObject(
            'notification-request-banner', (_source, notification) => {
                this._requestBanner(notification);
            },
            'notification-removed', (_source, notification) => {
                this._queue = this._queue.filter(item => item !== notification);
                this._syncQueueCue();
            },
            this._container
        );
    }

    _unwatchSource(source) {
        if (!this._sources.delete(source))
            return;

        source.disconnectObject(this._container);
        this._queue = this._queue.filter(
            notification => notification.source !== source
        );
        this._syncQueueCue();
    }

    _requestBanner(notification) {
        if (notification.acknowledged ||
            notification.urgency === MessageTray.Urgency.LOW)
            return;

        const critical = notification.urgency === MessageTray.Urgency.CRITICAL;
        if (!critical && !notification.source.policy.showBanners)
            return;

        if (this._active?.notification === notification) {
            notification.acknowledged = true;
            this._restartTimeout();
            return;
        }

        if (this._queue.includes(notification))
            return;

        const bannerCount = this._queue.length + (this._active ? 1 : 0);
        if (bannerCount >= MAX_BANNERS && !critical)
            return;

        this._queue.push(notification);
        this._queue.sort((first, second) => second.urgency - first.urgency);
        this._syncQueueCue();
        if (this._shouldInterrupt(notification))
            this._hide(true, false);
        else
            this._showNext();
    }

    _showNext() {
        if (this._active || this._queue.length === 0 ||
            this._nextShowTimeoutId || !Main.sessionMode.hasNotifications)
            return;

        const notification = this._queue[0];
        const critical = notification.urgency === MessageTray.Urgency.CRITICAL;

        if (!critical && !notification.source.policy.showBanners) {
            this._queue.shift();
            this._showNext();
            return;
        }

        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor)
            return;

        const limited = Main.messageTray._busy || monitor.inFullscreen;
        if (limited && !notification.forFeedback && !critical)
            return;

        this._queue.shift();
        this._show(notification);
    }

    _show(notification) {
        const banner = new MessageList.NotificationMessage(notification);
        banner.add_style_class_name('knotifly-banner');
        banner.add_style_class_name(
            notification.urgency === MessageTray.Urgency.CRITICAL
                ? 'knotifly-critical'
                : 'knotifly-standard'
        );
        if (notification.actions.length > 0)
            banner.add_style_class_name('knotifly-actionable');

        const destroyId = notification.connect('destroy', () => {
            if (this._active?.notification === notification)
                this._hide(false);
        });
        notification.connectObject(
            'action-added', () => this._syncActionState(),
            'action-removed', () => this._syncActionState(),
            banner
        );

        this._active = {notification, banner, destroyId, hiding: false};
        this._bannerBin.insert_child_at_index(banner, 0);
        this._syncQueueCue();
        this._bannerBin.remove_all_transitions();
        this._bannerBin.set_pivot_point(0.5, 0.5);
        this._bannerBin.opacity = 0;
        this._bannerBin.translation_y = -12;
        this._bannerBin.scale_x = 0.97;
        this._bannerBin.scale_y = 0.97;
        this._container.show();

        notification.acknowledged = true;
        notification.playSound();

        this._syncExpansion(false);

        const duration = this._animationsEnabled ? ENTER_DURATION_MS : 0;
        this._bannerBin.ease({
            opacity: 255,
            translation_y: 0,
            scale_x: 1,
            scale_y: 1,
            duration,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
            onComplete: () => {
                if (this._active?.notification === notification)
                    this._restartTimeout();
            },
        });
    }

    _hide(animate = true, delayNext = true) {
        if (!this._active || this._active.hiding)
            return;

        this._active.hiding = true;
        this._active.delayNext = delayNext;
        this._clearTimeout();
        this._bannerBin.remove_all_transitions();

        const duration = animate && this._animationsEnabled
            ? EXIT_DURATION_MS
            : 0;
        this._bannerBin.ease({
            opacity: 0,
            translation_y: -10,
            scale_x: 0.98,
            scale_y: 0.98,
            duration,
            mode: Clutter.AnimationMode.EASE_IN_CUBIC,
            onComplete: () => this._finishHiding(),
        });
    }

    _finishHiding() {
        if (!this._active)
            return;

        const {notification, banner, destroyId, delayNext} = this._active;
        if (destroyId && notification &&
            GObject.signal_handler_is_connected(notification, destroyId))
            notification.disconnect(destroyId);

        banner.destroy();
        this._active = null;
        this._syncQueueCue();

        if (this._bannerBin) {
            this._bannerBin.opacity = 255;
            this._bannerBin.translation_y = 0;
            this._bannerBin.scale_x = 1;
            this._bannerBin.scale_y = 1;
        }
        this._container?.hide();
        if (delayNext && this._queue.length > 0 &&
            this._getInterruptionMode() === 'calm')
            this._scheduleNextShow();
        else
            this._showNext();
    }

    _restartTimeout() {
        if (!this._active || this._active.hiding ||
            this._active.notification.urgency === MessageTray.Urgency.CRITICAL)
            return;

        this._clearTimeout();
        this._timeoutRemainingMs =
            this._settings.get_int('display-duration-ms');

        if (!this._isEngaged())
            this._resumeTimeout();
    }

    _pauseTimeout() {
        if (!this._timeoutId)
            return;

        GLib.source_remove(this._timeoutId);
        this._timeoutId = 0;
        this._timeoutRemainingMs = Math.max(
            0,
            Math.ceil((this._timeoutDeadlineUs - GLib.get_monotonic_time()) / 1000)
        );
    }

    _resumeTimeout() {
        if (!this._active || this._active.hiding || this._timeoutId ||
            this._active.notification.urgency === MessageTray.Urgency.CRITICAL)
            return;

        if (this._timeoutRemainingMs <= 0) {
            this._hide();
            return;
        }

        this._timeoutDeadlineUs = GLib.get_monotonic_time() +
            this._timeoutRemainingMs * 1000;
        this._timeoutId = GLib.timeout_add_once(
            GLib.PRIORITY_DEFAULT,
            this._timeoutRemainingMs,
            () => {
                this._timeoutId = 0;
                this._timeoutRemainingMs = 0;
                this._hide();
            }
        );
        GLib.Source.set_name_by_id(
            this._timeoutId,
            '[Knotifly] hide notification banner'
        );
    }

    _clearTimeout() {
        if (this._timeoutId)
            GLib.source_remove(this._timeoutId);
        this._timeoutId = 0;
        this._timeoutRemainingMs = 0;
        this._timeoutDeadlineUs = 0;
    }

    _scheduleNextShow() {
        if (this._nextShowTimeoutId)
            return;

        this._nextShowTimeoutId = GLib.timeout_add_once(
            GLib.PRIORITY_DEFAULT,
            CALM_NEXT_DELAY_MS,
            () => {
                this._nextShowTimeoutId = 0;
                this._showNext();
            }
        );
        GLib.Source.set_name_by_id(
            this._nextShowTimeoutId,
            '[Knotifly] wait before next calm banner'
        );
    }

    _clearNextShowTimeout() {
        if (this._nextShowTimeoutId)
            GLib.source_remove(this._nextShowTimeoutId);
        this._nextShowTimeoutId = 0;
    }

    _syncQueueCue() {
        if (!this._queueCue)
            return;

        const count = this._queue.length;
        this._queueCue.label = count > 0
            ? `Show next · ${count} waiting`
            : '';
        this._queueCue.visible = count > 0 && Boolean(this._active);
        this._queueCue.set_accessible_name(
            count === 1
                ? 'Show the next notification; 1 is waiting'
                : `Show the next notification; ${count} are waiting`
        );
    }

    _showNextQueued() {
        if (this._active)
            this._hide(true, false);
        else
            this._showNext();
    }

    _focusActiveBanner() {
        if (!this._active || this._active.hiding)
            return;

        this._active.banner.expand(this._animationsEnabled);
        this._active.banner.grab_key_focus();
        this._onEngagementChanged();
    }

    _onKeyRelease(event) {
        if (event.get_key_symbol() === Clutter.KEY_Escape &&
            event.get_state() === 0) {
            this._hide();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _replaceFocusKeybinding() {
        this._focusKeybindingSettings = new Gio.Settings({
            schema_id: SHELL_KEYBINDINGS_SCHEMA,
        });
        Main.wm.removeKeybinding('focus-active-notification');
        Main.wm.addKeybinding(
            'focus-active-notification',
            this._focusKeybindingSettings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._focusActiveBanner()
        );
    }

    _restoreFocusKeybinding() {
        if (!this._focusKeybindingSettings)
            return;

        Main.wm.removeKeybinding('focus-active-notification');
        if (Main.messageTray?._expandActiveNotification) {
            Main.wm.addKeybinding(
                'focus-active-notification',
                this._focusKeybindingSettings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                Main.messageTray._expandActiveNotification.bind(Main.messageTray)
            );
        }
        this._focusKeybindingSettings = null;
    }

    _shouldInterrupt(notification) {
        if (!this._active || this._active.hiding)
            return false;

        const mode = this._getInterruptionMode();
        if (mode === 'calm')
            return false;
        if (mode === 'immediate')
            return true;

        return notification.urgency > this._active.notification.urgency;
    }

    _getInterruptionMode() {
        const mode = this._settings.get_string('interruption-mode');
        if (['calm', 'balanced', 'immediate'].includes(mode))
            return mode;

        this._logger.warn(`Unknown interruption mode: ${mode}`);
        return 'balanced';
    }

    _isEngaged() {
        const focus = global.stage.key_focus;
        return this._bannerBin.hover ||
            Boolean(focus && this._bannerBin.contains(focus));
    }

    _onEngagementChanged() {
        if (!this._active || this._active.hiding)
            return;

        if (this._isEngaged()) {
            this._pauseTimeout();
            if (this._bannerBin.hover &&
                !this._settings.get_boolean('click-to-expand'))
                this._active.banner.expand(this._animationsEnabled);
        } else {
            this._resumeTimeout();
        }
    }

    _syncExpansion(animate = true) {
        if (!this._active || this._active.hiding)
            return;

        const {banner, notification} = this._active;
        const shouldExpand =
            notification.urgency === MessageTray.Urgency.CRITICAL ||
            (notification.actions.length > 0 &&
                this._settings.get_boolean('auto-expand-actions'));

        if (shouldExpand)
            banner.expand(animate && this._animationsEnabled);
        else if (banner.expanded)
            banner.unexpand(animate && this._animationsEnabled);
    }

    _syncActionState() {
        if (!this._active || this._active.hiding)
            return;

        const {banner, notification} = this._active;
        if (notification.actions.length > 0)
            banner.add_style_class_name('knotifly-actionable');
        else
            banner.remove_style_class_name('knotifly-actionable');
        this._syncExpansion();
    }

    _syncAnimationState() {
        this._animationsEnabled =
            this._interfaceSettings.get_boolean('enable-animations');
    }

    _syncStyle() {
        const classes = [
            'knotifly-light',
            'knotifly-dark',
            'knotifly-compact',
            'knotifly-comfortable',
            'knotifly-position-top-left',
            'knotifly-position-top-center',
            'knotifly-position-top-right',
        ];
        for (const styleClass of classes)
            this._container.remove_style_class_name(styleClass);

        let appearance = this._settings.get_string('appearance');
        if (!['auto', 'light', 'dark'].includes(appearance)) {
            this._logger.warn(`Unknown appearance setting: ${appearance}`);
            appearance = 'auto';
        }
        if (appearance === 'auto') {
            appearance = this._interfaceSettings
                .get_string('color-scheme')
                .includes('dark')
                ? 'dark'
                : 'light';
        }

        let density = this._settings.get_string('density');
        if (!['compact', 'comfortable'].includes(density)) {
            this._logger.warn(`Unknown density setting: ${density}`);
            density = 'compact';
        }

        let position = this._settings.get_string('position');
        if (!['top-left', 'top-center', 'top-right'].includes(position)) {
            this._logger.warn(`Unknown position setting: ${position}`);
            position = 'top-center';
        }

        this._container.add_style_class_name(`knotifly-${appearance}`);
        this._container.add_style_class_name(`knotifly-${density}`);
        this._container.add_style_class_name(`knotifly-position-${position}`);
        this._bannerBin.x_align = {
            'top-left': Clutter.ActorAlign.START,
            'top-center': Clutter.ActorAlign.CENTER,
            'top-right': Clutter.ActorAlign.END,
        }[position];
    }
}
