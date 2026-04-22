import { TrackListManager } from "../../domain/TrackList.js";
import { PlayerNotifier } from "../Notifier.js";

export const PlaybackNotificationMediator = {
    init(audioPlayer, playerControls, playerProgressBar) {
        this.audioPlayer = audioPlayer;
        this.playerControls = playerControls;
        this.playerProgressBar = playerProgressBar;
        this._isNextTrackfired = false;

        this._setupSubscriptions();
    },

    _setupSubscriptions() {
        // 1. Listen for the 30-second threshold (from AudioPlayer/PlayerManager)
        this.audioPlayer.onTrackNearEnd(this._handleNearEnd.bind(this), this);
        this.audioPlayer.onPlayerSongChange(this._hideNextTrackNotification.bind(this), this);
        this.audioPlayer.onPlayPause((isPaused, track) => {
            if (isPaused) return PlayerNotifier.pause();
            return PlayerNotifier.play();
        });
        this.playerControls.onPrevTrack(this._hideNextTrackNotification.bind(this), this);
        
        this.playerProgressBar.progressBar.onSeek((percent, mouseDown) => {
            if (!this.audioPlayer.isNearEnd())
                this._hideNextTrackNotification();
            this.playerProgressBar.seek(percent, mouseDown);
        }, this);

        // 2. Listen for Queue Updates (The case you mentioned)
        TrackListManager.onAddedToQueue(this._handleQueueUpdate.bind(this), this);
        TrackListManager.onTrackIndexSwitch(this._handleSwitchTrack.bind(this), this);
    },

    _handleNearEnd() {
        if (this._isNextTrackfired) return;
        
        const currentTrack = this.audioPlayer.getCurrentTrack();
        const {track} = TrackListManager.getNextTrackInList();
        
        if (track && currentTrack) {
            PlayerNotifier.showNext(track, currentTrack.getTimeRemaining() * 1000);
            this._isNextTrackfired = true;
        }
    },

    _handleQueueUpdate() {
        if (!PlayerNotifier.isActive()) return;

        const currentTrack = this.audioPlayer.getCurrentTrack();
        const {track} = TrackListManager.getNextTrackInList();
        
        if (!track || !currentTrack) return;
        
        PlayerNotifier.hide(() => {
            PlayerNotifier.showNext(track, currentTrack.getTimeRemaining() * 1000);
        });
    },

    _handleSwitchTrack() {
        if (!this.audioPlayer.isNearEnd()) return;
        this._hideNextTrackNotification();
        this._handleNearEnd();
    },

    _hideNextTrackNotification() {
        if (!this._isNextTrackfired) return;

        this._isNextTrackfired = false;
        PlayerNotifier.hide();
    }
};