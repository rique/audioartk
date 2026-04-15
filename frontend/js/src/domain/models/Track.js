/** Tracks Module
 * Defines the Track class and related functionality for managing track metadata, album art, and interactions with the audio player and tracklist browser.
 * The Track class encapsulates properties such as title, artist, album, duration, and current playback time, as well as methods for updating and retrieving this information.
 * Integrates with the ID3Tags class to manage track metadata and the AlbumArtLoader for fetching album art asynchronously.
 * Provides a TrackEditor object for handling inline editing of track metadata within the tracklist grid.
 * The module is designed to be extensible and integrates with other components of the application, such as notifications and the audio player display.
 */
import { ListEvents, keyCotrols } from "../../core/EventBus.js"; // Adjust based on your final naming
import Api from "../../core/HttpClient.js";
import { TrackListManager } from "../../domain/TrackList.js";
import { AlbumArtLoader } from "../../domain/AudioEngine.js";

const api = new Api();

/**
 * Handles metadata for a specific track
 */
export class ID3Tags {
    constructor(tags) {
        this.tags = tags;
        this.albumArtLoader = AlbumArtLoader;
        this._unpackTags(tags);
    }

    _unpackTags(tags) {
        this.title = tags.title;
        this.album = tags.album;
        this.artist = tags.artist;
        this.duration = tags.duration;
    }

    getArtist() { return this.artist; }
    getTitle() { return this.title; }
    getAlbum() { return this.album; }
    getDuration() { return this.duration; }

    async getAlbumArt(uuid) {
        const result = await this.albumArtLoader.getByIdAsync(uuid);
        const data = result?.object?.id3?.picture?.data;
        const format = result?.object?.id3?.picture?.format;

        return (data && format) ? `data:${format};base64,${data}` : this.albumArtLoader.getDefaultAlbumArt();
    }

    setArtist(val) { this.tags.artist = val; this._unpackTags(this.tags); }
    setTitle(val) { this.tags.title = val; this._unpackTags(this.tags); }
    setAlbum(val) { this.tags.album = val; this._unpackTags(this.tags); }
}

/**
 * The core Track entity
 */
export class Track {
    static eventBus = new ListEvents();
    constructor(trackInfo) {
        this.trackName = trackInfo.track_name;
        this.trackUUid = trackInfo.track_uuid;
        this.trackOriginalPath = trackInfo.track_original_path;
        this.currentTime = 0;
        this.trackDuration = 0;
        this.isPlaying = false;
        this.index = 0;
        this.events = new ListEvents();
        this._id3Instance = null;
    }

    setTrackDuration(duration) { this.trackDuration = duration; }
    setIndex(index) { this.index = index; }
    getIndex() { return this.index; }
    getTrackUUID() { return this.trackUUid; }
    getTrackDuration(formated) {
        if (formated) return this.formatTrackDuration();
        return this.trackDuration;
    }
    
    setCurrentTime(val) {
        this.currentTime = val;
        this.events.trigger('onCurrentTimeUpdate', val);
    }
    
    onCurrentTimeUpdate(cb, subscriber) {
        this.events.onEventRegister({cb, subscriber},'onCurrentTimeUpdate');
    }
    
    onCurrentTimeUpdateUnsub(subscriber) {
        this.events.unsubscribeEVent({eventKey: 'onCurrentTimeUpdate', subscriber})
    }
    
    getCurrentTime(formated) {
        if (formated)
            return this.formatCurrentTime();
        return this.currentTime;
    }
    
    getTimeRemaining(formated) {
        let remainigTime = this.getTrackDuration() - this.getCurrentTime();
        if (formated)
            return this._formatTime(remainigTime);
        return remainigTime;
    }
    
    formatTrackDuration() {
        if (typeof this.trackDuration === 'undefined') {
            const id3Tags = this.getID3Tags();
            if (!id3Tags)
                return;
            this.trackDuration = id3Tags.getDuration()
        }
        
        return this._formatTime(this.trackDuration); 
    }
    
    formatCurrentTime() {
        return this._formatTime(this.getCurrentTime());
    }
    
    getTitle() {
        const title = this._id3TagsInstance.getTitle();
        return title ? title : this.trackName;
    }

    getArtist() { return this._id3TagsInstance.getArtist(); }
    getAlbum() { return this._id3TagsInstance.getAlbum(); }
    
    get album() { return this.getAlbum(); }
    get artist() { return this.getArtist(); }
    
    async getAlbumArt() { 
        return await this._id3TagsInstance.getAlbumArt(this.trackUUid); 
    }
    
    getID3Tags() { return this._id3TagsInstance; }
    
    setID3Tags(id3Tags) { this._id3TagsInstance = id3Tags; }
    
    setTag(tag, value) {
        if (tag == 'title')
            this._id3TagsInstance.setTitle(value);
        else if (tag == 'artist')
            this._id3TagsInstance.setArtist(value);
        else if (tag == 'album')
            this._id3TagsInstance.setAlbum(value);
        console.log('setTag triggers onTagChange', {tag, value});
        Track.eventBus.trigger('onTagChange', tag, value, this);
    }
   static onTagChange(cb, subscriber) {
        Track.eventBus.onEventRegister({cb, subscriber}, 'onTagChange');
    }
    onTagChangeUnsub(subscriber) {
        this.events.unsubscribeEVent({eventKey: 'onTagChange', subscriber});
    }
    _formatTime(millisecTime) {
        let mins = '0', secs = '0';
        if (!isNaN(millisecTime)) {
            mins = parseInt(millisecTime / 60).toString();
            secs = parseInt(millisecTime % 60).toString();
        }
        return `${mins.padStart(2, '0')}:${secs.padStart(2, '0')}`
    }
}

/**
 * Static Utility for editing track data
 */
export const TrackEditor = {
    onclickCell() {
        this._setExclusivity();
    },
    onValidate(evt, cell, value, oldValue) {
        this._unsetExclusivity();
        const trackUUid = cell.data('trackId');
        const fieldType = cell.data('fieldType');

        if (oldValue == value) {
            cell.innerContent(oldValue);
            return;
        }

        api.editTrack(fieldType, value, trackUUid, (res) => {
            if (res.success) {
                cell.innerContent(value);
                const {track} = TrackListManager.getTrackByUUID(trackUUid);
                track.setTag(fieldType, value);
            } else {
                cell.innerContent(oldValue);
            }
        });
    },
    _setExclusivity() {
        keyCotrols.setExclusivityCallerKeyUpV2(this);
        keyCotrols.setExclusivityCallerKeyDownV2(this);
    },
    _unsetExclusivity() {
        keyCotrols.unsetExclusivityCallerKeyUpV2();
        keyCotrols.unsetExclusivityCallerKeyDownV2();
    },
};

export const TrackSearch = function(searchableGrid) {
    this.searchEvents = new ListEvents();
    this.term = '';
    this.searchableGrid = searchableGrid;
}
TrackSearch.prototype = {
    init() {
        this.magGlassElem = document.querySelector('.tracklist-head .tracklist-search .img-cnt');
        this.searchElemCnt = document.querySelector('.tracklist-head .tracklist-search .input-cnt');
        this.searchInputElem = document.querySelector('.tracklist-head .tracklist-search .input-cnt .search-input');
        this.magGlassElem.addEventListener('click', this._toggleInputSearchVisibility.bind(this));
        this.searchElemCnt.addEventListener('keyup', this.search.bind(this));
    },
    search(evt) {
        this.result = this.searchableGrid.search(evt.target.value);
        this.searchEvents.trigger('onSearchResult', this.result);
    },
    onSearchResult(cb, subscriber) {
        this.searchEvents.onEventRegister({cb, subscriber}, 'onSearchResult');
    },
    onSearchVisibilityChange(cb, subscriber) {
        this.searchEvents.onEventRegister({cb, subscriber}, 'onSearchVisibilityChange');
    },
    _isSearchVisible() {
        return this.searchElemCnt.style.visibility == 'visible';
    },
    _toggleInputSearchVisibility() {
        if (!this._isSearchVisible()) {
            this._openSearch();
        } else {
            this._closeSearch();    
            this.searchableGrid.clearSearch();
        }
        this.searchEvents.trigger('onSearchVisibilityChange', this._isSearchVisible());
    },
    _openSearch() {
        this._setExclusivity();
        this.searchElemCnt.style.visibility = 'visible';
        this.searchInputElem.focus();
    },
    _closeSearch() {
        this._unsetExclusivity();
        this.searchElemCnt.style.visibility = 'hidden';
        this.term = '';
        this.searchInputElem.value = '';
    },
    _setExclusivity() {
        console.log('Setting exclusivity');
        keyCotrols.setExclusivityCallerKeyUpV2(this);
        keyCotrols.setExclusivityCallerKeyDownV2(this);
    },
    _unsetExclusivity() {
        console.log('Unsetting exclusivity');
        keyCotrols.unsetExclusivityCallerKeyUpV2(this);
        keyCotrols.unsetExclusivityCallerKeyDownV2(this);
    },
}