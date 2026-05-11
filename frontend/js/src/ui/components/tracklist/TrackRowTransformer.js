import { TrackEditor } from "../../../domain/models/Track.js";

export class TrackRowTransformer {
    static toConfig(track, index, options = {}) {
        const { isQueue = false, trackListBrowser } = options;
        
        return [
            { 
                content: isQueue ? `Q${parseInt(index) + 1}` : parseInt(index) + 1, 
                width: 5, unit: '%', type: 'int', customClass: 'cell-index'
            },
            {
                content: track.getTitle(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 25, unit: '%', type: 'str', searchable: true,
                data: { trackId: track.trackUUid, fieldType: 'title' }
            },
            {
                content: track.getTitle(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 25, unit: '%', type: 'str', searchable: true,
                data: { trackId: track.trackUUid, fieldType: 'title' }
            },
            {
                content: track.getArtist(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                onInput: evt => this.events.trigger('onTrackArtistEditing', track, evt.detail.HTMLItem, evt.detail.HTMLItem.value(), evt),
                width: 25, unit: '%', type: 'str', searchable: true,
                data: { trackId: track.trackUUid, fieldType: 'artist' }
            },
            {
                content: track.getAlbum(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                onInput: evt => this.events.trigger('onTrackAlbumEditing', track, evt.detail.HTMLItem, evt.detail.HTMLItem.value(), evt),
                width: 25, unit: '%', type: 'str', searchable: true,
                data: { trackId: track.trackUUid, fieldType: 'album' }
            },
            { 
                content: track.getTrackDuration(true), 
                width: 8, 
                unit: '%',
                textAlign: 'center' 
            },
            {
                content: `<span data-track-id="${track.trackUUid}" class="track-actions"><li class="fa-solid fa-ellipsis"></li></span>`,
                width: 4, unit: '%',
                onClick: this._trackListBrowser.showActionMenu.bind(this._trackListBrowser),
                data: { trackId: track.trackUUid }
            },
            {
                content: '<div class="action-play"><li class="fa-solid fa-play"></li></div>',
                width: 4, unit: '%',
                onClick: this._trackListBrowser.playSongFromTracklist.bind(this._trackListBrowser),
                textAlign: 'center'
            },
            // ... Artist, Album, Duration cells go here ...
            {
                content: 'drag', draggable: true,
                onDragged: (evt) => { /* ... Drag logic ... */ },
                onDropped: (evt) => { /* ... Drop logic ... */ },
                width: 4, unit: '%'
            }
        ];
    }
}