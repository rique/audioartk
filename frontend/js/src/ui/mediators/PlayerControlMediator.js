import { TrackListManager } from "../../domain/TrackList.js";
import { ResourceManager } from "../../domain/StateManager.js";

export const PlayerControlMediator = {
    init(audioPlayer, playerDisplay, playerProgressBar, notifications, playerControls, keyControls, uiModules) {
        this.audioPlayer = audioPlayer;
        this.playerDisplay = playerDisplay;
        this.playerProgressBar = playerProgressBar;
        this.notifications = notifications;
        this.playerControls = playerControls;
        this.keyControls = keyControls;
        this.uiModules = uiModules;
        this.overlayDiv = document.querySelector('.cnt-overlay');

        this._trackNearEndFired = false;

        this._bindEvents();
    },

    _bindEvents() {
        this._bindCorePlayerEvents();
        this._bindUIInteractions();
        this._bindKeyboardShortcuts();
        this._bindSystemMediaSession();
    },

    _bindCorePlayerEvents() {
        // Song Change
        this.audioPlayer.onPlayerSongChange((track) => {
            this.playerDisplay.setTrack(track);
            this.playerProgressBar.resetProgressBar();
            this.audioPlayer.setIsNearEnd(false)
            this._trackNearEndFired = false;
            this._preloadNextTrackArt();
            this._updateSystemMetadata(track);
        });

        this.audioPlayer.onTrackTimeReset(() => {
            this.playerProgressBar.resetProgressBar();
        }, this);

        // Time Update (Coming Next logic)
        this.audioPlayer.onTimeUpdate((evt) => {
            const { currentTime, duration } = evt.target;
            if (isNaN(duration)) return;
            if (duration === 0)
                return this.audioPlayer.currentTrack?.setCurrentTime(0);

            this.audioPlayer.currentTrack?.setCurrentTime(currentTime);
            const isNearEnd = (duration - currentTime <= 30);
            this.audioPlayer.setIsNearEnd(isNearEnd);
            if (isNearEnd && !this._trackNearEndFired) {
                this.audioPlayer.audioPlayerEvents.trigger('onTrackNearEnd');
                this._trackNearEndFired = true;
            }
        });
    },

    _bindUIInteractions() {
        this._setAudioElementEvents();
        // Backdrop click to close modals
        this.overlayDiv.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this._closeAllActiveWindows(e);
        });

        // Handle left menu buttons
        this.fileBrowserElem = document.querySelector('#file-browser-action button.open-file-browser');
        this.gridElement = document.querySelector('#file-browser-action button.open-tracklist-browser');
        this.playlistCreationElement = document.querySelector('#file-browser-action button.open-playlist-create');
        
        this.fileBrowserElem.addEventListener('click', (evt) => {
            this._showBackDrop();
            this.uiModules.fileBrowser.loadFileBrowser.bind(this.uiModules.fileBrowser)(evt);
        });

        this.gridElement.addEventListener('click', (evt) => {
            this._showBackDrop();
            this.uiModules.tracklistGrid.open(evt);
        });

        this.playlistCreationElement.addEventListener('click', this._displayPlaylistCreationUI.bind(this));

        // Player state sync
        this.audioPlayer.onPlayPause((isPaused, track) => {
            this.playerProgressBar.togglePauseProgress(isPaused);
            this._updateSystemMetadata(track);
        });

        this.audioPlayer.onStop(this.playerProgressBar.resetProgressBar.bind(this.playerProgressBar));
        
        this.audioPlayer.onRepeatSwitch((repeatMode) => {
            this._preloadNextTrackArt();
            TrackListManager.switchRepeatMode(repeatMode);
        }, this);
    },

    _setAudioElementEvents() {
        this.audioPlayer.audioElem.onloadedmetadata = () => {
            this.playerProgressBar.doProgress(this.audioPlayer.getCurrentTime(), this.audioPlayer.getDuration());
        };
    },

    _bindKeyboardShortcuts() {
         this.keyControls.registerKeyDownAction('m', async () => {
            await this.audioPlayer.mute();
            this.playerDisplay.showMuteOverlay(this.audioPlayer.isMuted());
        }, this);
        
        ['+', '-'].forEach(key => {
            this.keyControls.registerKeyDownAction(key, () => {
                // When key is held down, just show/reset the UI
                this.playerDisplay.showVolumeOverlay(this.audioPlayer.getVolume());
            }, this);

            this.keyControls.registerKeyUpAction(key, () => {
                // When key is released, start the fade out
                this.playerDisplay.hideVolumeOverlay();
            }, this);
        });

        this.keyControls.registerKeyDownAction('t', () => {
            this.playerDisplay.changeTrackTimeDisplayMode();
        });

        const {tracklistGrid, playlistCreation} = this.uiModules;
        
        this.keyControls.registerKeyDownAction('a', () => {
            this._showBackDrop();
            tracklistGrid.open();
        }, tracklistGrid);

        this.keyControls.registerKeyDownAction('n', this._displayPlaylistCreationUI.bind(this), playlistCreation);
        this.keyControls.registerKeyDownAction('Escape', (evt) => {
            this._hideBackDrop();
            this._closeAllActiveWindows(evt.evt);
        }, 'BYPASS_EXCLUSIVITY');
    },

    _displayPlaylistCreationUI(evt) { 
        if (evt instanceof Event)
            evt.stopPropagation();

        const {playlistCreation} = this.uiModules;

        this._showBackDrop();
        playlistCreation.show();

        const modalElement = playlistCreation.getHTMLItem().render();
        modalElement.onclick = (evt) => evt.stopPropagation();

        playlistCreation.onPlaylistCreated((res) => {
            this._hideBackDrop();
            this._closeAllActiveWindows();
        }, this);

        this.overlayDiv.append(modalElement);

        this.keyControls.setExclusivityCallerKeyUpV2(playlistCreation);
        this.keyControls.setExclusivityCallerKeyDownV2(playlistCreation);
    },

    _bindSystemMediaSession() {
        if (!('mediaSession' in navigator)) return;
        
        navigator.mediaSession.setActionHandler('play', () => this.audioPlayer.playPause());
        navigator.mediaSession.setActionHandler('pause', () => this.audioPlayer.playPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.audioPlayer.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.audioPlayer.next());
    },

    _showBackDrop() {
        this.overlayDiv.style.display = 'block';
    },

    _hideBackDrop() {
        this.overlayDiv.style.display = 'none';
    },

    _updateSystemMetadata(track) {
        document.title = `${track.getTitle()} - ${track.getArtist()}`;
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.getTitle(),
            artist: track.getArtist(),
            album: track.getAlbum(),
            artwork: [{ src: ResourceManager.getAlbumArtURL(track) }]
        });
    },

    _closeAllActiveWindows(e) {
        this.overlayDiv.style.display = 'none';
        Object.values(this.uiModules).forEach(m => {
            m.close?.(e) || m.hide?.(e) || m.setVisible?.(false);
        });

        this.keyControls.unsetExclusivityCallerKeyUpV2(this.uiModules.playlistCreation);
        this.keyControls.unsetExclusivityCallerKeyDownV2(this.uiModules.playlistCreation);
    },

    _preloadNextTrackArt() {
        const next = TrackListManager.getNextTrackInList();
        if (next?.track) ResourceManager.preloadAlbumArt(next.track);
    },
}