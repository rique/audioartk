const KeyCotrols = function() {
    this.enabled = true;
    this._keyDownActions = {};
    this._keyUpActions = {};
    this._exclusivityCallerKeyUp = [];
    this._exclusivityCallerKeyDown = [];
    this._exclusivityCallerKeyUpV2 = [];
    this._exclusivityCallerKeyDownV2 = [];
    
    this._bindEvents();
};
KeyCotrols.prototype = {
    enable() {
        this.enabled = true;
    },
    disable() {
        this.enabled = false;
    },
    isEnabled() {
        return this.enabled;
    },
    setExclusivityCallerKeyUp(key, caller) {
        const previousCaller = this._exclusivityCallerKeyUp.filter(obj => obj.key == key);
        if (previousCaller.length != 0)
            return;
        this._exclusivityCallerKeyUp.push({key, caller});
    },
    unsetExclusivityCallerKeyUp(key, caller) {
        const previousCallerIdx = this._exclusivityCallerKeyUp.findIndex(obj => obj.key == key && obj.caller == caller);
        if (typeof previousCallerIdx === -1)
            return;
        this._exclusivityCallerKeyUp.splice(previousCallerIdx, 1);
    },
    setExclusivityCallerKeyDown(key, caller) {
        const previousCaller = this._exclusivityCallerKeyDown.filter(obj => obj.key == key);
        if (previousCaller.length != 0)
            return;
        this._exclusivityCallerKeyDown.push({key, caller});
    },
    unsetExclusivityCallerKeyDown(key, caller) {
        const previousCallerIdx = this._exclusivityCallerKeyDown.findIndex(obj => obj.key == key && obj.caller == caller);
        if (typeof previousCallerIdx === -1)
            return;
        this._exclusivityCallerKeyDown.splice(previousCallerIdx, 1);
    },
    setExclusivityCallerKeyUpV2(caller) {
        if (!this._exclusivityCallerKeyUpV2.includes(caller))
            this._exclusivityCallerKeyUpV2.push(caller);
    },
    unsetExclusivityCallerKeyUpV2(caller) {
        const previousCallerIdx = this._exclusivityCallerKeyUpV2.findIndex(obj => obj == caller);
        if (typeof previousCallerIdx === -1)
            return;
        this._exclusivityCallerKeyUpV2.splice(previousCallerIdx, 1);
    },
    setExclusivityCallerKeyDownV2(caller) {
        if (!this._exclusivityCallerKeyDownV2.includes(caller))
            this._exclusivityCallerKeyDownV2.push(caller);
    },
    unsetExclusivityCallerKeyDownV2(caller) {
        const previousCallerIdx = this._exclusivityCallerKeyDownV2.findIndex(obj => obj == caller);
        if (typeof previousCallerIdx === -1)
            return;
        this._exclusivityCallerKeyDownV2.splice(previousCallerIdx, 1);
    },
    registerKeyUpAction(key, cb, caller) {
        if (!this._keyUpActions.hasOwnProperty(key))
            this._keyUpActions[key] = [];

        this._keyUpActions[key].push({cb, caller});
    },
    registerKeyDownAction(key, cb, caller) {
        if (!this._keyDownActions.hasOwnProperty(key))
            this._keyDownActions[key] = [];
        this._keyDownActions[key].push({cb, caller});
    },
    _bindEvents() {
        document.body.addEventListener('keyup', evt => this._dispatchActions(evt, 'up'));
        document.body.addEventListener('keydown', evt => this._dispatchActions(evt, 'down'));
    },
    _dispatchActions(evt, keyType) {
        if (!this.isEnabled()) return;

        const target = evt.target;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        if (isTyping && evt.key != 'Escape' && evt.key != 'Enter')
            return;

        if (keyType == 'up') return this._executeActions(evt, this._keyUpActions[evt.key], this._exclusivityCallerKeyUpV2);
        if (keyType == 'down') return this._executeActions(evt, this._keyDownActions[evt.key], this._exclusivityCallerKeyDownV2);
    },
    _executeActions(evt, actions, exclusiveCallers) {
        if (!actions || actions.length <= 0) return;

        const eventPayload = {ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target, type: evt.type, evt};

        for (let i = 0; i < actions.length; ++i) {
            let {caller, cb} = actions[i];
            if (typeof cb !== 'function') continue;

            const hasExclusivityLock = exclusiveCallers && exclusiveCallers.length > 0;
            if (hasExclusivityLock) {
                // Only fire if the action belongs to the exclusive caller, OR if it's explicitly set to bypass
                if (exclusiveCallers.includes(caller) || caller === 'BYPASS_EXCLUSIVITY') {
                    cb(eventPayload);
                }
            } else {
                cb(eventPayload);
            }
        }
    }
};

const AudioPlayerKeyControls = function(keyEventsCotrols) {
    this.keyValues = {
        SPACE: ' ',
        PLUS: '+',
        MINUS: '-',
        T: 't',
        CAP_P: 'P',
        ArrowRight: 'ArrowRight',
        ArrowLeft: 'ArrowLeft',
    };

    this.keyEventsCotrols = keyEventsCotrols;
    this.listEvents = new ListEvents();
    this._setUpKeyBindings();
};
AudioPlayerKeyControls.prototype = {
    setPlayerControls(playerControls) {
        if (typeof playerControls === 'undefined') {
            const e = new Error('A player is required!');
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
};

const OneEvent = function(callback) {
    this.callback = callback;
}
OneEvent.prototype = {
    trigger(args) {
        this.callback(...args);
    }
};

const ListEvents = function() {
    this._eventsRegistered = [];
};
ListEvents.prototype = {
    onEventRegister({cb, subscriber}, eventKey) {
        this._eventsRegistered.push({'eventKey': eventKey, 'subscriber': subscriber,  'event': new OneEvent(cb)});
    },
    unsubscribeEVent({eventKey, subscriber}) {
        const subInedx = this._eventsRegistered.findIndex(evt => evt.subscriber == subscriber && evt.eventKey == eventKey);
        if (typeof subInedx === 'undefined')
            return;
        this._eventsRegistered.splice(subInedx, 1);
    },
    trigger(eventKey, ...args) {
        args = args || [];
        this._onEventTrigger(eventKey, args);
    },
    _onEventTrigger(eventKey, args) {
        const evts = this._eventsRegistered.filter(evt => evt.eventKey == eventKey);
        if (evts.length == 0)
            return;

        for (let i = 0; i < evts.length; ++i) {
            evts[i].event.trigger(args);
        }
    },
    _checkEventKey(eventKey) {
        const indx = this._eventsRegistered.findIndex(evt => evt.eventKey == eventKey);
        if (indx != -1) {
            console.error(`Event ${eventKey} already register`);
            throw `Event ${eventKey} already register`;
        }
    },
};

const keyCotrols = new KeyCotrols()
export {ListEvents, keyCotrols, AudioPlayerKeyControls};