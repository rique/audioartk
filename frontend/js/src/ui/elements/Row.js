import { HTMLDraggableItems } from "../base/BehavioralItems.js";

export class Row extends HTMLDraggableItems {
    constructor(head) {
        super('div');
        this.cells = [];
        this._isHead = head;
        this.setupRow();
    }

    setupRow() {
        let className;
        if (this._isHead)
            className = 'head';
        else
            className = 'lonely';
        this.element.classList.add('row', className, 'dropped');
    }

    setGrid(grid) {
        this.grid = grid;
    }

    getGrid() {
        return this.grid;
    }

    addCell(cell) {
        cell.setParentItem(this);
        this.cells.push(cell);
    }

    isHead() {
        return this._isHead;
    }

    render(getReal) {
        if (!this.applied || this.cells.length == 0)
            this.appendCells();
        return super.render(getReal);
    }

    resetIndex() {

    }

    appendCells() {
        this.applied = true;
        this.append(...this.cells);
    }

    getCells() {
        return this.cells;
    }

    getSearchableCells() {
        return this.cells.filter(c => c.isSearchable());
    }

    toObject() {
        const cellList = [];
        for (let i = 0; i < this.cells.length; ++i) {
            cellList.push(this.cells[i].toObject())
        }

        return { isHead: !!this._isHead, cellList };
    }

    *[Symbol.iterator]() {
        yield* this.cells;
    }
}

export class SortableRow extends Row {
    constructor(head) {
        super(head);
    }

    getCellByIndex(cellIndx) {
        return this.cells[cellIndx];
    }

    addCell(cell) {
        cell.setIndex(this.cells.length);
        super.addCell(cell);
    }

    clearSortedCells() {
        this.cells.forEach(cell => cell.classRemove('sorted'));
    }
}