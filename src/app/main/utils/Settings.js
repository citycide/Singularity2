import fs from 'fs';
import _ from 'lodash';
import initialSettings from './_initialSettings';
import createJSON from './_jsonCreator';

class Settings {
    constructor(jsonPrefix, wipeOldData) {
        this.PATH = createJSON(`${jsonPrefix || ''}.settings`);
        this.data = Object.assign({}, initialSettings);
        this.lastSync = 0;

        if (fs.existsSync(this.PATH) && !wipeOldData) {
            this._load();
        } else {
            this._save(true);
            // DEV: Handle windows users running as admin...
            fs.chmodSync(this.PATH, '777');
        }
        this.coupled = true;
    }

    uncouple() {
        this.coupled = false;
    }

    get(key, defaultValue = null) {
        if (!this.coupled) {
            this._load();
        }
        return typeof this.data[key] === 'undefined' ? defaultValue : this.data[key];
    }

    set(key, value) {
        if (this.coupled) {
            this.data[key] = value;
            this._save();
        }
    }

    del(key) {
        if (this.coupled) {
            delete this.data[key];
            this._save();
        }
    }

    _load(retryCount = 5) {
        let userSettings;
        try {
            userSettings = JSON.parse(fs.readFileSync(this.PATH, 'utf8'));
        } catch (e) {
            if (retryCount > 0) {
                setTimeout(this._load.bind(this, retryCount - 1), 10);
                Logger.error('Failed to load settings JSON file, retrying in 10 milliseconds');
                return;
            }
            userSettings = {};
            Logger.error('Failed to load settings JSON file, giving up and resetting');
        }
        this.data = _.extend({}, initialSettings, userSettings);
    }

    _save(force) {
        const now = (new Date).getTime();
        // During some save events (like resize) we need to queue the disk writes
        // so that we don't blast the disk every millisecond
        if ((now - this.lastSync > 250 || force)) {
            if (this.data) fs.writeFileSync(this.PATH, JSON.stringify(this.data, null, 4));
            if (this.saving) clearTimeout(this.saving);
        } else {
            if (this.saving) clearTimeout(this.saving);
            this.saving = setTimeout(this._save.bind(this), 275);
        }
        this.lastSync = now;
    }

    destroy() {
        this.data = null;
        fs.unlinkSync(this.PATH);
    }
}

export default Settings;
