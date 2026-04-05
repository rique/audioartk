import { TrackListManager } from "../../domain/TrackList.js";
import { ResourceManager } from "../../domain/StateManager.js";

export const PlayerControlMediator = {
    init(player, playerDisplay, playerProgressBar, notifications, playerControls, keyControls, uiModules) {
        this._comingNextFired = false;
        this.player = player;
        this.playerDisplay = playerDisplay;
        this.playerProgressBar = playerProgressBar;
        this.notifications = notifications;
        this.playerControls = playerControls;
        this.keyControls = keyControls;
        this.uiModules = uiModules;
        this.overlayDiv = document.querySelector('.cnt-overlay');

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
        this.player.onPlayerSongChange((track) => {
            this.playerDisplay.setTrack(track);
            this.playerProgressBar.resetProgressBar();
            if (this._comingNextFired) this.notifications.hide();
            
            this._comingNextFired = false;
            this._preloadNextTrackArt();
            this._updateSystemMetadata(track);
        });

        // Time Update (Coming Next logic)
        this.player.audioElem.ontimeupdate = (evt) => {
            const { currentTime, duration } = evt.target;
            if (isNaN(duration) || duration === 0) return;

            if (this.player.currentTrack) {
                this.player.currentTrack.setCurrentTime(currentTime);
            }

            if ((duration - currentTime <= 30) && !this._comingNextFired) {
                this._handleComingNext(duration, currentTime);
            }
        };
    },

    _handleComingNext(duration, currentTime) {
        this._comingNextFired = true;
        const next = (this.player.getRepeatMode() === 2) 
            ? { track: this.player.currentTrack } 
            : TrackListManager.getNextTrackInList();

        if (next?.track) {
            const remaining = (duration - currentTime) * 1000;
            this.notifications.showNext(next.track, remaining);
        }
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
        this.player.onPlayPause((isPaused, track) => {
            this.playerProgressBar.togglePauseProgress(isPaused);
            this._updateSystemMetadata(track);
        });

        this.player.onStop(this.playerProgressBar.resetProgressBar.bind(this.playerProgressBar));
        
        this.playerControls.onPrevTrack(() => {
            this._hideIfComingNext();
        }, this);
        
        this.playerProgressBar.progressBar.onSeek((percent, mouseDown) => {
            this._hideIfComingNext();
            this.playerProgressBar.seek(percent, mouseDown);
        }, this);
        
        this.playerControls.onRepeat((repeatMode) => {
            this._preloadNextTrackArt();
        }, this);
    },

    _setAudioElementEvents() {
        this.player.audioElem.onloadedmetadata = () => {
            this.playerProgressBar.doProgress(this.player.getCurrentTime(), this.player.getDuration());
        };
    },

    _bindKeyboardShortcuts() {
         this.keyControls.registerKeyDownAction('m', () => {
            this.player.mute();
            this.playerDisplay.showMuteOverlay(this.player.isMuted());
        }, this);
        
        ['+', '-'].forEach(key => {
            this.keyControls.registerKeyDownAction(key, () => {
                // When key is held down, just show/reset the UI
                this.playerDisplay.showVolumeOverlay(this.player.getVolume());
            }, this);

            this.keyControls.registerKeyUpAction(key, () => {
                // When key is released, start the fade out
                this.playerDisplay.hideVolumeOverlay();
            }, this);
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
        console.log('Displaying playlist creation UI', {evt});
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
        
        navigator.mediaSession.setActionHandler('play', () => this.player.playPause());
        navigator.mediaSession.setActionHandler('pause', () => this.player.playPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.player.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.player.next());
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

    _hideIfComingNext() {
        if (this._comingNextFired === true) {
            this.notifications.hide();
            this._comingNextFired = false;
        }
    },
}