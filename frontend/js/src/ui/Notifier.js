import { Fader, uuidv4 } from '../core/Utils.js';
import { ResourceManager } from '../domain/StateManager.js';

/**
 * Renders the HTML for a track within a notification.
 */
class TrackBoxTemplate {
    static render(track) {
        const album = track.getAlbum() || 'N/A';
        const artist = track.getArtist() || 'N/A';
        const src = ResourceManager.getAlbumArtURL(track);

        return `
            <div class="notif-logo">
                <img style="width: 100%" src="${src}">
            </div>
            <div style="width: 78%; font-size: 14px;" class="notif-body inline-block">
                <p class="no-wrap">${track.getTitle()} ~ ${album}</p>
                <p class="no-wrap">${artist}</p>
            </div>`;
    }
}


class Notification {
    constructor(title, level) {
        this.title = title;
        this.level = level;
        this.message = '';
        this.fader = new Fader();
        this.parentNode = document.getElementById('notifications-cnt');
        this.isActive = false;
    }

    update(message) {
        this.message = message;
    }

    show(timeout = 5000) {
        if (timeout < 0) {
            console.warn("Invalid negative timeout value!", {timeout});
            timeout = 10;
        }

        this.isActive = true;
        this.tplUUID = uuidv4();
        const element = document.createElement('div');
        element.className = `notification-box notif-${this.level}`;
        element.dataset.tplId = this.tplUUID;

        element.innerHTML = `
            <div class="notification-head">
                <div class="notif-title inline-block">${this.title}</div>
                <div class="notif-close inline-block">
                    <div class="close-circle"><i class="fa-solid fa-xmark"></i></div>
                </div>
            </div>
            <div class="notification-message">${this.message}</div>
            <div class="notification-timer">
                <div class="notif-prog-bar">
                    <div class="notif-sub-prog-bar"></div>
                </div>
            </div>`;

        this.parentNode.prepend(element);

        // Progress Animation
        const progressBar = element.querySelector('.notif-sub-prog-bar');
        this.animation = new Animation(
            new KeyframeEffect(progressBar, [{ width: '100%' }, { width: '0%' }], { duration: timeout }),
            document.timeline
        );

        element.addEventListener('click', () => this.animation.finish());

        this.fader.fadeIn(element, 250);
        this.animation.play();
        
        this.animation.onfinish = () => {
            this.fader.fadeOut(element, 400, 1, 0, () => {
                this.isActive = false;
                this.animation = null;
                element.remove();
            });
        };
    }

    pause() {
        this.animation?.pause();
    }

    play() {
        this.animation?.play();
    }

    hide(cb) {
        // We find the element in the DOM using the UUID we generated in show()
        // If we didn't store the element reference in 'this', we use the data attribute.
        const element = this.parentNode.querySelector(`[data-tpl-id="${this.tplUUID}"]`);
        
        if (element) {
            // Use the fader for a professional exit (400ms duration)
            this.fader.fadeOut(element, 668, 1, 0, () => {
                this.isActive = false;
                element.remove();
                if (typeof cb === 'function') cb();
            });
        }
    }

    isNotificationActive() {
        return this.isActive;
    }
}

/**
 * NotificationCenter: The Singleton Registry
 */
export const NotificationCenter = {
    _registry: {},

    register(key, title, level) {
        if (this._registry[key]) {
            console.error(`Notifier: Key "${key}" already set.`);
            return;
        }
        this._registry[key] = new Notification(title, level);
    },

    updateAndShow(key, message, timeout) {
        const notif = this._getNotification(key);
        
        notif?.update(message);
        notif?.show(timeout);
    },
    pause(key) {
        const notif = this._getNotification(key);
        notif?.pause();
    },
    play(key) {
        const notif = this._getNotification(key);
        notif?.play();
    },
    hide(key, cb) {
        const notif = this._getNotification(key);
        notif?.hide(cb);
    },
    isNotificationActive(key) {
        return this._registry[key]?.isNotificationActive();
    },
    _getNotification(key) {
        const notif = this._registry[key];
        if (!notif) {
            console.error(`Notifier: Key "${key}" not found.`);
            return;
        }

        return notif;
    }
};

/**
 * DOMAIN WRAPPERS
 * These use the NotificationCenter to keep your business logic clean.
 */

export const TracklistNotifier = {
    keys: { ADDED: 'track.added', REMOVED: 'track.removed' },
    init() {
        NotificationCenter.register(this.keys.ADDED, 'Track added to queue!', 'info');
        NotificationCenter.register(this.keys.REMOVED, '⚠️ Track removed!', 'warning');
    },
    showAdded(track, timeout) {
        const html = TrackBoxTemplate.render(track);
        NotificationCenter.updateAndShow(this.keys.ADDED, html, timeout);
    },
    showRemoved(track, timeout) {
        const html = TrackBoxTemplate.render(track);
        NotificationCenter.updateAndShow(this.keys.REMOVED, html, timeout);
    }
};

export const PlayerNotifier = {
    key: 'player.next',
    init() {
        NotificationCenter.register(this.key, 'Coming Up Next', 'info');
    },
    showNext(track, timeout) {
        const html = TrackBoxTemplate.render(track);
        NotificationCenter.updateAndShow(this.key, html, timeout);
    },
    hide(cb) {
        NotificationCenter.hide(this.key, cb);
    },
    pause() {
        NotificationCenter.pause(this.key);
    },
    play() {
        NotificationCenter.play(this.key);
    },
    isActive() {
        return NotificationCenter.isNotificationActive(this.key);
    }
};

export const FileBrowserNotifier = { 
    init() {
        this.key = 'filebrowser.added';
        NotificationCenter.register(this.key, 'New track successfully added!', 'info');
    },
    setAddedTrack(track, timeout) {
        const html = TrackBoxTemplate.render(track);
        NotificationCenter.updateAndShow(this.key, html, timeout);
        // NotificationCenter.displayNotification(this.key, timeout);
    },
    hideAddedTrack() {
        NotificationCenter.hide(this.key);
    },
}; 

// Initialize the registry slots immediately
TracklistNotifier.init();
PlayerNotifier.init();
FileBrowserNotifier.init();

