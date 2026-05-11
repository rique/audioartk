import { ListEvents } from "../../../core/EventBus.js";
import { clearElementInnerHTML } from "../../../core/Utils.js";


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

export class IndexedColumn extends BaseColumn {
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
