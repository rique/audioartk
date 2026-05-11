import { TrackListManager } from "../../../domain/TrackList.js";
import { GridMaker } from "../../collections/grid/GridMaker.js";
import { HTMLItems } from "../../base/HTMLItem.js";
import { ListEvents } from "../../../core/EventBus.js";
import { TrackEditor } from "../../../domain/models/Track.js";

export class QueuelistGrid {
    constructor(parentGrid) {
        this.setUpHTMLItem();
        this.parentGrid = parentGrid;
        this.gridMaker = new GridMaker({parentCnt: this.itemHtml.render(), sortable: true, flex: true});
        this.gridMaker.setDraggable(true, true);
        TrackListManager.onAddedToQueue(this.updateQueue.bind(this), this);
        this.events = new ListEvents();
    }

    setUpHTMLItem() {
        this.itemHtml = new HTMLItems('div');
        this.itemHtml.setClassName('queue-list');
    }

    buildGrid(doRender) {
        this._buildBody();
        if (doRender) this.render();
    }

    render() {
        if (!this.hasQueue) return;
        
        if (this.isQueuePlaying) {
            // Highlighting logic for the queue's internal state
            const firstRow = this.gridMaker.getRowByIndex(0);
            if (firstRow) { 
                firstRow.classAdd('currently-playing');
                this.events.trigger('onQueueRendered', firstRow);
            }

        }
        
        this.gridMaker.render();
    }
    syncPosition(anchorRow) {
        this.siblingRow = anchorRow;
        if (!this.hasQueue) {
            this.itemHtml.remove();
            return;
        }
        // Use document.body.contains to ensure we are checking the live page
        const isVisibleInDOM = anchorRow && document.body.contains(anchorRow.render());
        // Validate the anchor provided by the mediator
        if (isVisibleInDOM) {
            this.itemHtml.show();
            this.itemHtml.insertItemAfter(anchorRow); 
            // Since we moved to a new spot, refresh internal track layout
            // this.render(); 
        } else {
            // If the mediator provided no valid row (e.g. during search), 
            // we safely park the element in our internal staging.
            this.itemHtml.stageElement();
        }

        this.setSiblingRow(anchorRow);
        this.render();
    }
    setSiblingRow(row) {
        if (!this.siblingRow || this.siblingRow != row)
            this.siblingRow = row;
    }
    getGrid() {
        return this.gridMaker.getGrid();
    }
    getParentCnt(getMine) {
        if (getMine)
            return this.getGrid().getParentCnt();
        return this.parentGrid.getParentCnt();
    }
    getRowByIndex(index) {
        return this.gridMaker.getRowByIndex(index);
    }
    updateQueueOld(track, queueLength) {
        this.queueLength = queueLength;
        if (!this.hasQueue && queueLength > 0) {
            this.hasQueue = true;
        }

        this.gridMaker.clearRows();
        if (this.isQueuePlaying) {
            this._buildBody();
            const row = this.getGrid().getRowByIndex(0);
            row.classAdd('currently-playing');
            return this.render();
        }

        this.buildGrid(true);
    }
    updateQueue(track, queueLength) {
        this.queueLength = queueLength;
        this.hasQueue = queueLength > 0;

        // Rebuild the internal rows (the "What")
        this._buildBody();

        // Ask the parent to fix the positioning (the "Where")
        // This handles the "Add to Queue" click scenario
        this.parentGrid._syncQueuePosition(true);
    }
    syncQueue(queueLength, forceNotPlaying = false) {
        this.queueLength = queueLength;
        
        if (queueLength >= 0) {
            this.isQueuePlaying = !forceNotPlaying;
            this.hasQueue = true;
            this.gridMaker.clearRows();
            this._buildBody();
            this.render();
        } else {
            this.deactivate();
        }
    }
    deactivate() {
        this.isQueuePlaying = false;
        this.hasQueue = false;
        this.itemHtml.remove();
        this.siblingRow = undefined;
        // Note: We NO LONGER call this.trackListBrowser.setGrid here.
        // The Mediator handles that switch globally.
    }
    _setSiblingRow() {
        if (this.siblingRow && document.body.contains(this.siblingRow.render()))
            return this.siblingRow;

        let currIdx = TrackListManager.getCurrentTrackIndex(!this.isQueuePlaying);
        if (currIdx < 0) {
            currIdx = 0;
        }

        this.setSiblingRow(this.parentGrid.getRowByIndex(currIdx));
        return this.siblingRow;
    }
    addTrackToGrid({track, index}) {
        const row = this._getCellsFromTrack(track, index);
        this.gridMaker.makeRowIdx(row, false, false, parseInt(index) + 1);
    }
    removeRowFromGrid(rowIdx) {
        this.gridMaker.removeRowFromGrid(rowIdx);
    }
    onQueueRendered(cb, subscriber) {
        this.events.onEventRegister({cb, subscriber}, 'onQueueRendered');
    }
    _getCellsFromTrack(track, index) {
        return [{
            content: `Q${parseInt(index) + 1}`,
            width: 5,
            unit: '%',
            customClass: 'cell-index',
            type: 'int',
        },{
            content: track.getTitle(),
            editable: true,
            onEdit: TrackEditor.onclickCell.bind(TrackEditor),
            onValidate: TrackEditor.onValidate.bind(TrackEditor),
            width: 25,
            unit: '%',
            type: 'str',
            searchable: true,
            data: {
                trackId: track.trackUUid,
                fieldType: 'title',
            }
        },{
            content: track.getArtist(),
            editable: true,
            onEdit: TrackEditor.onclickCell.bind(TrackEditor),
            onValidate: TrackEditor.onValidate.bind(TrackEditor),
            width: 25,
            unit: '%',
            type: 'str',
            searchable: true,
            data: {
                trackId: track.trackUUid,
                fieldType: 'artist',
            }
        },{
            content: track.getAlbum(),
            editable: true,
            onEdit: TrackEditor.onclickCell.bind(TrackEditor),
            onValidate: TrackEditor.onValidate.bind(TrackEditor),
            width: 25,
            unit: '%',
            type: 'str',
            searchable: true,
            data: {
                trackId: track.trackUUid,
                fieldType: 'album',
            }
        }, {
            content: track.getTrackDuration(true),
            width: 8,
            unit: '%',
            textAlign: 'center'
        }, {
            content: `<span data-track-id="${track.trackUUid}" class="track-actions"><li class="fa-solid fa-ellipsis"></li></span>`,
            width: 4,
            unit: '%',
            //onClick: this._trackListBrowser.showActionMenu.bind(this._trackListBrowser),
            data: {
                trackId: track.trackUUid
            }
        }, {
            content: '<div class="action-play"><li class="fa-solid fa-play"></li></div>',
            width: 4,
            unit: '%',
            // onClick: this._trackListBrowser.playSongFromTracklist.bind(this._trackListBrowser),
            textAlign: 'center',
        }, {
            onDragged: (evt) => {
                this.draggedStartIndx = evt.detail.HTMLItem.getParentItem().getIndex();
                evt.detail.HTMLItem.innerContent('Drop!!');
            },
            onDropped: (evt) => {
                evt.stopImmediatePropagation();
                const htmlItem = evt.detail.HTMLItem;
                this.draggedEndIndx = htmlItem.getParentItem().getIndex();
                TrackListManager.switchTrackIndex(this.draggedStartIndx - 1, this.draggedEndIndx - 1, this.isQueuePlaying, true);
                //this.render();
                htmlItem.innerContent('drag');
            },
            content: 'drag',
            draggable: true,
            width: 4,
            unit: '%'
        }];
    }
    _buildBody() {
        this.gridMaker.clearRows();
        // this.gridMaker.setDraggable(true, true);
        let addIdx = 0;
        if (this.isQueuePlaying) {
            const {track} = TrackListManager.getCurrentTrack();
            this.addTrackToGrid({track, index: 0});
            addIdx = 1;
        }
        for (let {index, track} of TrackListManager.forEachTrackInQueue()) {
            index += addIdx;
            this.addTrackToGrid({index, track});
        }
    }
}