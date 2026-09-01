/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {BannerManager} from './bannerManager.js';

export default class KnotiflyExtension extends Extension {
    enable() {
        this._bannerManager = new BannerManager(
            this.getSettings(),
            this.getLogger()
        );
        this._bannerManager.enable();
    }

    disable() {
        this._bannerManager?.disable();
        this._bannerManager = null;
    }
}
