import { HTMLDraggableItems } from "../base/BehavioralItems.js";
import { EditInput } from "./Inputs.js";

export class Cell extends HTMLDraggableItems {
    constructor() {
        super('div');
        this.setupCell();
    }

    setupCell() {
        this.classAdd('cell');
        this.createCustomEvent('myClick');
        this.addEventListener('click', () => {
            this.dispatchEvent('myClick');
        });
    }

    setEditable(editable, onEdit, onValidate) {
        this.onEdit(onEdit, onValidate);
        this.classAdd('editable');
        this.editable = editable;
    }

    isEditable() {
        return this.editable;
    }

    onEdit(onEdit, onValidate) {
        this.onClick(evt => this._edit(evt, onEdit, onValidate));
    }

    onClick(cb) {
        this.addEventListener('myClick', cb);
    }

    onInput(cb) {
        this.onInputCb = cb;
    }

    setSearchable(searchable) {
        this.searchable = searchable;
    }

    isSearchable() {
        return this.searchable;
    }

    textAlign(textAlign) {
        this.css({ textAlign });
    }

    toObject() {
        return {
            element: this.render(),
            innerContent: this.innerContent(),
            index: this.getIndex(),
        }
    }

    _edit(evt, onEdit, onValidate) {
        if (this.isEditing)
            return;

        this.isEditing = true;
        this.input = new EditInput();
        if (this.onInputCb) this.input.onInput(this.onInputCb);
        this.hidden = new EditInput();
        this.input.hidden(false);
        this.hidden.hidden(true);
        this.input.onBlur(evt => this._validate(evt, onValidate));
        this.input.addEventListener('keydown', evt => evt.key === 'Enter' && this._validate(evt, onValidate));

        this.input.value(this.innerContent());
        this.hidden.value(this.innerContent());
        this.innerContent('');
        this.append(this.input, this.hidden);
        this.input.focus();
        this.input.select();
        onEdit(evt);
    }

    _validate(evt, cb) {
        if (!this.isEditing)
            return;

        cb(evt, this, this.input.value(), this.hidden.value());
        this.isEditing = false;
    }
}

export class SortableCell extends Cell {
    constructor(type) {
        super();
        this.sorted = false;
        this.reversed = false;
        this.sortModes = {
            NONE: 0,
            ASC: 1,
            DESC: 2,
        }
        this._sortMode = this.sortModes.NONE;
        this._type = type;
        this.onSortedCell(this.switchSortedClass.bind(this), this);
    }

    getType() {
        return this._type;
    }

    setType(type) {
        this._type = type;
    }

    setupCell() {
        this.classAdd('sortable');
        super.setupCell();
    }

    isReversed() {
        return this._sortMode == this.sortModes.DESC;
    }

    isSorted() {
        return this._sortMode > this.sortModes.NONE;
    }

    sort() {
        this._updateSortMode();
        this.eventsList.trigger('onSortedCell', this);
    }

    sortHandler(cb) {
        if (!cb) return;
        this.addEventListener('click', cb);
    }

    reset() {
        this._sortMode = this.sortModes.NONE;
        this.eventsList.trigger('onSortedCell', this);
    }

    onSortedCell(cb, subscriber) {
        this.eventsList.onEventRegister({ cb, subscriber }, 'onSortedCell');
    }

    switchSortedClass(cell) {
        switch (cell._sortMode) {
            case this.sortModes.NONE:
                cell.classRemove('sorted');
                break;
            case this.sortModes.ASC:
            case this.sortModes.DESC:
                cell.getParentItem().clearSortedCells();
                cell.classAdd('sorted');
                break;
        }
    }

    toObject() {
        const cellData = {
            sorted: this.sorted,
            reversed: this.reversed,
            index: this.getIndex(),
            sortMode: this._sortMode,
        }
        return { ...super.toObject(), ...cellData }
    }

    _updateSortMode() {
        if (this._sortMode == this.sortModes.DESC)
            this._sortMode = this.sortModes.NONE;
        else
            this._sortMode++;
    }
}