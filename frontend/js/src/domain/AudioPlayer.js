import { ListEvents } from "../core/EventBus.js";
import { TrackListManager } from "./TrackList.js";
import { whileMousePressed, whileMousePressedAndMove } from "../core/Utils.js";
import { ResourceManager } from "./StateManager.js";

export class AudioPlayer {
    constructor(audioEngine) {
        this.audioElem = new Audio();
        this.audioPlayerEvents = new ListEvents();
        
        this.audioEngine = audioEngine;

        this.volumeStep = 0.02;
        this.repeatMode = 0; // 0: no repeat, 1: all, 2: one
        this.isPaused = true;
        this._isNearEnd = false;

        // DOM Elements
        //FIXME: Remove the UI volume handling in it's own class  
        this.mainVolumeBarElem = document.getElementById('main-volume-bar');
        this.volumeBarElem = document.getElementById('volume-bar');
        this.volUpBtn = document.querySelector('span.vol-up');
        this.volDownBtn = document.querySelector('span.vol-down');
        this.volumeVal = document.querySelector('span.vol-val');
    }

    init() {
        this._setUpPlayer();

        //FIXME: Remove the UI volume handling in it's own class
        whileMousePressed(this.volUpBtn, () => this.increaseVolume(), 84);
        whileMousePressed(this.volDownBtn, () => this.decreaseVolume(), 84);
        //FIXME: Remove the UI volume handling in it's own class
        const handleVolumeMove = (evt, mouseUp) => this.changeVolume(evt, mouseUp);
        whileMousePressedAndMove(this.mainVolumeBarElem, handleVolumeMove);
        whileMousePressedAndMove(this.volumeBarElem, handleVolumeMove);

        TrackListManager.onTrackManagerIndexChange(() => {
            this.setCurrentTrackFromTrackList(false);
            this.play();
        });
    }

    setIsNearEnd(val) {
        this._isNearEnd = !!val;
    }

    isNearEnd() {
        return this._isNearEnd;
    }

    _setUpPlayer() {
        this.audioElem.autoplay = false;
        this.audioElem.preload = "auto";
        // this.audioElem.volume = 1;
        this.audioElem.onended = () => this.audioEnded();
    }

    changeVolume(evt, mouseUp) {
        this.mainVolumeBarElem.classList.toggle('volume-action', mouseUp);
        const pct = this._getPercentageWidthFromMousePosition(evt.clientX, this.mainVolumeBarElem);
        this.setVolume(pct);
    }

    setVolume(volume) {
        const clamped = Math.min(1, Math.max(0, volume));
        // this.audioElem.volume = clamped;
        this.audioEngine.gain().setVolume(clamped);
        this._updateVolumeBar(clamped);
        this.audioPlayerEvents.trigger('onVolumeChange', clamped);
    }

    async playPause() {
        console.log('playPause', this.isPaused, this.audioEngine.gain().volume())
        if (this.isPaused) {
            this.play();
            await this.audioEngine.gain().fadeIn(.15);
        } else {
            await this.audioEngine.gain().fadeOut(.15);
            this.pause();
        }
        
        return this.isPaused;
    }

    play() {
        this.isPaused = false;
        this.currentTrack.isPlaying = true;
        this.audioPlayerEvents.trigger('onPlayPause', this.isPaused, this.currentTrack);
        this.audioElem.play();
    }

    pause() {
        this.audioElem.pause();
        this.isPaused = true;
        this.currentTrack.isPlaying = false;
        this.audioPlayerEvents.trigger('onPlayPause', this.isPaused, this.currentTrack);
    }

    stop() {
        this.pause();
        this.setCurrentTime(0);
        this.audioPlayerEvents.trigger('onStop', this.currentTrack);
    }

    next() {
        this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack);
        this.setCurrentTrackFromTrackList(true, false);
    }

    prev() {
        if (this.getCurrentTime() > 3.6) {
            this.setCurrentTime(0);
            this.audioPlayerEvents.trigger('onTrackTimeReset', this.currentTrack);
        } else {
            this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack);
            this.setCurrentTrackFromTrackList(true, true);
        }
    }

    repeat() {
        if (this.repeatMode >= 2)
            this.repeatMode = 0;
        else
            ++this.repeatMode;
        this.audioPlayerEvents.trigger('onRepeatSwitch', this.repeatMode);
        return this.repeatMode;
    }

    getRepeatMode() {
        return this.repeatMode;
    }

    onRepeatSwitch(cb, subscriber) {
        this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onRepeatSwitch');
    }

    setCurrentTime(timeInSec) {
        if (timeInSec < 0)
            timeInSec = 0;
        else if (timeInSec > this.currentTrack.getTrackDuration())
            timeInSec = this.currentTrack.getTrackDuration();
        this.audioElem.currentTime = timeInSec;
    }

    getCurrentTime() {
        return this.audioElem.currentTime;
    }
    getDuration() {
        return this.audioElem.duration;
    }
    
    onVolumeChange(cb, subscriber) {
        this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onVolumeChange');
    }
   
    shuffle() {
        TrackListManager.shuffle(!this.isPaused);
        this.audioPlayerEvents.trigger('onShuffle', TrackListManager.getTrackList());
        if (this.isPaused)
            this.setCurrentTrackFromTrackList(true);
    }
    onShuffle(cb, subscriber) {
        this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onShuffle');
    }
    isPlayerPaused() {
        return this.isPaused;
    }

    setCurrentTrackFromTrackList(autoPlay, prev = false, trackToPlay = null) {
        let track, index;
        if (trackToPlay) {
            ({ track, index } = trackToPlay);
        } else {
            const result = prev ? TrackListManager.getPreviousTrack() : TrackListManager.getNexTrack();
            track = result.track;
            index = result.index;
        }

        if (!track) return console.error('AudioPlayer: Track fetch failed');
        this.setPlayerSong(track, index, autoPlay);
    }

    setPlayerSong(track, trackIdx, autoPlay) {
        this.currentTrack = track;
        this.currentTrack.isPlaying = autoPlay;
        this.audioElem.src = ResourceManager.getMediaAudioURL(track.getTrackUUID());
        this.audioPlayerEvents.trigger('onPlayerSongChange', track, trackIdx);
        
        return autoPlay ? this.play() : this.stop();
    }

    getCurrentTrack() {
        return this.currentTrack;
    }

    audioEnded() {
        this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack);
        
        const isLast = TrackListManager.isLastTrack();
        let autoPlay = true;

        if (isLast) {
            if (this.repeatMode === 0) {
                autoPlay = false;
                TrackListManager.reset();
            } else if (this.repeatMode === 1) {
                if (!TrackListManager.isShuffle()) {
                    TrackListManager.reset();
                } else {
                    TrackListManager.reShuffle();
                    this.audioPlayerEvents.trigger('onShuffle', TrackListManager.getTrackList());
                }
            }
        }
        this.setCurrentTrackFromTrackList(autoPlay);
    }

    // Helpers & Getters
    increaseVolume() { this.audioEngine.gain().setVolume(this.audioEngine.gain().volume() + this.volumeStep); }
    decreaseVolume() { this.audioEngine.gain().setVolume(this.audioEngine.gain().volume() - this.volumeStep); }
    setCurrentTime(time) { this.audioElem.currentTime = time; }
    getCurrentTime() { return this.audioElem.currentTime; }
    getDuration() { return this.audioElem.duration; }
    getVolume() { return this.audioEngine.gain().volume(); }
    isMuted() { return this.audioEngine.gain().isMuted; }
    async mute() { await this.audioEngine.gain().mute(); }

    _updateVolumeBar(volume) {
        const pct = volume * 100;
        this.volumeVal.innerText = Math.round(pct).toString();
        requestAnimationFrame(() => {
            this.volumeBarElem.style.width = `${pct}%`;
        });
    }

    _getPercentageWidthFromMousePosition(clientX, element) {
        const rect = element.getBoundingClientRect();
        return (clientX - rect.left) / rect.width;
    }

    onTimeUpdate(handler) { this.audioElem.addEventListener('timeupdate', handler); }
    onTimeUpdateUnsub(handler) { this.audioElem.removeEventListener('timeupdate', handler); }
    onPlayerSongChange(cb, subscriber) { this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onPlayerSongChange'); }
    onPlayPause(cb, subscriber) { this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onPlayPause'); }
    onStop(cb, subscriber) { this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onStop'); }
    onTrackNearEnd(cb, subscriber) { this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onTrackNearEnd'); }
    onTrackTimeReset(cb, subscriber) { this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onTrackTimeReset'); }
}