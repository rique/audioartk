/* * API Module
 * Provides a set of methods for interacting with the backend API of the music player application.
 * Handles operations such as browsing files, adding tracks, editing track metadata, deleting tracks, loading track album art and info, managing playlists, and more.
 * Each method sends an appropriate HTTP request to the corresponding API endpoint and processes the response to provide feedback to the caller through callbacks or promises.
 * The module is designed to be easily integrated with other components of the application, allowing for seamless communication between the frontend and backend.
 * Overall, this module serves as a crucial component of the music player application, providing a robust and flexible interface for managing tracks, playlists, and related data while ensuring efficient communication with the backend API.
 * The design allows for easy maintenance and scalability, as new API endpoints can be added by simply implementing additional methods within this module without affecting existing functionality.
 * In summary, this module provides a comprehensive implementation of the API interactions required for the music player application, ensuring smooth communication between the frontend and backend while enhancing the overall user experience through efficient data management and retrieval.
 */
import {readCookie} from './Utils.js';

const Api = function() {
    this.url = 'https://audioartk.me/api';
    this.csrftoken = readCookie('csrftoken');
};
Api.prototype = {
    getXhrPost(url) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        return xhr;
    },
    getXhrGet(url) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        return xhr;
    },
    browseFiles(baseDir, callback) {
        let xhr = this.getXhrPost(`${this.url}/file-browser`);
        let data = JSON.stringify({
            'base_dir': baseDir
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    addTrack(trackName, trackFullPath, callback) {
        let xhr = this.getXhrPost(`${this.url}/add-track`);
        let data = JSON.stringify({
            track_name: trackName,
            track_original_path: trackFullPath
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    editTrack(fieldType, fieldValue, trackUUid, callback) {
        let xhr = this.getXhrPost(`${this.url}/edit-track`);
        let data = JSON.stringify({
            field_type: fieldType,
            field_value: fieldValue,
            track_uuid: trackUUid
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    deleteTrack(track_uuid, callback) {
        let xhr = this.getXhrPost(`${this.url}/delete-track`);
        let data = JSON.stringify({
            track_uuid: track_uuid
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    loadTrackAlbumArt(track_uuid, callback) {
        let xhr = this.getXhrPost(`${this.url}/load-track-albumart`);
        let data = JSON.stringify({
            track_uuid: track_uuid
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    async loadTrackAlbumArtAsync(track_uuid) {
        const response = await fetch(`${this.url}/load-track-albumart`, {
            method: 'POST',
            body: JSON.stringify({
                track_uuid: track_uuid
            })
        });
        const parsed = await response.json();
        return parsed;
    },
    loadTrackInfo(track_uuid, callback) {
        let xhr = this.getXhrPost(`${this.url}/load-track-info`);
        let data = JSON.stringify({
            track_uuid: track_uuid,
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    async loadTrackInfoAsync(track_uuid) {
        const response = await fetch(`${this.url}/load-track-info`, {
            method: 'POST',
            body: JSON.stringify({
                track_uuid: track_uuid
            })
        });
        const parsed = await response.json();
        return parsed;
    },
    loadTrackList(callback) {
        let xhr = this.getXhrPost(`${this.url}/load-track-list`);
        let data = JSON.stringify({});

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        // xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    loadBGImages(callback) {
        let xhr = this.getXhrGet(`${this.url}/load-bg-img`);
        xhr.send();

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    createPlaylist(playlistName, tracklist=[], callback) {
        let xhr = this.getXhrPost(`${this.url}/create-playlist`);
        let data = JSON.stringify({
            'playlist_name': playlistName,
            'tracklist': tracklist
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    addTrackToPLaylist(playlistUUID, tracklist=[], callback) {
        let xhr = this.getXhrPost(`${this.url}/add-track-to-playlist`);
        let data = JSON.stringify({
            'playlist_uuid': playlistUUID,
            'tracklist': tracklist
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    loadPlaylists(callback) {
        let xhr = this.getXhrPost(`${this.url}/load-playlists`);
        let data = JSON.stringify({});

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    }
};

export default Api;
