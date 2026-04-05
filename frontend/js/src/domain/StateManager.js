// import { AlbumArtLoader } from "../core/TrackLoader.js";

/**
 * SERVICE: ResourceManager
 * Responsibility: Centralized management of binary assets (Album Art, Blobs)
 * and preloading logic to ensure smooth UI transitions.
 */
export class StateManager {
    static cache = new Map();
    static defaultArt = "/frontend/albumart.svg";

    /**
     * Retrieves the URL for a track's album art.
     * Uses cached URLs if available, otherwise falls back to default.
     * @param {Track} track 
     * @returns {string}
     */
    static getAlbumArtURL(track) {
        const uuid = track.getTrackUUID();
        
        if (this.cache.has(uuid)) {
            return this.cache.get(uuid);
        }

        // Return default while preloading happens in the background
        return this.defaultArt;
    }

    /**
     * Pre-fetches and caches the album art for a track.
     * Essential for the "Coming Next" notification system.
     * @param {Track} track 
     */
    static async preloadAlbumArt(track) {
        const uuid = track.getTrackUUID();
        if (this.cache.has(uuid)) return;

        try {
            const artData = await track.getAlbumArt(); // This calls ID3Tags.getAlbumArt
            
            if (artData && artData !== this.defaultArt) {
                this.cache.set(uuid, artData);
                console.log(`[ResourceManager] Preloaded and cached art for: ${track.getTitle()}`);
            }
        } catch (error) {
            console.warn(`[ResourceManager] Failed to preload art for ${uuid}`, error);
        }
    }

    /**
     * Clears the cache to prevent memory leaks in long sessions.
     */
    static clearCache() {
        this.cache.clear();
    }

    /**
     * Utility to convert track binary data to a temporary ObjectURL if needed
     * (Useful if you decide to stream blobs instead of base64)
     */
    static createBlobURL(data, type) {
        const blob = new Blob([data], { type });
        return URL.createObjectURL(blob);
    }
}

export const ResourceManager = {
    _defaultAlbumArt: '/static/images/albumart.svg',
    _baseMediaTrackURL: '/static/assets/tracks/',
    _baseAlbumArtURL: '/api/track-art/',
    _knownMissingArt: new Set(),

    getDefaultAlbumArt() {
        return this._defaultAlbumArt;
    },

    getMediaAudioURL(trackUUID) {
        if (!trackUUID) return null;
        return this._baseMediaTrackURL + trackUUID + '.mp3';
    },

    getAlbumArtURL(track) {
        if (track?.has_art === false) {
            return this.getDefaultAlbumArt(); // Zero network latency
        }
        console.log('ResourceManager.getAlbumArtURL called with track', {track}, track.getTrackUUID());
        return `${this._baseAlbumArtURL}${track.getTrackUUID()}/`;
    },

    markAsMissing(trackUUID) {
        this._knownMissingArt.add(trackUUID);
    },

    preloadAlbumArt(track) {
        const img = new Image();
        img.src = this.getAlbumArtURL(track);
        img.onerror = () => {
            console.warn(`Failed to preload album art for track ${track.getTrackUUID()}, using default art.`);
            img.src = this.getDefaultAlbumArt();
        }
    },
}
