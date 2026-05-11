import DragitManager from "../../interactions/DragDrop.js";
import { GridFactory } from "./GridFactory.js";
import { SortableRow, Row } from "../../elements/Row.js";
import { SortableCell, Cell } from "../../elements/Cell.js";
import { GridComponentFactory } from "./GridComponentFactory.js";

export class GridMaker {
    constructor({parentCnt, sortable, searchable, flex}) {
        this.rows = [];
        this.sortable = sortable;
        this.searchable = searchable;
        this.grid = GridFactory.create({parentCnt, sortable, searchable, flex});

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
        let row = GridComponentFactory.createRow(this.sortable, head);//this.sortable ? new SortableRow(head) : new Row(head);
        const nbCells = cells.length;
        let percentage;

        if (autoWidth) {
            let parentCnt = this.grid.getParentCnt();
            percentage = (parentCnt.clientWidth / nbCells) / (parentCnt.clientWidth / 100);
        }

        cells.forEach(c => {
            let cell = GridComponentFactory.createCell(this.sortable, head, c, this.grid.sortGridByCell.bind(this.grid));
            
            row.addCell(cell);
            
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
        this.dragitManager = new DragitManager([], document.querySelector('.cnt-overlay'));
        if (!this.byCell) this.dragitManager.activate(this.getDraggableRows());
        else this.dragitManager.activate(this.getDraggableCells(), true);
    }

    _unsetDraggableGrid() {
        if (!this.dragitManager) return;
        this.dragitManager.deactivate();
        this.dragitManager = null;
    }
}