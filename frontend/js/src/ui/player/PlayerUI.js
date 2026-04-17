import { ResourceManager } from "../../domain/StateManager.js";
import { Fader } from "../../core/Utils.js";
import { Track } from "../../domain/models/Track.js";

import {HTMLItems} from '../grid/RowTemplates.js';
import {ListEvents} from '../../core/EventBus.js';

const PlayerButtonBaseItem = function() {
    this.listEvents = new ListEvents();
    this.setUpItem();
};
PlayerButtonBaseItem.prototype = {
    setUpItem() {
        this.htmlItem.setClassName('inline-block action-cnt');
    },
    onSwitchState(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onSwitchState');
    },
    onClick(cb) {
        this.htmlItem.addEventListener('click', (evt) => {
            evt.preventDefault();
            cb(evt);
        });
    }
}

const PlayPauseButtonItem = function() {
    this.htmlItem = new HTMLItems('div');
    this.playInnerContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-play"></i>
        </a>
    </span>`;

    this.pauseInnerContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-pause"></i>
        </a>
    </span>`;
    PlayerButtonBaseItem.call(this);
};
PlayPauseButtonItem.prototype = {
    setUpItem() {
        this.htmlItem.id('play-button');
        this.setInnerContent(true);
        PlayerButtonBaseItem.prototype.setUpItem.call(this);
    },
    render() {
        return this.htmlItem.render();
    },
    switchState(isPaused) {
        this.setInnerContent(isPaused);
        this.listEvents.trigger('onSwitchState', isPaused);
    },
    setInnerContent(isPaused) {
        if (isPaused) {
            this.htmlItem.innerContent(this.playInnerContent);
        } else {
            this.htmlItem.innerContent(this.pauseInnerContent);
        }

    }
};

const StopButtonItem = function() {
    this.htmlItem = new HTMLItems('div');
    this.stopContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-stop"></i>
        </a>
    </span>`;

    PlayerButtonBaseItem.call(this);
};
StopButtonItem.prototype = {
    setUpItem() {
        this.htmlItem.id('stop-button');
        this.htmlItem.innerContent(this.stopContent);
        PlayerButtonBaseItem.prototype.setUpItem.call(this);
    },
    render() {
        return this.htmlItem.render();
    },
    switchState(evt) {
        this.listEvents.trigger('onSwitchState', evt);
    }
}

const PrevButtonItem = function() {
    this.htmlItem = new HTMLItems('div');
    this.prevContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-backward-step"></i>
        </a>
    </span>`;

    PlayerButtonBaseItem.call(this);
};
PrevButtonItem.prototype = {
    setUpItem() {
        this.htmlItem.id('prev-button');
        this.htmlItem.innerContent(this.prevContent);
        PlayerButtonBaseItem.prototype.setUpItem.call(this);
    },
    render() {
        return this.htmlItem.render();
    },
    switchState(evt) {
        this.listEvents.trigger('onSwitchState', evt);
    }
}

const NextButtonItem = function() {
    this.htmlItem = new HTMLItems('div');
    this.nextContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-forward-step"></i>
        </a>
    </span>`;

    PlayerButtonBaseItem.call(this);
};
NextButtonItem.prototype = {
    setUpItem() {
        this.htmlItem.id('next-button');
        this.htmlItem.innerContent(this.nextContent);
        PlayerButtonBaseItem.prototype.setUpItem.call(this);
    },
    render() {
        return this.htmlItem.render();
    },
    switchState(evt) {
        this.listEvents.trigger('onSwitchState', evt);
    }
}

const ShuffleButtonItem = function() {
    this.htmlItem = new HTMLItems('div');
    // 0 -> off; 1 -> on
    this.btnState = 0;
    this.shuffleContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-shuffle"></i>
        </a>
    </span>`;

    PlayerButtonBaseItem.call(this);
};
ShuffleButtonItem.prototype = {
    setUpItem() {
        this.htmlItem.id('shuffle-button');
        this.htmlItem.innerContent(this.shuffleContent);
        PlayerButtonBaseItem.prototype.setUpItem.call(this);
    },
    render() {
        return this.htmlItem.render();
    },
    switchState(evt) {
        ++this.btnState;
        
        if (this.btnState > 1)
            this.btnState = 0;

        this.setBtnStyle();
        this.listEvents.trigger('onSwitchState', evt);
    },
    setBtnStyle() {
        if (this.btnState == 0) {
            this.htmlItem.classRemove('repeat-active');
        } else {
            this.htmlItem.classAdd('repeat-active');
        }
    }
};

const RepeatButtonItem = function() {
    this.htmlItem = new HTMLItems('div');
    // 0 -> off; 1 -> repeat; 2 -> repeat 1
    this.btnState = 0;
    this.repeatInnerContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-repeat"></i>
            <div class="repeat-one">1</div>
        </a>
    </span>`;

    this.repeatOneInnerContent = `
    <span>
        <a href="" class="player-action">
            <i class="fa-solid fa-repeat"></i>
            <div class="repeat-one repeat-active">1</div>
        </a>
    </span>`;

    PlayerButtonBaseItem.call(this);
};
RepeatButtonItem.prototype = {
    setUpItem() {
        this.htmlItem.id('play-button');
        this.setInnerContent();
        PlayerButtonBaseItem.prototype.setUpItem.call(this);
    },
    render() {
        return this.htmlItem.render();
    },
    switchState(repeatMode) {
        this.btnState = repeatMode;
        this.setInnerContent();
        this.listEvents.trigger('onSwitchState', repeatMode);
    },
    setInnerContent() {
        if (this.btnState == 0) {
            this.htmlItem.classRemove('repeat-active');
            this.htmlItem.innerContent(this.repeatInnerContent);
        } else if (this.btnState == 1) {
            this.htmlItem.classAdd('repeat-active');
            this.htmlItem.innerContent(this.repeatInnerContent);
        } else if (this.btnState == 2) {
            this.htmlItem.classAdd('repeat-active');
            this.htmlItem.innerContent(this.repeatOneInnerContent);
        }
    }
};

Object.setPrototypeOf(PlayPauseButtonItem.prototype, PlayerButtonBaseItem.prototype);
Object.setPrototypeOf(StopButtonItem.prototype, PlayerButtonBaseItem.prototype);
Object.setPrototypeOf(PrevButtonItem.prototype, PlayerButtonBaseItem.prototype);
Object.setPrototypeOf(NextButtonItem.prototype, PlayerButtonBaseItem.prototype);
Object.setPrototypeOf(ShuffleButtonItem.prototype, PlayerButtonBaseItem.prototype);
Object.setPrototypeOf(RepeatButtonItem.prototype, PlayerButtonBaseItem.prototype);

export const PlayerButtons = function(parentCnt, playerControls) {
    this.parentCnt = parentCnt;
    this.playerControls = playerControls;
    this.playPauseBtn = new PlayPauseButtonItem();
    this.stopBtn = new StopButtonItem();
    this.prevBtn = new PrevButtonItem();
    this.nextBtn = new NextButtonItem();
    this.shuffleBtn = new ShuffleButtonItem();
    this.repeatBtn = new RepeatButtonItem();
};
PlayerButtons.prototype = {
    setUp() {
        this.parentCnt.append(
            this.playPauseBtn.render(),
            this.stopBtn.render(), 
            this.prevBtn.render(),
            this.nextBtn.render(),
            this.shuffleBtn.render(),
            this.repeatBtn.render()
        );

        this.playPauseBtn.onClick(this.playerControls.playPause.bind(this.playerControls));
        this.stopBtn.onClick(this.playerControls.stop.bind(this.playerControls));
        this.prevBtn.onClick(this.playerControls.prev.bind(this.playerControls));
        this.nextBtn.onClick(this.playerControls.next.bind(this.playerControls));
        this.shuffleBtn.onClick(this.playerControls.shuffle.bind(this.playerControls));
        this.repeatBtn.onClick(this.playerControls.repeat.bind(this.playerControls));

        this.playerControls.onPlayPause(this.playPause.bind(this));
        this.playerControls.onStop(this.stop.bind(this));
        this.playerControls.onPrevTrack(this.prev.bind(this));
        this.playerControls.onNextTrack(this.next.bind(this));
        this.playerControls.onShuffle(this.shuffle.bind(this));
        this.playerControls.onRepeat(this.repeat.bind(this));
    },
    playPause(isPaused) {
        this.playPauseBtn.switchState(isPaused);
    },
    stop() {
        this.stopBtn.switchState();
    },
    prev() {
        this.prevBtn.switchState();
    },
    next() {
        this.nextBtn.switchState();
    },
    shuffle() {
        this.shuffleBtn.switchState();
    },
    repeat(repeatMode) {
        this.repeatBtn.switchState(repeatMode);
    }
}

export const PlayerControls = function(audioPlayer) {
    this.listEvents = new ListEvents();
    this.audioPlayer = audioPlayer;
    this.audioPlayer.onPlayPause((isPaused) => {
        this.listEvents.trigger('onPlayPause', isPaused);
    }, this);
}

PlayerControls.prototype = {
    setAudioPlayer(audioPlayer) {
        this.audioPlayer = audioPlayer;
    },
    playPause() {
        this.audioPlayer.playPause();
    },
    stop() {
        this.audioPlayer.stop();
        this.listEvents.trigger('onStop');
    },
    prev() {
        this.audioPlayer.prev();
        this.listEvents.trigger('onPrevTrack');
    },
    next() {
        this.audioPlayer.next();
        this.listEvents.trigger('onNextTrack');
    },
    shuffle() {
        this.audioPlayer.shuffle();
        this.listEvents.trigger('onShuffle');
    },
    repeat() {
        const repeatMode = this.audioPlayer.repeat();
        this.listEvents.trigger('onRepeat', repeatMode);
    },
    rewind() {
        this.audioPlayer.setCurrentTime(this.audioPlayer.getCurrentTime() - 1);
        this.listEvents.trigger('onRewind');
    },
    fastForward() {
        this.audioPlayer.setCurrentTime(this.audioPlayer.getCurrentTime() + 1);
        this.listEvents.trigger('onFastForward');
    },
    increaseVolume() {
        this.audioPlayer.increaseVolume();
    },
    decreaseVolume() {
        this.audioPlayer.decreaseVolume();
    },
    onPlayPause(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onPlayPause');
    },
    onStop(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onStop');
    },
    onNextTrack(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onNextTrack');
    },
    onPrevTrack(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onPrevTrack');
    },
    onShuffle(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onShuffle');
    },
    onRepeat(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onRepeat');
    },
    onRewind(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onRewind');
    },
    onFastForward(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onFastForward');
    }
}

export class AudioPlayerDisplay {
    constructor(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.displayTrackTimeMode = 1; // 0: static, 1: reverse, 2: forward
        this.volumeFader = new Fader();
        this._volTimeout = null;

        Track.onTagChange((tag, val, track) => this.manageTag(tag, val, track), this);
        this.setUpDisplay();
        this.setUpOverlays();
    }

    setUpOverlays() {
        this.volumeCnt = document.querySelector('#volume-display');
        this.volumeCntDisplay = document.querySelector('#volume-display .vol-val');
        this.muteCnt = document.querySelector('#muted-display');
        this.muteOn = document.querySelector('#muted-display #mute-on');
        this.muteOff = document.querySelector('#muted-display #mute-off');
    }

    setUpDisplay() {
        this.albumImg = document.getElementById('album-art');
        this.nameTrackElem = document.getElementById('name-track');
        this.nameAlbumElem = document.getElementById('name-album');
        this.artistName = document.getElementById('artist-name');
        this.timeTrackElem = document.getElementById('time-track');

        this.timeTrackElem.addEventListener('click', () => this.changeTrackTimeDisplayMode());
    }

    setTrack(track) {
        if (this.track) {
            // this.track.onTagChangeUnsub(this);
            this.track.onCurrentTimeUpdateUnsub(this);
        }
        this.track = track;
        // track.onTagChange((tag, val) => this.manageTag(tag, val), this);
        track.onCurrentTimeUpdate(() => this.updateTrackTime(), this);
        
        this.syncAllMetadata(track);
    }

    syncAllMetadata(track) {
        this.nameAlbumElem.innerText = track.getAlbum() ? ` ~ ${track.getAlbum()}` : '';
        this.nameTrackElem.innerText = track.getTitle();
        this.artistName.innerText = track.getArtist() || 'N/A';
        this.albumImg.src = ResourceManager.getAlbumArtURL(track);
        this.updateTrackTime();
    }

    manageTag(tag, value, track) {
        if (this.track !== track) return;
        const fields = {
            'artist': this.artistName,
            'title': this.nameTrackElem,
            'album': this.nameAlbumElem
        };
        if (fields[tag]) {
            fields[tag].innerText = (tag === 'album') ? ` ~ ${value}` : value;
        }
    }

    changeTrackTimeDisplayMode() {
        this.displayTrackTimeMode = (this.displayTrackTimeMode + 1) % 3;
        this.updateTrackTime();
    }

    updateTrackTime() {
        if (!this.track) return;
        const modes = [
            () => this.track.getTrackDuration(true),
            () => this.track.getTimeRemaining(true),
            () => this.track.getCurrentTime(true)
        ];
        this.timeTrackElem.innerText = ` - [${modes[this.displayTrackTimeMode]()}]`;
    }

    showVolumeOverlay(volume) {
        this.volumeFader.cancelFade();
        if (this._volTimeout) clearTimeout(this._volTimeout);
        
        this.volumeCntDisplay.innerText = Math.round(volume * 100);
        this.volumeCnt.style.opacity = 1;
        this.volumeCnt.style.display = 'block';
    }

    hideVolumeOverlay() {
        this._volTimeout = setTimeout(() => {
            this.volumeFader.fadeOut(this.volumeCnt, 400, 1, 0);
        }, 568);
    }

    showMuteOverlay(isMuted) {
        this.muteCnt.style.display = 'block';
        this.muteOn.style.display = isMuted ? 'block' : 'none';
        this.muteOff.style.display = isMuted ? 'none' : 'block';

        setTimeout(() => {
            this.muteCnt.style.display = 'none';
        }, 1668);
    }

    updateDisplayedVolume(volume) {
        this.volumeCntDisplay.innerText = Math.round(volume * 100);
    }
}