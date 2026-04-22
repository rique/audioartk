import {API} from "../../core/HttpClient.js";
import { HTMLItems, EditInput } from "../../ui/grid/RowTemplates.js"; 
import { TrackListManager, TrackList } from "../TrackList.js";
import { ListEvents } from "../../core/EventBus.js";

const api = new API();

/**
 * Represents a specific collection of tracks
 */
export class Playlist {
    constructor(playlistUuid) {
        this.playlistUuid = playlistUuid;
        this.tracklist = new TrackList();
    }

    setTracklist(list) { this.tracklist = list; }
    getTracklist() { return this.tracklist; }
    addTrack(track) { this.tracklist.addItem(track); }
}

/**
 * Singleton-style manager for all playlists
 */
export class PlaylistManager {
    static playlists = {};

    static createAndAdd(uuid) {
        if (this.playlists[uuid]) return;
        this.playlists[uuid] = new Playlist(uuid);
        return this.playlists[uuid];
    }

    static get(uuid) { return this.playlists[uuid]; }

    static setCurrent(uuid) {
        const playlist = this.get(uuid);
        if (playlist) {
            TrackListManager.setTracklist(playlist.getTracklist());
        }
    }
}

/**
 * UI Component for creating new playlists
 */
export class PlaylistCreator {
    constructor() {
        this.container = new HTMLItems('div');
        this.input = new EditInput();
        this.saveBtn = new HTMLItems('button');
        this.visible = false;
        this._events = new ListEvents();
        this._setupUI();
    }

    _setupUI() {
        this.container.setClassName('playlist-form');
        this.container.innerContent('<h4>New Playlist</h4>');
        this.saveBtn.innerContent('Save');
        
        this.container.append(this.input, this.saveBtn);

        this.input.addEventListener('keydown', e => e.key === 'Enter' && this._validate(e));
        this.saveBtn.addEventListener('click', e => this._validate(e));
    }

    show() { this.container.show(); this.visible = true; }
    hide() { this.container.hide(); this.visible = false; }

    _validate(e) {
        e.stopPropagation();
        const name = this.input.value();
        if (!name?.trim()) return;

        try {
            api.createPlaylist(name, []).then(this._onSuccessCreated.bind(this)).catch(error => console.log(error));
        } catch (err) {
            alert('Error creating playlist');
        }
    }

    getHTMLItem() { return this.container; }

    _onSuccessCreated(res) {
        if (res.success) {
            this.input.value('');
            this.hide();
            PlaylistManager.createAndAdd(res.playlist_uuid);
        } else {
            alert('Error creating playlist');
        }

        this._events.trigger('onPlaylistCreated', res);
    }

    onPlaylistCreated(cb, subscriber) {
        this._events.onEventRegister({ cb, subscriber }, 'onPlaylistCreated');
    }
}