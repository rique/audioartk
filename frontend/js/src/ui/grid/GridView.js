import { clearElementInnerHTML } from '../../core/Utils.js';
import { Cell, SortableCell, Row, SortableRow, HTMLItems } from './../../ui/grid/RowTemplates.js';
import { ListEvents } from '../../core/EventBus.js';
import DragitManager from '../interactions/DragDrop.js';
import { TrackEditor, TrackSearch, Track, ID3Tags } from '../../domain/models/Track.js';
import { TrackListManager } from '../../domain/TrackList.js';
import { Playlist } from '../../domain/models/Playlist.js';

/**
 * SECTION: Classes de Colonnes
 */

class BaseColumn {
    constructor() {
        this.cells = [];
    }

    addCell(cell) {
        this.cells.push(cell);
    }

    getCells() {
        return this.cells;
    }
}

class IndexedColumn extends BaseColumn {
    constructor() {
        super();
        this.columnIndex = 0;
        this.sortedCells = [];
        this.sortModes = {
            NONE: 0,
            ASC: 1,
            DESC: 2,
        };
        this._sortMode = this.sortModes.NONE;
    }

    findCellsByIndex() {
        return this.cells.filter(cell => cell.getIndex() == this.columnIndex);
    }

    setIndex(index) {
        this.columnIndex = index;
    }

    getIndex() {
        return this.columnIndex;
    }

    getCells() {
        if (this.isSorted()) return this.sortedCells;
        return this.cells;
    }

    sort() {
        this._updateSortMode();
        if (!this.isSorted()) {
            this.sortedCells = [];
            return this.cells;
        }
        this.sortedCells = this.getSortedColumnCell();
        return this.sortedCells;
    }

    getSortedColumnCell() {
        const reversed = this.isReversed();
        return [...this.cells].sort((c1, c2) => {
            if (c1.getParentItem().isHead()) return 0;
            const cnt1 = c1.innerContent();
            const cnt2 = c2.innerContent();
            if (cnt1 > cnt2) return reversed ? -1 : 1;
            if (cnt1 < cnt2) return reversed ? 1 : -1;
            return 0;
        });
    }

    isReversed() {
        return this._sortMode == this.sortModes.DESC;
    }

    isSorted() {
        return this._sortMode > this.sortModes.NONE;
    }

    _updateSortMode() {
        if (this._sortMode == this.sortModes.DESC)
            this._sortMode = this.sortModes.NONE;
        else
            this._sortMode++;
    }
}

/**
 * SECTION: Classes de Grille (Base, Recherche, Tri)
 */

class BaseGrid {
    constructor(parentCnt) {
        this.rows = [];
        this.parentCnt = parentCnt;
        this.eventsList = new ListEvents();
        this.head = null;
    }

    getRows() { return this.rows; }
    getRowByIndex(index) { return this.rows[index]; }
    setHead(row) { this.head = row; }
    addRow(row) { this.rows.push(row); }
    length() { return this.rows.length; }
    getParentCnt() { return this.parentCnt; }

    clear() { this.rows = []; }

    removeRow(index) {
        const row = this.rows.splice(index, 1)[0];
        row.remove();
        this.updateRowIndexFromIndex(index);
    }

    updateRowIndexFromIndex(index) {
        for (let i = index; i < this.rows.length; ++i) {
            let row = this.rows[i];
            let rowIdx = i + 1;
            row.setIndex(rowIdx);
            row.data('index', rowIdx);
        }
    }

    open() { this.parentCnt.style.display = 'block'; }
    close() { this.parentCnt.style.display = 'none'; }

    render() {
        clearElementInnerHTML(this.parentCnt);
        if (this.head) this.parentCnt.append(this.head.render());
        this.rows.forEach(row => this.parentCnt.append(row.render()));
    }
}

class SearchableGrid extends BaseGrid {
    search(term, cb) {
        cb = cb || this._doSearch.bind(this);
        this.filteredRows = this.rows.filter((r) => cb(r, term));
        this.eventsList.trigger('onSearchResult');
        this.render();
    }

    clearSearch() {
        this.filteredRows = [];
        this.eventsList.trigger('onSearchResult');
        return this;
    }

    onSearchResult(cb, subscriber) {
        this.eventsList.onEventRegister({ cb, subscriber }, 'onSearchResult');
    }

    render() {
        clearElementInnerHTML(this.parentCnt);
        if (this.head) this.parentCnt.append(this.head.render());
        
        let rows = (this.filteredRows && this.filteredRows.length > 0) 
            ? this.filteredRows 
            : this.rows;
        
        rows.forEach(row => this.parentCnt.append(row.render()));
    }

    _doSearch(row, term) {
        term = term.toLowerCase();
        const cells = row.getSearchableCells();
        return cells.some(cell => cell.innerContent().toLowerCase().includes(term));
    }
}

class SortableGrid extends SearchableGrid {
    constructor(parentCnt) {
        super(parentCnt);
        this.indexedColumns = {};
        this.onSearchResult(this._checkResult.bind(this), this);
    }

    addRow(row) {
        row.setGrid(this);
        row.onIndexUpdate(this.reindexGrid.bind(this), this);
        super.addRow(row);
    }

    getColumnByIndex(colIndex) {
        if (!this.indexedColumns.hasOwnProperty(colIndex)) {
            const column = new IndexedColumn();
            for (let row of this.rows) {
                if (this.head && row.isHead()) continue;
                column.addCell(row.getCellByIndex(colIndex));
            }
            column.setIndex(colIndex);
            this.indexedColumns[colIndex] = column;
        }
        return this.indexedColumns[colIndex];
    }

    sortGridByColumnIndex(colIndex) {
        const indexedColumn = this.getColumnByIndex(colIndex);
        this.rows = [];
        const sortedCells = indexedColumn.sort();
        
        sortedCells.forEach(cell => this.rows.push(cell.getParentItem()));
        this.eventsList.trigger('onSortedGrid', indexedColumn.isSorted(), indexedColumn.isReversed());
        this.render();
    }

    sortGridByCell(cell) {
        cell.sort();
        const colIndex = cell.getIndex();
        const reversed = cell.isReversed();
        const isSorted = cell.isSorted();

        if (isSorted) {
            this._sortGrid(colIndex, reversed);
        } else {
            this.filteredRows = [];
        }
        this.render();
        this.eventsList.trigger('onSortedGrid', isSorted, reversed);
    }

    onSortedGrid(cb, subscriber) {
        this.eventsList.onEventRegister({ cb, subscriber }, 'onSortedGrid');
    }

    reindexGrid(newIdx, oldIdx, row) {
        this.rows.splice((oldIdx - 1), 1);
        
        this.rows.forEach(r => {
            let idx = r.getIndex();
            if (oldIdx > newIdx && oldIdx > idx && idx >= newIdx) {
                r.setIndex(idx + 1);
            } else if (newIdx > oldIdx && newIdx >= idx && idx > oldIdx) {
                r.setIndex(idx - 1);
            }
        });
        
        this.rows.splice((newIdx - 1), 0, row);
        Object.keys(this.indexedColumns).forEach(colIndex => {
            this.indexedColumns[colIndex] = this.getColumnByIndex(colIndex);
        });
        this.render();
    }

    _sortGrid(colIndex, reversed) {
        const type = this.head.getCellByIndex(colIndex).getType();
        this.filteredRows = [...this.rows].sort((row1, row2) => {
            if (row1.isHead()) return 0;
            let cnt1 = row1.getCellByIndex(colIndex).innerContent();
            let cnt2 = row2.getCellByIndex(colIndex).innerContent();

            if (type === 'int') {
                cnt1 = parseInt(cnt1);
                cnt2 = parseInt(cnt2);
            }

            if (cnt1 > cnt2) return reversed ? -1 : 1;
            if (cnt1 < cnt2) return reversed ? 1 : -1;
            return 0;
        });
    }

    _checkResult() {
        if (this.filteredRows.length == 0 && this.head) {
            this.head.clearSortedCells();
        }
    }
}

/**
 * SECTION: GridMaker & Vues Spécifiques (Tracklist, Queue)
 */

class GridMaker {
    constructor(parentCnt, sortable, searchable) {
        this.rows = [];
        this.sortable = sortable;
        this.searchable = searchable;
        this.grid = sortable ? new SortableGrid(parentCnt) : new BaseGrid(parentCnt);
        
        if (sortable) {
            this.grid.onSortedGrid(this._onSortedGrid.bind(this));
        }

        // Empêcher le défilement lors de l'appui sur Espace si la grille a le focus
        window.addEventListener('keydown', (evt) => {
            if (evt.key === ' ' && evt.target === parentCnt) {
                evt.preventDefault();
            }
        });
    }

    setRows(rows) {
        rows.forEach((rowData, i) => this.makeRowIdx(rowData, true, false, i));
    }

    addRow(row) { this.rows.push(this.buildRow(row)); }
    clearRows() { this.grid.clear(); }
    resetDragDrop() { this._unsetDraggableGrid(); this._setDraggableGrid(); }
    getRowByIndex(index) { return this.grid.getRowByIndex(index); }
    removeRowFromGrid(index) { this.grid.removeRow(index); }
    getGrid() { return this.grid; }
    setDraggable(draggable, byCell) { this.draggable = draggable; this.byCell = byCell; }
    isDraggable() { return this.draggable; }
    undragGrid() { this._unsetDraggableGrid(); }

    makeRowIdx(cells, autoWidth, head, idx) {
        let row = this.buildRow(cells, autoWidth, head);

        if (!this.byCell && !row.isHead()) row.setDraggable(this.draggable);
        if (this.sortable) row.setIndex(idx);
        
        if (row.isHead()) 
            this.grid.setHead(row);
        else 
            this.grid.addRow(row);
        
        return row;
    }

    buildRow(cells, autoWidth, head) {
        let row = this.sortable ? new SortableRow(head) : new Row(head);
        const nbCells = cells.length;
        let percentage;

        if (autoWidth) {
            let parentCnt = this.grid.getParentCnt();
            percentage = (parentCnt.clientWidth / nbCells) / (parentCnt.clientWidth / 100);
        }

        cells.forEach(c => {
            let cell;
            if (this.sortable && row.isHead() && c.sorterCell) {
                cell = new SortableCell(c.type);
                cell.addEventListener('click', this.grid.sortGridByCell.bind(this.grid, cell));
            } else {
                cell = new Cell();
            }
            
            if (c.hasOwnProperty('width')) cell.width(c.width, c.unit);
            else if (autoWidth) cell.width(percentage, '%');

            if (c.hasOwnProperty('height')) cell.height(c.height, c.unit);
            if (c.editable) cell.setEditable(c.editable, c.onEdit, c.onValidate);
            
            if (c.draggable && this.byCell && !row.isHead()) {
                cell.setDraggable(c.draggable);
                cell.onDragged(c.onDragged);
                cell.onDropped(c.onDropped);
            }
            
            if (c.onClick) cell.onClick(c.onClick);
            if (c.onInput) cell.onInput(c.onInput);
            if (typeof c.data === 'object') {
                Object.keys(c.data).forEach(k => cell.data(k, c.data[k]));
            }

            cell.innerContent(c.content);
            cell.setSearchable(c.searchable);
            if (c.textAlign) cell.textAlign(c.textAlign);
            if (c.customClass) cell.classAdd(c.customClass);
            cell.setParentItem(row);
            row.addCell(cell);
        });

        return row;
    }

    render() {
        this.grid.render();
        if (this.isDraggable()) this._setDraggableGrid();
    }

    reload() {
        if (this.isDraggable()) this._unsetDraggableGrid();
        this.render();
    }

    open() { this.grid.open(); }
    close() { this.grid.close(); }

    getDraggableRows() {
        return this.grid.getRows().filter(r => r.isDraggable());
    }

    getDraggableCells() {
        const cells = [];
        this.grid.getRows().forEach(row => {
            cells.push(...row.getCells().filter(c => c.isDraggable()));
        });
        return cells;
    }

    _onSortedGrid(isSorted) {
        isSorted ? this._unsetDraggableGrid() : this._setDraggableGrid();
    }

    _setDraggableGrid() {
        this.dragitManager = new DragitManager();
        if (!this.byCell) this.dragitManager.activate(this.getDraggableRows());
        else this.dragitManager.activate(this.getDraggableCells(), true);
    }

    _unsetDraggableGrid() {
        if (!this.dragitManager) return;
        this.dragitManager.deactivate();
        this.dragitManager = null;
    }
}

class TracklistGrid {
    constructor(selector = '#table-content', audioPlayer, trackListBrowser) {
        this.gridMaker = new GridMaker(document.querySelector(selector), true);
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
            { content: track.getTrackDuration(true), width: 8, unit: '%' },
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
                    TrackListManager.switchTrackIndex(this.draggedStartIndx - 1, this.draggedEndIndx - 1);
                    this._syncQueuePosition();
                    this.events.trigger('onDraggedTrackDropped', htmlItem);
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

class QueuelistGrid {
    constructor(parentGrid) {
        this.setUpHTMLItem();
        this.parentGrid = parentGrid;
        this.gridMaker = new GridMaker(this.itemHtml.render(), true);
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

        // 1. Get the current, LIVE element from the wrapper
        // const currentContainer = this.itemHtml.render();

        // 2. IMPORTANT: Tell GridMaker this is the new target
        // If your GridMaker doesn't have a 'setContainer' method, 
        // you might need to update its internal reference manually:
        // this.gridMaker.container = currentContainer;
        
        // 3. Clear the LIVE container
        //currentContainer.innerHTML = '';
        
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
            unit: '%'
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
                TrackListManager.switchTrackIndex(this.draggedStartIndx - 1, this.draggedEndIndx - 1, true);
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

class Library {
    constructor() {
        this.tracks = {};
        this.nbTracks = 0;
        this.playlist = new Playlist('library');
    }

    async bootstrap(tracklist) {
        for (let i in tracklist) {
            let trackInfo = tracklist[i];
            let track = new Track(trackInfo['track']);
            let id3Tags = new ID3Tags(trackInfo['ID3']);

            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());
            track.setIndex(i);
            this.addTrack({ track, trackUUid: trackInfo.track['track_uuid'] });
        }
    }

    addTrack({ track, trackUUid }) {
        if (this.tracks.hasOwnProperty(trackUUid)) {
            return console.error(`track UUID '${trackUUid}' provided for track ${track} is already set.`);
        }
        this.tracks[trackUUid] = track;
        ++this.nbTracks;
        this.playlist.addTrack(track);
    }

    getTracks() { return this.tracks; }
    getTrackByUUID(trackUUid) { return this.tracks[trackUUid]; }

    *getTracksByUUIDList(UUIDList) {
        for (let trackUUid of UUIDList) {
            if (this.tracks.hasOwnProperty(trackUUid)) {
                yield this.tracks[trackUUid];
            }
        }
    }

    getNbTracks() { return this.nbTracks; }
    getPlaylist() { return this.playlist; }
}

// Instance unique pour la bibliothèque
const library = new Library();

export { TracklistGrid, library };
export default library;