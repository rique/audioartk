import { AudioPlayer } from "../../../../domain/AudioPlayer.js"
export class TrackArtMediator {
    constructor(strategy, provider) {
        this.strategy = strategy;
        this.provider = provider;
        this.previousTrack = null;
    }

    async getNextImage() {
        return await this.provider.getNextImage();
    }

    async setup() {
        if (!this.isSubscribed) {
            AudioPlayer.onSetCurrentTrackFromTrackList(this._handleNextTrack.bind(this), this);
            this.isSubscribed = true;
        }

        return await this.provider.setup();
    }

    destroy() {
        AudioPlayer.unsubscribeEVent('onSetCurrentTrackFromTrackList', this);
    }

    _handleNextTrack(track) {
        if (this.previousTrack)
            this.strategy.triggerTrackChange();
        this.provider.trackChange(track).catch(e => console.error(`error while handling track change for track ${track}`, e));
        this.previousTrack = track;
    }
}