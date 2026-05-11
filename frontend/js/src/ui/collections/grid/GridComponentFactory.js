import { Row, SortableRow } from '../../elements/Row.js';
import { Cell, SortableCell } from '../../elements/Cell.js';

export class GridComponentFactory {
    static createRow(isSortable, isHead) {
        return isSortable ? new SortableRow(isHead) : new Row(isHead);
    }

    static createCell(isSortable, isHead, config, sortCallback) {
        if (isSortable && isHead && config.sorterCell) {
            const cell = new SortableCell(config.type);
            cell.sortHandler(sortCallback);
            
            return cell;
        }
        return new Cell();
    }
}