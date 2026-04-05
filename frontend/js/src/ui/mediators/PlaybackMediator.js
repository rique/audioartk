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
            this.handleTrackChange(track, index, false, false);
            if (this.audioPlayer.isPlayerPaused()) {
                this.audioPlayer.setCurrentTrackFromTrackList(true, undefined, {track, index});
            }
        });
    },

    async handleTrackChange(track, index, isQueue, hasQueue) {
        if (isQueue) {
            this.queueGrid.syncQueue(TrackListManager.queueList.length());
            this.browser.setGrid(this.queueGrid);
        } else {
            if (!hasQueue) this.queueGrid.deactivate();
            this.browser.setGrid(this.mainGrid);
        }
        this.browser.setCurrentlyPlayingTrack(index);
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