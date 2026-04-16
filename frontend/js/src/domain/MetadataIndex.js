import { TrackListManager } from "./TrackList.js";

export const MetadataIndex = {
    _data: { artist: new Set(), album: new Set() },

    initialize(tracks) {
        for (const track of tracks) {
            this.addTrack(track);
        }
    },

    findMatch(field, prefix) {
        if (!prefix) return null;
        const search = prefix.toLowerCase();
        // Convert Set to array and find the first match
        return Array.from(this._data[field]).find(val => 
            val.toLowerCase().startsWith(search)
        ) || null;
    },

    addTrack(track) {
        if (track.getArtist?.()) this._data.artist.add(track.getArtist());
        if (track.getAlbum?.()) this._data.album.add(track.getAlbum());
    },
    
    addKeyValue(key, value) {
        if (key === 'artist') this._data.artist.add(value);
        else if (key === 'album') this._data.album.add(value);
    },

    removedTrack({track}) {
        // Optional: Implement if you want to remove metadata when a track is removed
        // Note: This is more complex because you need to check if other tracks share the same artist/album
        const tracklist = TrackListManager.getTrackList();
        const artist = track.getArtist?.();
        const album = track.getAlbum?.();

        if (artist) {
            const hasOtherWithArtist = tracklist.filterBy('artist', artist).length > 0;
            console.log('hasOtherWithArtist', {artist, hasOtherWithArtist});
            if (!hasOtherWithArtist) {
                this._data.artist.delete(artist);
            }
        }

        if (album) {
            const hasOtherWithAlbum = tracklist.filterBy('album', album).length > 0;
            console.log('hasOtherWithAlbum', {album, hasOtherWithAlbum});
            if (!hasOtherWithAlbum) {
                this._data.album.delete(album);
            }
        }
    }
};