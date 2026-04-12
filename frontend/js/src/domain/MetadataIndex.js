export const MetadataIndex = {
    _data: { artist: new Set(), album: new Set() },

    initialize(tracks) {
        /*tracks.forEach(t => {
            if (t.getArtist?.()) this._data.artist.add(t.getArtist());
            if (t.getAlbum?.()) this._data.album.add(t.getAlbum());
        });*/
        for (const track of tracks) {
            if (track.getArtist?.()) this._data.artist.add(track.getArtist());
            if (track.getAlbum?.()) this._data.album.add(track.getAlbum());
        }
    },

    findMatch(field, prefix) {
        if (!prefix) return null;
        const search = prefix.toLowerCase();
        // Convert Set to array and find the first match
        return Array.from(this._data[field]).find(val => 
            val.toLowerCase().startsWith(search)
        ) || null;
    }
};