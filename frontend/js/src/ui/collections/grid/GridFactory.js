import { BaseGrid } from './BaseGrid.js';
import { Searchable, Sortable, Flexible } from './GridMixins.js';

export class GridFactory {
    static create(options = {}) {
        let GridClass = BaseGrid;
    
        // Assembly only
        if (options.searchable) GridClass = Searchable(GridClass);
        if (options.sortable)   GridClass = Sortable(GridClass);
        if (options.flex)       GridClass = Flexible(GridClass);
        // Pass the WHOLE options object to the constructor
        return new GridClass(options);
    }
}