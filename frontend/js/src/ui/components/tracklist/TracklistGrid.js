import { ListEvents } from "../../../core/EventBus.js";
import { TrackSearch } from "../../../domain/models/Track.js";
import { GridMaker } from "../../collections/grid/GridMaker.js";
import { QueuelistGrid } from './QueuelistGrid.js';
import { TrackListManager } from "../../../domain/TrackList.js";
import { TrackEditor } from "../../../domain/models/Track.js";

export class TracklistGrid {
    constructor(selector = '#table-content', audioPlayer, trackListBrowser) {
        this.gridMaker = new GridMaker({parentCnt: document.querySelector(selector), sortable: true, searchable: true, flex: true});
        this.gridMaker.setDraggable(true, true);
        this.audioPlayer = audioPlayer;
        this.trackSearch = new TrackSearch(this.getGrid());
        this.trackSearch.onSearchVisibilityChange(this._restoreGrid.bind(this), this);
        this.trackSearch.init();
        this._trackListBrowser = trackListBrowser;
        this.queuelistGrid = new QueuelistGrid(this);
        this.lastMainAnchor = null;
        this.events = new ListEvents();
        TrackListManager.onRemoveTrackFromTrackList(this.removeTrackFromGrid.bind(this));
    }

    setUp() {
        this.getGrid().onSortedGrid(this.resetAfterSort.bind(this));
    }

    getQueueGrid() { return this.queuelistGrid; }
    getGrid() { return this.gridMaker.getGrid(); }
    getParentCnt() { return this.getGrid().getParentCnt(); }
    getRowByIndex(index) { return this.gridMaker.getRowByIndex(index); }

    appendTrackToGrid({ track }) {
        const index = this.getGrid().length();
        track.setIndex(index);
        this.addTrackToGrid({ track, index });
        this.reload();
        this._syncQueuePosition();
        this._setCurrentTrack();
    }

    addTrackToGrid({ track, index }) {
        const rowConfig = this._getRowConfigFromTrack(track, index);
        this.gridMaker.makeRowIdx(rowConfig, false, false, parseInt(index) + 1);
    }

    releaseQueueAnchor() {
        this.lastMainAnchor = null;
        this._syncQueuePosition();
    }

    removeTrackFromGrid({ index }) {
        this.gridMaker.removeRowFromGrid(index);
        this.reload();
        this._syncQueuePosition();
        this._setCurrentTrack();
    }

    buildGrid(doRender) {
        this._buildHeaders();
        this._buildBody();
        if (doRender) this.render();
    }

    redrawGrid() {
        this.gridMaker.resetDragDrop();
        this.gridMaker.clearRows();
        this.buildGrid(true);
        this._syncQueuePosition();
    }

    render() {
        this.gridMaker.render();
        this._displayTracklistInfo();
    }

    reload() {
        this.gridMaker.reload();
        this._displayTracklistInfo();
    }

    async reloadAsync() {
        this.reload();
    }

    open() {
        this._trackListBrowser.show();
        this.gridMaker.open();
    }

    close(evt) {
        this._trackListBrowser.hide(evt);
    }

    resetAfterSort() {
        this.queuelistGrid.gridMaker.clearRows();
        this.queuelistGrid.buildGrid(true);
        TrackListManager.triggerGridRefresh();
    }

    reloadGrid() {
        this.reloadAsync().then(() => {
            this._syncQueuePosition(true);
            this._setCurrentTrack();
        });
    }

    _restoreGrid(isVisible) {
        if (!isVisible) {
            this.reloadGrid();
        }
    }

    _syncQueuePosition(forceRefresh = false) {
        if (!this.queuelistGrid) return;

        let anchorRow = null;

        if (!forceRefresh && this.queuelistGrid.isQueuePlaying && this.lastMainAnchor) {
            if (document.body.contains(this.lastMainAnchor.render())) {
                anchorRow = this.lastMainAnchor;
            }
        }

        if (!anchorRow) {
            const currentIdx = TrackListManager.getAnchorIndex();
            anchorRow = this.getRowByIndex(currentIdx);
            if (this.queuelistGrid.isQueuePlaying) this.lastMainAnchor = anchorRow;
        }

        this.queuelistGrid.syncPosition(anchorRow, forceRefresh);
    }

    _buildHeaders() {
        const head = [
            { content: 'N°', sorterCell: true, width: 5, unit: '%', type: 'int', textAlign: 'center' },
            { content: 'Title', sorterCell: true, width: 25, unit: '%', type: 'str', textAlign: 'center' },
            { content: 'Artist', sorterCell: true, width: 25, unit: '%', type: 'str', textAlign: 'center' },
            { content: 'Album', sorterCell: true, width: 25, unit: '%', type: 'str', textAlign: 'center' },
            { content: 'duration', sorterCell: true, width: 8, unit: '%', type: 'str', textAlign: 'center' },
            { content: '&nbsp;', width: 4, unit: '%' },
            { content: '&nbsp;', width: 4, unit: '%' },
            { content: '&nbsp;', width: 4, unit: '%' }
        ];
        this.gridMaker.makeRowIdx(head, false, true, 0);
    }

    _getRowConfigFromTrack(track, index) {
        return [
            { 
                content: parseInt(index) + 1, 
                width: 5, 
                unit: '%', 
                type: 'int',
                customClass: 'cell-index',
                onClick: evt => evt.detail.HTMLItem.getParentItem().classToggleExclusive('selected', this.getParentCnt()) 
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
            {
                content: 'drag', draggable: true,
                onDragged: (evt) => {
                    this.draggedStartIndx = evt.detail.HTMLItem.getParentItem().getIndex();
                    evt.detail.HTMLItem.innerContent('Drop!!');
                },
                onDropped: (evt) => {
                    evt.stopImmediatePropagation();
                    const htmlItem = evt.detail.HTMLItem;
                    this.draggedEndIndx = htmlItem.getParentItem().getIndex();
                    this.events.trigger('onDraggedTrackDropped', htmlItem, this.queuelistGrid.isQueuePlaying, this.draggedStartIndx - 1, this.draggedEndIndx - 1);
                    htmlItem.innerContent('drag');
                },
                width: 4, unit: '%'
            }
        ];
    }

    _buildBody() {
        let index = 0;
        for (let track of TrackListManager.forEachTrack()) {
            this.addTrackToGrid({ index, track });
            index++;
        }
    }

    _displayTracklistInfo() {
        document.querySelector('.tracklist-info-cnt .tracklist-info-nb .nb-tracks').innerText = TrackListManager.getTracksNumber();
        document.querySelector('.tracklist-info-cnt .tracklist-info-duration .duration-tracks').innerText = TrackListManager.getTrackListTotalDuration(true);
    }

    _setCurrentTrack() {
        TrackListManager.triggerGridRefresh();
    }

    onDraggedTrackDropped(cb, subscriber) {
        this.events.onEventRegister({cb, subscriber}, 'onDraggedTrackDropped');
    }

    onTrackArtistEditing(cb, subscriber) {
        this.events.onEventRegister({cb, subscriber}, 'onTrackArtistEditing');
    }

    onTrackAlbumEditing(cb, subscriber) {
        this.events.onEventRegister({cb, subscriber}, 'onTrackAlbumEditing');
    }
 }