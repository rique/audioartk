import { HTMLItems } from '../../ui/grid/RowTemplates.js';
import { ListEvents } from '../../core/EventBus.js';
import { TrackListManager } from '../../domain/TrackList.js';
import { getPercentageWidthFromMousePosition, whileMousePressedAndMove } from '../../core/Utils.js';

/**
 * Handles the "peek-ahead" visual effect on the progress bar.
 */
class HoverEffect {
    constructor(htmlItem) {
        this.htmlItem = htmlItem;
    }

    setUp() {
        const updateGradient = (evt) => {
            const percentWidth = (getPercentageWidthFromMousePosition(evt.clientX, this.htmlItem) * 100).toFixed(2);
            this.htmlItem.css({
                background: `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`
            });
        };

        this.htmlItem.addEventListener('mouseenter', updateGradient);
        this.htmlItem.addEventListener('mousemove', updateGradient);
        this.htmlItem.addEventListener('mouseleave', () => {
            this.htmlItem.css({ background: "#181717" });
        });
    }
}

/**
 * The base Progress Bar component used by the player and potentially notifications.
 */
export class ProgressBar {
    constructor(parentCnt) {
        this.listEvents = new ListEvents();
        this.mainDiv = new HTMLItems('div');
        this.subDiv = new HTMLItems('div');
        this.disableProgress = false;
        
        this.setUp(parentCnt);
    }

    setUp(parentCnt) {
        this.mainDiv.id('progress');
        this.subDiv.id('prog-bar');
        this.mainDiv.append(this.subDiv);
        
        parentCnt.append(this.mainDiv.render());

        const hover = new HoverEffect(this.mainDiv);
        hover.setUp();

        const handleSeek = (evt, mouseDown) => this.seek(evt, mouseDown);
        whileMousePressedAndMove(this.mainDiv.render(), handleSeek);
        whileMousePressedAndMove(this.subDiv.render(), handleSeek);
    }

    seek(evt, mouseDown) {
        const percentWidth = getPercentageWidthFromMousePosition(evt.clientX, this.mainDiv);
        this.disableProgress = mouseDown;
        this._updateProgressBar(percentWidth * 100);
        this.listEvents.trigger('onSeek', percentWidth, mouseDown);
    }

    onSeek(cb, subscriber) {
        this.listEvents.onEventRegister({ cb, subscriber }, 'onSeek');
    }

    progress(current, total, cb) {
        if (current > total || this.disableProgress) return false;
        
        const percentProg = (current / total) * 100;
        this._updateProgressBar(percentProg, cb);
        return true;
    }

    reset() {
        this._updateProgressBar(0);
    }

    _updateProgressBar(progress, cb) {
        requestAnimationFrame(() => {
            const clamped = Math.min(100, progress);
            this.subDiv.width(clamped, '%');
            if (typeof cb === 'function') cb();
        });
    }
}

/**
 * Controller for the Audio Player's specific progress behavior.
 */
export class AudioPlayerProgressBar {
    constructor() {
        this.isPaused = true;
        this.audioPlayer = null;
        this.progressBar = new ProgressBar(document.getElementById('player'));
    }

    setAudioPlayer(audioPlayer) {
        this.audioPlayer = audioPlayer;
    }

    togglePauseProgress(isPaused) {
        this.isPaused = isPaused;
        if (!isPaused) this.progress();
    }

    progress() {
        if (this.isPaused || !this.audioPlayer) return;
        
        const currentTime = this.audioPlayer.getCurrentTime();
        const totalTime = this.audioPlayer.getDuration();
        this.doProgress(currentTime, totalTime, () => this.progress())
        // this.progressBar.progress();
    }

    doProgress(currentTime, duration, cb) {
        /*if (this.isPaused)
            return;*/
        this.progressBar.progress(currentTime, duration, cb);
    }

    updateProgress() {
        if (!this.audioPlayer) return;
        const currentTime = this.audioPlayer.getCurrentTime();
        const totalTime = this.audioPlayer.getDuration();
        this.progressBar.progress(currentTime, totalTime);
    }

    seek(percentWidth) {
        const { track } = TrackListManager.getCurrentTrack();
        if (!track) return;

        const seekTime = track.getTrackDuration() * percentWidth;
        this.audioPlayer.setCurrentTime(seekTime);
        this.progress();
    }

    resetProgressBar() {
        this.progressBar.reset();
    }
}