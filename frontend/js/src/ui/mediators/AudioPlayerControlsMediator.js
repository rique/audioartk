import {ListEvents} from '../../core/EventBus.js';

export const AudioPlayerControlsMediator = {
    init(keyEventsCotrols, tracklistBrowser) {
        this.keyValues = {
            SPACE: ' ',
            PLUS: '+',
            MINUS: '-',
            T: 't',
            CAP_P: 'P',
            ArrowRight: 'ArrowRight',
            ArrowLeft: 'ArrowLeft',
        };

        this.tracklistBrowser = tracklistBrowser;
        this.keyEventsCotrols = keyEventsCotrols;
        this.listEvents = new ListEvents();
        this._setUpKeyBindings();
    },

    setPlayerControls(playerControls) {
        if (typeof playerControls === 'undefined') {
            const e = new Error('A player control is required!');
            console.error(e);
            throw e;
        }
        this.playerControls = playerControls;
    },

    playPause() {
        this.playerControls.playPause();
    },
    volumeUp() {
        this.playerControls.increaseVolume();
    },
    volumeDown() {
        this.playerControls.decreaseVolume();
    },
    nextTrack({ctrlKey, repeat}={}) {
        if (ctrlKey || repeat)
            return;
        this.playerControls.next();
    },
    prevTrack({ctrlKey, repeat}={}) {
        if (ctrlKey || repeat)
            return;
        this.playerControls.prev();
    },
    fastFoward({ctrlKey, repeat, shiftKey, type}={}) {
        if (ctrlKey && repeat || shiftKey && repeat) {
            this.playerControls.fastForward();
            this.listEvents.trigger('onFastForward');
        }
    },
    rewind({ctrlKey, repeat, shiftKey, type}={}) {
        if (ctrlKey && repeat || shiftKey && repeat) {
            this.playerControls.rewind();
            this.listEvents.trigger('onRewind');
        }
    },
    onFastForward(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onFastForward');
    },
    onRewind(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onRewind');
    },
    _setUpKeyBindings() {
        this.keyEventsCotrols.registerKeyUpAction(this.keyValues.SPACE, this.playPause.bind(this), this);
        this.keyEventsCotrols.registerKeyDownAction(this.keyValues.PLUS, this.volumeUp.bind(this), this);
        this.keyEventsCotrols.registerKeyDownAction(this.keyValues.MINUS, this.volumeDown.bind(this), this);
        this.keyEventsCotrols.registerKeyUpAction(this.keyValues.ArrowRight, this.nextTrack.bind(this), this);
        this.keyEventsCotrols.registerKeyUpAction(this.keyValues.ArrowLeft, this.prevTrack.bind(this), this);
        this.keyEventsCotrols.registerKeyDownAction(this.keyValues.ArrowRight, this.fastFoward.bind(this), this);
        this.keyEventsCotrols.registerKeyDownAction(this.keyValues.ArrowLeft, this.rewind.bind(this), this);
    }
}
