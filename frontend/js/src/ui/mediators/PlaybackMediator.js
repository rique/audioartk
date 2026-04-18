import { TrackListManager } from "../../domain/TrackList.js";

export const PlaybackMediator = {
    _comingNextFired: false,

    init(tracklistBrowser, mainGrid, queueGrid, audioPlayer) {
        this.browser = tracklistBrowser;
        this.mainGrid = mainGrid;
        this.queueGrid = queueGrid;
        this.audioPlayer = audioPlayer;

        // Listen for Global Track Events
        TrackListManager.onQueueFinished(() => this.handleQueueEnd());
        TrackListManager.onTrackListLoaded(() => this._initializeMainGrid());
        
        TrackListManager.onTrackChanged((...args) => this.handleTrackChange(...args));
        TrackListManager.onGridSyncRequired((...args) => this.handleTrackChange(...args));
        
        TrackListManager.onShuffleTracklist((track, index) => {
            this.mainGrid.redrawGrid();
            this.handleTrackChange(track, index, false, TrackListManager.queueList.length() > 0);
            if (this.audioPlayer.isPlayerPaused()) {
                this.audioPlayer.setCurrentTrackFromTrackList(true, undefined, {track, index});
            }
        });

        this.queueGrid.onQueueRendered((row) => {
            this.handleNowPlaying(this.audioPlayer.isPlayerPaused(), row);
        });

        this.audioPlayer.onPlayPause((isPaused) => {
            const index = TrackListManager.getCurrentTrackIndex();
            const row = this.browser.getGrid().getRowByIndex(index);
            this.handleNowPlaying(isPaused, row);
        });

        this.audioPlayer.onStop(() => {
            const index = TrackListManager.getCurrentTrackIndex();
            const row = this.browser.getGrid().getRowByIndex(index);
            this.handleNowPlaying(true, row);
        });
    },

    async handleTrackChange(track, index, isQueue, hasQueue) {
        console.log('handleTrackChange', {track, index, isQueue, hasQueue});
        if (isQueue) {
            this.queueGrid.syncQueue(TrackListManager.queueList.length());
            this.browser.setGrid(this.queueGrid);
        } else {
            if (!hasQueue) 
                this.queueGrid.deactivate();
            else
                this.mainGrid._syncQueuePosition();
            this.browser.setGrid(this.mainGrid);
        }
        this.browser.setCurrentlyPlayingTrack(index);
        this.handleNowPlaying(this.audioPlayer.isPlayerPaused());
    },

    handleNowPlaying(isPaused, row) {
        this.browser.toggleNowPlaying(isPaused, row);
    },

    handleQueueEnd() {
        this.mainGrid.releaseQueueAnchor();
    },

    _initializeMainGrid() {
        this.mainGrid.setUp();
        this.mainGrid.buildGrid();
        this.mainGrid.render();
    },
}