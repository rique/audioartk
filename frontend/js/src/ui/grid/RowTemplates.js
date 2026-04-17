import { ListEvents } from '../../core/EventBus.js';
import { getLastParent, clearElementInnerHTML, calculateBarLayout } from '../../core/Utils.js';
import { TracklistNotifier, FileBrowserNotifier } from '../Notifier.js'
import { TrackListManager } from '../../domain/TrackList.js'
import { Track, ID3Tags } from '../../domain/models/Track.js';
import Api from '../../core/HttpClient.js';

/** * SECTION 1: DOM HELPERS 
 */
const getOffsetLeft = (elem) => {
    let offset = 0;
    while (elem.parentElement) {
        offset += elem.parentElement.offsetLeft;
        elem = elem.parentElement;
    }
    return offset;
};
const getOffsetTop = (elem) => elem.getBoundingClientRect().top;
const getOffsetBottom = (elem) => elem.getBoundingClientRect().bottom;

/** * SECTION 2: BASE CLASSES 
 */
export class HTMLItems {
    constructor(elementName) {
        this.element = document.createElement(elementName);
        this.events = {};
        this.eventsHandler = {};
    }

    render(getReal) {
        return this.seekParent && !getReal ? this.getParent() : this.element;
    }

    setSeekParent() {
        this.seekParent = true;
    }

    unsetSeekParent() {
        this.seekParent = false;
    }

    getParent() {
        return this.element.parentElement;
    }

    offsetParent() {
        return this.render().offsetParent;
    }

    setParentItem(htmlItem) {
        this.parentItem = htmlItem;
    }

    getParentItem() {
        return this.parentItem;
    }

    isElementContained() {
        return document.body.contains(this.render());
    }

    isChildOf(item) {
        const parentEl = item.render();
        const childEl = this.render();
        return parentEl !== childEl && parentEl.contains(childEl);
    }

    stageElement() {
        const el = this.render();
        if (!document.body.contains(el)) {
            el.style.display = 'none';
            document.body.appendChild(el);
            this._isStaged = true;
        }
    }

    unstageElement() {
        if (this._isStaged) {
            const el = this.render();
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
            this._isStaged = false;
        }
    }
    // FIXME: Change to isStaged
    isTaged() {
        return !!this._isStaged;
    }

    id(id) {
        if (!id) {
            return this.render().id;
        }
        this.render().id = id;
        return this;
    }

    width(w, unit) {
        if (typeof w === 'number') {
            w = w.toString() + '' + unit;
            this.css({ width: w });
            return this;
        } else {
            return this.render().style.width;
        }
    }

    height(height, unit) {
        if (typeof height === 'number') {
            this.render().style.height = `${height}${unit}`;
            return this;
        } else {
            return this.render().style.height;
        }
    }

    left(left, unit) {
        if (typeof left === 'number') {
            this.render().style.left = `${left}${unit}`;
            return this;
        } else {
            return this.render().style.left;
        }
    }

    top(top, unit) {
        if (typeof top === 'number') {
            this.render().style.top = `${top}${unit}`;
            return this;
        } else {
            return this.render().style.top;
        }
    }

    offsetTop(doMargin) {
        let margin = 0;
        if (doMargin) {
            return getOffsetTop(this.render());
        }
        return this.render().offsetTop + margin;
    }

    offsetLeft(doMargin) {
        let margin = 0;
        if (doMargin) {
            margin = getOffsetLeft(this.render());
        }
        return this.render().offsetLeft + margin;
    }

    offsetRight(doMargin) {
        let margin = 0;
        if (doMargin) {
            margin = getOffsetLeft(this.render());
        }
        return this.render().offsetLeft + this.render().offsetWidth + margin;
    }

    offsetBottom(doMargin, depth) {
        let margin = 0;
        if (doMargin) {
            return getOffsetBottom(this.render(), depth);
        }
        return this.render().offsetTop + this.render().offsetHeight + margin;
    }

    offsetWidth() {
        return this.render().offsetWidth;
    }

    offsetHeight() {
        return this.render().offsetHeight;
    }

    setLeftTop(left, top) {
        this.render().style.left = `${left}px`;
        this.render().style.top = `${top}px`;
    }

    scrollTop(parentElem) {
        parentElem = parentElem || getLastParent(this.render(), 0);
        return parentElem.scrollTop;
    }

    scrollLeft(parentElem) {
        parentElem = parentElem || getLastParent(this.render(), 0);
        return parentElem.scrollLeft;
    }

    scrollTo(parentElem) {
        parentElem = parentElem || getLastParent(this.render(), 0);
        const scrollToValue = this.offsetTop() - this.offsetHeight();
        setTimeout(() => {
            parentElem.scrollTo({
                behavior: 'smooth',
                left: 0,
                top: scrollToValue,
            });
        }, 0);
    }

    attribute(name, value) {
        if (typeof value !== 'undefined') {
            this.render().setAttribute(name, value);
            return this;
        } else {
            return this.render().getAttribute(name);
        }
    }

    innerContent(content) {
        if (typeof content !== 'undefined') {
            this.render(true).innerHTML = content;
            return this;
        } else {
            return this.render(true).innerHTML;
        }
    }

    append(...elements) {
        this.render().append(...elements.map(el => el.render()));
        return this;
    }

    remove() {
        this.render().remove();
        return this;
    }

    show() {
        this.css({ display: 'block' }, true);
        return this;
    }

    hide() {
        this.css({ display: 'none' }, true);
        return this;
    }

    hasClass(className) {
        return this.render().classList.contains(className);
    }

    classAdd(className) {
        this.render().classList.add(className);
        return this;
    }

    classRemove(className) {
        this.render().classList.remove(className);
        return this;
    }

    classReplace(className, replaceWith) {
        this.render().classList.replace(className, replaceWith);
        return this;
    }

    classToggle(className) {
        this.render().classList.toggle(className);
        return this;
    }

    classToggleExclusive(className, fromParent = document) {
        fromParent.querySelectorAll(`.${className}`).forEach(el => {
            if (el !== this.render()) el.classList.remove(className);
        });
        return this.classToggle(className);
    }

    setClassName(className) {
        this.render().className = className;
        return this;
    }

    getClassName() {
        return this.render().className;
    }

    css(style, replace) {
        style = style || {};
        Object.assign(this.render().style, style);
    }

    data(name, value) {
        const isName = typeof name !== 'undefined';
        const isValue = typeof value !== 'undefined';
        if (isName && isValue) {
            this.render().dataset[name] = value;
        } else if (isName) {
            return this.render().dataset[name];
        } else {
            return this.render().dataset;
        }
    }

    setSelectionRange(start, end) {
        this.render().setSelectionRange(start, end);
    }

    insertItemAfter(htmlItem) {
        const targetNode = htmlItem.render();
        const myNode = this.render();
        targetNode.insertAdjacentElement('afterend', myNode);
        this._isStaged = false;
    }

    addEventListener(evtName, cb) {
        if (!this.eventsHandler.hasOwnProperty(evtName)) {
            this.eventsHandler[evtName] = [];
        }
        this.eventsHandler[evtName].push({
            node: this,
            evtName,
            cb
        });
        this.render().addEventListener(evtName, cb, false);
    }

    removeEventListener(evtName, cb) {
        this.render().removeEventListener(evtName, cb);
    }

    clearAllEvents() {
        Object.keys(this.eventsHandler).forEach(evtName => {
            this.eventsHandler[evtName].forEach(handlerObj => {
                this.render().removeEventListener(evtName, handlerObj.cb);
            });
        });
        this.eventsHandler = {};
    }

    createCustomEvent(evtName, options) {
        if (this.events.hasOwnProperty(evtName)) {
            return console.error(`Event ${evtName} already set`);
        }
        options = options || { detail: { HTMLItem: this }, bubbles: false };
        this.events[evtName] = new CustomEvent(evtName, options);
    }

    dispatchEvent(evtName) {
        if (!this.events.hasOwnProperty(evtName)) {
            return console.error(`Unknown event name ${evtName}`);
        }
        this.render().dispatchEvent(this.events[evtName]);
    }
}

class HTMLIndexedItems extends HTMLItems {
    constructor(elementName) {
        super(elementName);
        this.index = 0;
        this.eventsList = new ListEvents(); // Assumes ListEvents is defined globally
    }

    setIndex(index) {
        if (this.index === index) return;
        this.index = index;
        this.data('index', index);
    }

    updateIndex(newIndex) {
        const oldIndex = this.index;
        this.setIndex(newIndex);
        this.eventsList.trigger('onIndexUpdate', newIndex, oldIndex, this);
    }

    getIndex() {
        return this.index;
    }

    onIndexUpdate(cb, subscriber) {
        this.eventsList.onEventRegister({ cb, subscriber }, 'onIndexUpdate');
    }

    // Overrides HTMLItems.insertItemAfter
    insertItemAfter(htmlItem) {
        let htmlItemIndex = htmlItem.getIndex();
        if (this.index > htmlItemIndex) {
            htmlItemIndex++;
        }
        this.updateIndex(htmlItemIndex);
        htmlItem.render().insertAdjacentElement('afterend', this.render());
    }
}

/** * SECTION 3: SPECIALIZED ITEMS 
 */


/**
 * SECTION: DRAGGABLE & ANIMATION
 */

export class HTMLDraggableItems extends HTMLIndexedItems {
    constructor(elementName) {
        super(elementName);
        this._setupEvents();
    }

    toggleHovered() {
        let target = this;
        this.seekParent = true;
        if (this.seekParent && typeof this.getParentItem === 'function') {
            target = this.getParentItem();
        }
        
        target.classToggle('hovered');
    }

    setDraggable(draggable) {
        if (draggable)
            this.classAdd('draggable');
        else
            this.classRemove('draggable');
        this.draggable = draggable;
    }

    isDraggable() {
        return this.draggable;
    }

    onDragged(cb) {
        this.addEventListener('dragged', cb);
    }

    onDropped(cb) {
        this.addEventListener('dropped', cb);
    }

    init(seekParent) {
        if (!this.element)
            return false;

        if (seekParent)
            this.setSeekParent();

        this.css({
            position: 'absolute',
            left: `${this.offsetLeft()}px`,
            top: `${this.offsetTop()}px`,
            zIndex: 100,
        });

        this.render().classList.replace('dropped', 'dragged');

        return true;
    }

    reset() {
        this.css({
            position: 'static',
        });

        const droppedAnimation = new DroppedAnimation(this.render());

        droppedAnimation.start(790, (element) => {
            element.classList.replace('dragged', 'dropped');
        });

        if (this.seekParent)
            this.unsetSeekParent();
    }

    dispatchEvent(evtName) {
        if (!this.events.hasOwnProperty(evtName))
            return console.error(`Unknown event name ${evtName}`);

        this.render(true).dispatchEvent(this.events[evtName]);
    }

    _setupEvents() {
        this.createCustomEvent('dragged');
        this.createCustomEvent('dropped');
    }
}

export class DroppedAnimation {
    constructor(element) {
        this.element = element;
    }

    start(timeout, onFinish) {
        timeout = timeout || 1000;
        const animation = this._setupDroppedAnimation(this.element, timeout);
        animation.onfinish = () => {
            if (typeof onFinish == 'function')
                onFinish(this.element);
        };

        animation.play();
    }

    _setupDroppedAnimation(element, timeout) {
        let elementBGColor = element.style.background;

        if (!elementBGColor) {
            let computedStyle = window.getComputedStyle(element);
            elementBGColor = computedStyle.getPropertyValue('background-color')
            if (!elementBGColor)
                elementBGColor = computedStyle.getPropertyValue('background');
            if (!elementBGColor)
                elementBGColor = 'inherit';
        }

        const keyFrames = [
            { background: elementBGColor, fontSize: '0.25em' },
            { background: '#e5fce8', fontSize: '0.25em' },
            { background: '#e5fce8', fontSize: '0.25em' },
            { background: elementBGColor, fontSize: '0.27em' },
            { fontSize: '0.3em' }
        ];

        const kfEffect = new KeyframeEffect(element, keyFrames, {
            duration: timeout,
        });

        return new Animation(kfEffect, document.timeline);
    }
}

class SVGItem extends HTMLItems {
    constructor(shape, svgNamespace = 'http://www.w3.org/2000/svg') {
        super(shape);
        this.element = document.createElementNS(svgNamespace, shape);
        // this.attribute('xmlns', this.svgNamespace);
    }
}

class ShapeSVGItem extends SVGItem {
    constructor(shape) {
        super(shape);
    }

    shapeWidth(value) {
        return this.attribute('width', value);
    }

    shapeHeight(value) {
        return this.attribute('height', value);
    }

    x(x) {
        return this.attribute('x', x);
    }

    y(y) {
        return this.attribute('y', y);
    }
}

class MAINSVGItem extends ShapeSVGItem {
    constructor() {
        super('svg');
    }
}

class RectSVGItem extends ShapeSVGItem {
    constructor() {
        super('rect');
    }
}

class NowPlayingSVGComponent {
    constructor() {
        this.SVGItem = new MAINSVGItem();
        this.initComponent();
    }

    initComponent() {
        console.log('setting svg element');
        this.SVGItem.id('now-playing-svg');
        this.SVGItem.shapeWidth(18)
                .shapeHeight(18)
                .attribute('viewBox', '0 0 18 18'); //  min-x, min-y, width, heigh
        
        const rectConfig = {
            totalWidth: 18, 
            totalHeight: 18, 
            nBars: 3, 
            padding: 1, 
            gap: 2, 
            maxHeight: 15 
        }

        const rects = calculateBarLayout(rectConfig).map((layout, i) => {
            return new RectSVGItem().x(layout.x)
                .y(layout.y)
                .shapeWidth(layout.width)
                .shapeHeight(layout.height)
                .classAdd('bar')
                .classAdd(`bar${i + 1}`);
        });
        
        this.SVGItem.append(...rects);
    }

    appendTo(htmlItem) {
        htmlItem.append(this.SVGItem);
    }

    remove() {
        this.SVGItem.remove();
    }
}


/**
 * SECTION: INPUTS
 */

export class EditInput extends HTMLItems {
    constructor() {
        super('input');
        this.render().setAttribute('type', 'text');
        this.createCustomEvent('myInput')
        this.addEventListener('input', () => {            
            this.dispatchEvent('myInput');
        });
    }

    hidden(hidden) {
        if (hidden) {
            this.isHidden = true;
            this.render().setAttribute('type', 'hidden');
        } else {
            this.isHidden = false;
            this.render().setAttribute('type', 'text');
        }
    }

    onInput(cb) {
        this.addEventListener('myInput', cb);
    }

    value(value) {
        if (value)
            this.render().value = value;
        else
            return this.render().value;
    }

    blur() {
        this.render().blur();
    }

    focus() {
        this.render().focus();
    }

    select() {
        this.render().select();
    }

    onBlur(cb) {
        this.addEventListener('blur', cb);
    }

    onFocus(cb) {
        this.addEventListener('focus', cb);
    }
}

/**
 * SECTION: GRID CELLS
 */

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

/**
 * SECTION: GRID ROWS
 */

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

export const Layout = function(parentElem, layoutName) {
        this.parentElem = parentElem;
        this.layoutName = layoutName;
};
Layout.prototype = {
    setParntElem(parentElem) {
        this.parentElem = parentElem;
    },
    getParentElem() {
        return this.parentElem;
    },
    setLayoutName(layoutName) {
        this.layoutName = layoutName;
    },
    getLayoutName() {
        return this.layoutName;
    },
    registerRenderCallback(cb) {
        this.renderCallback = cb; 
    },
    render() {
        this.renderCallback(this.parentElem);
    }
};

export const LeftMenu = function() {
    this.menuComponents = {};
};
LeftMenu.prototype = {
    init() {
        this.mainMenuElem = document.getElementById('main-left-menu');
        this.openMenuElem = document.getElementById('open-menu');
        this.leftMenuElement = document.getElementById('left-menu');
        this.openMenuElem.addEventListener('click', this.openClose.bind(this));
    },
    openClose() {
        if (this.mainMenuElem.classList.contains('is-open')) {
            this.close();
        } else {
            this.open();
        }
        this.mainMenuElem.classList.toggle('is-open');
    },
    open() {
        let maxRight = 0 - 1;
        let start = - (this.leftMenuElement.offsetWidth);
        let step = 30;
        this._slide.bind(this)(start, maxRight, step, this.mainMenuElem, 'right');
    },
    close() {
        let maxRight = - (this.leftMenuElement.offsetWidth) + 1;
        let start = 0;
        let step = -30;
        this._slide.bind(this)(start, maxRight, step, this.mainMenuElem, 'left');
    },
    addMenuComponent(component, section) {
        if (!this.menuComponents.hasOwnProperty(section))
            this.menuComponents[section] = [];
        this.menuComponents[section].push(component);
    },
    _slide(start, maxRight, step, mainMenuElem, direction) {
        direction = direction || 'right';
        if ((start <= maxRight && direction == 'right') || (start >= maxRight && direction == 'left')) {
            if ((start > maxRight && direction == 'right') || (start < maxRight && direction == 'left'))
                start = maxRight + 1;
            else
                start += step;
            mainMenuElem.style.right = `${start}px`;
            requestAnimationFrame(this._slide.bind(this, start, maxRight, step, mainMenuElem, direction))
        }
    },
};

const LayoutHTML = function() {
    this.layouts = {};
};
LayoutHTML.prototype = {
    addHTMLLayout(layout) {
        this.layouts[layout.layoutName] = layout;
    },
    renderLayout(layoutName) {
        this.layouts[layoutName].render();
    }
};

export const layoutHTML = new LayoutHTML();

export const FileBrowserRenderer = function(fileBrowser, layout) {
    this.fileBrowser = fileBrowser;
    this.layout = layout;
    this.layout.registerRenderCallback(this._render.bind(this));
    this._createElements();
};
FileBrowserRenderer.prototype = {
    _createElements() {
        this.divBasePath = document.createElement('div');
        this.ulFolderList = document.createElement('ul');
        this.ulFileList = document.createElement('ul');
    },
    _displayFileBroserLayout() {
        layoutHTML.renderLayout(this.layout.layoutName);
    },
    _render(parentElem) {
        clearElementInnerHTML(parentElem);
        parentElem.className = 'file-browser';
        
        this.divBasePath.classList.add('base-path');
        this.ulFolderList.classList.add('folder-list');
        this.ulFileList.classList.add('file-list');
        
        parentElem.appendChild(this.divBasePath);
        parentElem.appendChild(this.ulFolderList);
        parentElem.appendChild(this.ulFileList);

        this.fileBrowser.setElementBoxes(parentElem, this.divBasePath, this.ulFolderList, this.ulFileList);
    }
};


export const FileBrowser = function(layout) {
    this.baseDir = '/home/enrique/Music/';
    this.api = new Api();
    this.browseHistory = [{dir: this.baseDir, index: 0}];
    this.historyIndex = 0;
    this.layout = layout;
    this.folderBrowserEvent = new ListEvents();
    this._fileBrowserNotifications = FileBrowserNotifier;
};
FileBrowser.prototype = {
    close(evt) {
        if (evt && evt.target != evt.currentTarget)
            return;
        if (this.isOpen)
            this._closeFileBrowser();
    },
    setElementBoxes(fileExplorerBox, basePathBox, folderListBox, fileListBox) {
        this.fileExplorerBox = fileExplorerBox;
        this.basePathBox = basePathBox;
        this.folderListBox = folderListBox;
        this.fileListBox = fileListBox;
    },
    folderSelector(evt) {
        let target = evt.target;
        let selectedIndex = target.dataset.index;
        let folderName = target.dataset.name;
        console.log('foldername', folderName);
        
        if (folderName == '..') {
            let pathParts = this.baseDir.split('/').filter(p => p.length > 0);
            this.scrollToTarget = pathParts[pathParts.length - 1] + '/';
            let parts = this.baseDir.split('/').filter(Boolean);
            parts.pop();
            this.baseDir = '/' + parts.join('/') + '/';
        } else
            this.baseDir += folderName;

        clearElementInnerHTML(this.folderListBox);
        clearElementInnerHTML(this.fileListBox);
        this.historyIndex++;
        this.browseHistory.push({dir: this.baseDir, index: selectedIndex});
        this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this));
    },
    fileSelector(evt) {
        let target = evt.target;
        let fileName = target.dataset.name;
        console.log('fileName', fileName);
        this.api.addTrack(fileName, this.baseDir + fileName, (res) => {
            console.log('add Track', {res});
            let track = new Track(res['track']),
                id3Tags = new ID3Tags(res['ID3']);
            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());
            TrackListManager.addTrackToList(track);
            this._fileBrowserNotifications.setAddedTrack(track, 6000);
            this.folderBrowserEvent.trigger('onSongAdded', {track});
        });
    },
    fileBrowserCB(res) {
        this._openFileBrowser();
        this.basePathBox.innerText = res['base_dir'];
        if (res['dir_list'].length > 0) {
            let idx = 0;
            for (let dirName of res['dir_list']) {
                let liElem = document.createElement('li');
                liElem.classList.add('fld-itm');
                liElem.dataset.index = idx;
                liElem.dataset.type = 'folder';
                liElem.dataset.name = dirName;
                liElem.innerHTML = `<li class="fa-solid fa-folder"></li> ${dirName}`;
                liElem.addEventListener('dblclick', this.folderSelector.bind(this));
                this.folderListBox.appendChild(liElem);
                idx++;
            }
        }
        
        if (res['file_list'].length > 0) {
            let idx = 0;
            for (let fileName of res['file_list']) {
                let liElem = document.createElement('li');
                liElem.classList.add('fle-itm');
                liElem.dataset.index = idx;
                liElem.dataset.type = 'file';
                liElem.dataset.name = fileName;
                liElem.innerHTML = `<li class="fa-solid fa-file"></li> ${fileName}`;
                liElem.addEventListener('dblclick', this.fileSelector.bind(this));
                this.fileListBox.appendChild(liElem);
                idx++;
            }
        }

        if (this.scrollToTarget) {
            // Find the <li> that matches the folder we just came from
            const items = this.folderListBox.querySelectorAll('.fld-itm');
            for (let item of items) {
                if (item.innerText.trim() === this.scrollToTarget) {
                    // Use scrollIntoView for a smooth, native experience
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Optional: add a temporary highlight class to guide the eye
                    item.classList.add('highlight-flash'); 
                    setTimeout(() => item.classList.remove('highlight-flash'), 2000);
                    
                    break;
                }
            }
            this.scrollToTarget = null; // Clear the target
        }
    },
    loadFileBrowser() {
        layoutHTML.renderLayout(this.layout.layoutName);
        this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this))
    },
    onSongAdded(cb, subscriber) {
        this.folderBrowserEvent.onEventRegister({'cb': (track, idx) => {
            cb(track, idx);
        }, subscriber}, 'onSongAdded');
    },
    _closeFileBrowser() {
        this.isOpen = false;
        clearElementInnerHTML(this.folderListBox);
        clearElementInnerHTML(this.fileListBox);
        this.fileExplorerBox.style.display = 'none';
    },
    _openFileBrowser() {
        this.isOpen = true;
        this.fileExplorerBox.style.display = 'block';
    },
};

export const TrackListBrowser = function(audioPlayer, audioPlayerDisplay) {
    this._tracklistBrowserNotifications = TracklistNotifier;
    this.audioPlayer = audioPlayer;
    this.audioPlayerDisplay = audioPlayerDisplay;
    this.windowCnt = document.getElementById('window-content');
    this.isVisible = false;
    TrackListManager.onAddedToQueue(this._notifyAddToQueue.bind(this), this);
    TrackListManager.onRemoveTrackFromTrackList(this._notifyARemovedTrack.bind(this), this);
};
TrackListBrowser.prototype = {
    setGrid(grid) {
        this.grid = grid;
    },
    show() {
        this.windowCnt.style.display = 'block';
        this.isVisible = true;
        this.scrollToCurrentTrack();
    },
    hide(evt) {
        if (evt && evt.target != evt.currentTarget)
            return;
        if (!this.isVisible)
            return
        this.windowCnt.style.display = 'none';
        this.isVisible = false;
    },
    playSongFromTracklist(evt) {
        const cell = evt.detail.HTMLItem;
        TrackListManager.setTrackIndex(cell.getParentItem().getIndex() - 1, true);
        const {track} = TrackListManager.getCurrentTrack();
        this.audioPlayerDisplay.setTrack(track);
    },
    showActionMenu(evt) {
        const target = evt.target;
        this.hideAllActionMenus();
        const previousMenu = document.querySelector(`.action-menu-cnt[data-track-id="${target.dataset.trackId}"]`);

        if (previousMenu) {
            return previousMenu.style.display = 'block';
        }

        const trackUUid = target.dataset.trackId;
        const divElem = document.createElement('div');
        const ulAction = document.createElement('ul');
        const liAddToQueue = document.createElement('li');
        const liDelete = document.createElement('li');
        const liFavorite = document.createElement('li');

        divElem.className = 'action-menu-cnt';
        divElem.dataset.trackId = trackUUid;

        liAddToQueue.innerText = 'Add to queue';
        liDelete.innerText = 'Remove track';
        liFavorite.innerText = 'Add to favorites';

        liAddToQueue.addEventListener('click', () => {
            this.addToQueueAction(divElem, trackUUid);
        });

        liDelete.addEventListener('click', () => {
            this.deleteTrackAction(liDelete, divElem, trackUUid);
        });

        liFavorite.addEventListener('click', () => {
            this.addToFavoriteAction(liFavorite, divElem, trackUUid);
        });

        ulAction.appendChild(liAddToQueue);
        ulAction.appendChild(liFavorite);
        ulAction.appendChild(liDelete);
        divElem.appendChild(ulAction);

        divElem.addEventListener('mouseleave', () => {
            this.hideActionMenu(divElem);
        });

        target.parentNode.appendChild(divElem);
    },
    hideActionMenu(divElem) {
        divElem.style.display = 'none';
    },
    hideAllActionMenus() {
        document.querySelectorAll('.action-menu-cnt').forEach(el => el.style.display = 'none');
    },
    addToQueueAction(divElem, trackUUid) {
        TrackListManager.addToQueue(TrackListManager.getTrackByUUID(trackUUid));
        divElem.style.display = 'none';
    },
    deleteTrackAction(liDelete, divElem, trackUUid) {
        const api = new Api();
        api.deleteTrack(trackUUid, (res) => {
            if (res.success) {
                const {index, track} = TrackListManager.removeTrackFromTracklistByUUID(trackUUid);
                console.log('removed', {index, track});
            } else
                alert('Error deleting file!');
        });
    },
    addToFavoriteAction(liFavorite, divElem, trackUUid) {
        console.log('not implemented :|', trackUUid);
    },
    setCurrentlyPlayingTrack(index) {
        if (!this.grid)
            return console.warn("TrackListBrowser: No grid set for the browser, cannot highlight currently playing track.");
        
        const row = this.grid.getRowByIndex(index);
        this.clearAllCurrentlyPlaying();
        
        if (row) {
            this.previousRow = row;
            this.nowPlaying = new NowPlayingSVGComponent();
            row.classAdd("currently-playing");
            for (const cell of row) {
                if (cell.hasClass('cell-index')) {
                    cell.innerContent('');
                    this.nowPlaying.appendTo(cell); // <-- handling of now playing
                    console.log('curent cell', {cell}, cell.getClassName());
                    break;
                }
            }
            this.scrollToCurrentTrack();
        } else {
            console.warn("Mediator pointed to a grid, but row was missing at index:", {index, row}, this.grid);
        }
    },
    clearAllCurrentlyPlaying(fromElem = document) {
        if (this.nowPlaying) {
            this.nowPlaying.remove();
            this.nowPlaying = null;
        }
        // fromElem.querySelectorAll('.currently-playing').forEach(el => el.classList.remove('currently-playing'));
        if (this.previousRow) {
            this.previousRow.classRemove('currently-playing');
            for (const cell of this.previousRow) {
                if (cell.hasClass('cell-index')) {
                    cell.innerContent(this.previousRow.getIndex());
                    break;
                }
            }
        }
        
    },
    scrollToCurrentTrack() {
        const currentlyPlaying = document.querySelector('div.row.currently-playing');
        if (currentlyPlaying) {
            const scrollTo = currentlyPlaying.offsetTop - currentlyPlaying.offsetHeight;
            setTimeout(() => {
                this.grid.getParentCnt().scrollTo({
                    behavior: 'smooth',
                    left: 0,
                    top: scrollTo,
                });
            }, 0);
        }
    },
    _notifyAddToQueue({track}) {
        this._tracklistBrowserNotifications.showAdded(track);
    },
    _notifyARemovedTrack({track}) {
        this._tracklistBrowserNotifications.showRemoved(track);
    },
}