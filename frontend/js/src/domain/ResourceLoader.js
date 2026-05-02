import {API} from '../core/HttpClient.js';
const api = new API();

class BaseLoader {
    constructor(maxCacheSize) {
        this.map = new Map();
        this.maxCacheSize = maxCacheSize;
    }

    async getByIdAsync(id) {
        console.log('cache size', this.map.size)
        if (this.map.has(id)) {
            const imageDataPromise = this.map.get(id);
            console.log('Cache hit for ID', {id, imageDataPromise});
            // REFRESH CACHE ENTRY AND STORE PROMISE TO AVOID MULTIPLE SIMULTANEOUS LOADS FOR THE SAME ID
            this.map.delete(id);
            this.map.set(id, imageDataPromise);
            return imageDataPromise;
        }

        console.log('Cache miss for ID', {id});
        const imageDataPromise = this.loadAsync(id).catch((error) => {
            console.error('Error loading albumart data for ID', {id, error});
            this.map.delete(id);
            throw error;
        });
        
        if (this.map.size >= this.maxCacheSize) {
            // EVICT LEAST RECENTLY USED ENTRY
            const lruKey = this.map.keys().next().value;
            console.log('Cache limit reached, evicting least recently used entry', {lruKey});
            this.map.delete(lruKey);
        }
        console.log('Setting cache for ID', {id, imageDataPromise});
        this.map.set(id, imageDataPromise);
        return imageDataPromise;
    }
}

class AlbumArtLoader extends BaseLoader {
    constructor(maxCacheSize = 50) {
        super(maxCacheSize);
        this._defaultAlbumArt = "/static/albumart.svg";
    }

    async loadAsync(track_uuid) {
        try {
            const res = await api.loadTrackAlbumArt(track_uuid);
            if (res.success) {
                return {object: {id3: res.ID3}, loaded: true};
            }
            return {object: false, loaded: false};
        } catch(e) {
            console.error(e);
        }
    }

    getDefaultAlbumArt() {
        return this._defaultAlbumArt;
    }
};

class TrackInfoLoader extends BaseLoader {
    constructor(maxCacheSize = 1000) {
        super(maxCacheSize);
    }

    async loadAsync(track_uuid) {
        try {
            const res = await api.loadTrackInfo(track_uuid);
            if (res.success) {
                return {object: {id3: res.ID3}, loaded: true};
            }
            return {object: false, loaded: false};
        } catch(e) {
            console.error(e);
        }
    }
};

const trackInfoLoader = new TrackInfoLoader();
const albumArtLoader = new AlbumArtLoader();

export {albumArtLoader as AlbumArtLoader, trackInfoLoader as TrackInfoLoader};
