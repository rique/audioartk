import {Track} from '../../domain/models/Track.js';
import {MetadataIndex} from '../../domain/MetadataIndex.js';


export const MetadataMediator = {
    init() {
        console.log(Track);
        Track.onTagChange(this._updateMetadataIndex.bind(this), this); // <- throws an error: Uncaught (in promise) TypeError: (intermediate value).eventBus.onTagChange is not a function
    },

    _updateMetadataIndex(tag, value, track) {
        if (tag === 'artist' || tag === 'album') {
            MetadataIndex.addKeyValue(tag, value);
        }
    }
};