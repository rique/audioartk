import { ListEvents } from "../../../core/EventBus.js";
import { clearElementInnerHTML } from "../../../core/Utils.js";

export class BaseGrid {
    constructor(options) {
        if (!options || !options.parentCnt) {
            throw new Error("Invalid options for BaseGrid");
        }
        this.rows = [];
        this.parentCnt = options.parentCnt;
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