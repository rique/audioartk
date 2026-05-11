import { clearElementInnerHTML } from "../../../core/Utils.js";

export const Searchable = (Base) => class extends Base {
    constructor(options) {
        super(options);
        this.indexedColumns = {};
    }
    search(term, cb) {
        this.filteredRows = this.rows.filter(r => (cb || this._doSearch)(r, term));
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
        return row.getSearchableCells().some(c => 
            c.innerContent().toLowerCase().includes(term.toLowerCase())
        );
    }
};

export const Sortable = (Base) => class extends Base {
    constructor(options) {
        super(options); 

        this.indexedColumns = {};
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
            let cnt1 = row1.getCellByIndex(colIndex)?.innerContent();
            let cnt2 = row2.getCellByIndex(colIndex)?.innerContent();

            if (!cnt1 || !cnt2) return 0;

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
};

export const Flexible = (Base) => class extends Base {
    open() {
        super.open();
        this.parentCnt.style.display = 'flex';
        this.parentCnt.style.flexDirection = 'column';
    }
}