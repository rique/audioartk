import {Track} from '../../domain/models/Track.js';
import {MetadataIndex} from '../../domain/MetadataIndex.js';


export const MetadataMediator = {
    init() {
        Track.onTagChange(this._updateMetadataIndex.bind(this), this);
    },

    _updateMetadataIndex(tag, value, track) {
        if (tag === 'artist' || tag === 'album') {
            MetadataIndex.addKeyValue(tag, value);
        }
    }
};