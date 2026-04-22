import {readCookie} from './Utils.js';

class APIClient {
    constructor(url) {
        this.baseUrl = url || 'https://audioartk.me/api';
    }

    async request(path, options = {}) {
        const url = `${this.baseUrl}/${path}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-CSRFToken': readCookie('csrftoken')
        };

        const config = {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        };

        return this._handleResponse(await fetch(url, config))        
    }

    async post(path, body={}) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async get(path, query={}) {
        const params = new URLSearchParams(query).toString();
        const fullPath = params ? `${path}?${params}` : path;
        return this.request(fullPath, { method: 'GET' });
    }

    _getXhrPost(url) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        return xhr;
    }

    _getXhrGet(url) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        return xhr;
    }

    async _handleResponse(response) {
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const error = new Error(errorBody.reason || 'Network Error');
            error.status = response.status;
            error.code = errorBody.code;
            throw error;
        }

        return response.json();
    }
}

export class API {
    constructor(url) {
        this.client = new APIClient(url);
    }

    async browseFiles(baseDir) {
        return this.client.post('file-browser', {
            'base_dir': baseDir
        });
    }

    async addTrack(trackName, trackFullPath) {
        return this.client.post('add-track', {
            track_name: trackName,
            track_original_path: trackFullPath
        });
    }

    async editTrack(fieldType, fieldValue, trackUUid) {
        return this.client.post('edit-track', {
            field_type: fieldType,
            field_value: fieldValue,
            track_uuid: trackUUid
        });
    }

    async deleteTrack(track_uuid) {
        return this.client.post('delete-track', {
            track_uuid: track_uuid
        });
    }

    async loadTrackAlbumArt(track_uuid) {
        return this.client.post(`load-track-albumart`, {
            track_uuid: track_uuid
        });
    }

    async loadTrackInfo(track_uuid) {
        return this.client.post(`load-track-info`, {
            track_uuid: track_uuid
        })
    }

    async loadTrackList() {
        return this.client.post('load-track-list');
    }

    async loadBGImages() {
        return this.client.get('load-bg-img');
    }

    async createPlaylist(playlistName, tracklist=[]) {
        return this.client.post('create-playlist', {
            'playlist_name': playlistName,
            'tracklist': tracklist
        });
    }

    async addTrackToPlaylist(playlistUUID, tracklist=[]) {
        return this.client.post('add-track-to-playlist', {
            'playlist_uuid': playlistUUID,
            'tracklist': tracklist
        });
    }

    async loadPlaylists() {
        return this.client.post('load-playlists');
    }
}
