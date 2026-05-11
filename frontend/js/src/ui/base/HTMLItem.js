import { clearElementInnerHTML, getLastParent } from "../../core/Utils.js";

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

export class RawHTMLItem {
    constructor(htmlString) {
        this.html = htmlString;
    }

    render() {
        return this.html;
    }
}

/** * SECTION 2: BASE CLASSES 
 */
export class HTMLItems {
    constructor(elementName) {
        if (typeof elementName === 'string')
            this.createElement(elementName);
        else if (typeof elementName === Element)
            this.element = elementName;
        else
            throw new Error("Element not found for HTMLItem");

        this.events = {};
        this.eventsHandler = {};
        this.children = {};
    }

    createElement(elementName) {
        this.element = document.createElement(elementName);
    }

    bindChild(key, selector) {
        this.children[key] = this.element.querySelector(selector);
    }

    // Lifecycle method: All subclasses must use this to clean up
    destroy() {
        if (this.element) {
            this.element.innerHTML = '';
        }
        
        this.children = {};
        this.element = null;
    }

    render(getReal) {
        return this.seekParent && !getReal ? this.getParent() : this.element;
    }

    clearChilds() {
        clearElementInnerHTML(this.render());
        return this;
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
            this._staged = true;
        }
    }

    unstageElement() {
        if (this._staged) {
            const el = this.render();
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
            this._staged = false;
        }
    }
    
    isStaged() {
        return !!this._staged;
    }

    id(id) {
        if (!id) {
            return this.render().id;
        }
        this.render().id = id;
        return this;
    }

    width(width, unit) {
        if (typeof width === 'number') {
            width = width.toString() + '' + unit;
            this.css({ width });
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

        return this;
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

        return this;
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

    appendTo(element) {
        element.append(this.render());
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

    classAdd(...classes) {
        this.render().classList.add(...classes);
        return this;
    }

    classRemove(...classes) {
        this.render().classList.remove(...classes);
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

    css(style, replace, d) {
        style = style || {};
        if (replace && d) console.log('css', style);
        Object.assign(this.render().style, style);

        return this;
    }
    style(prop, value) {
        if (typeof value !== 'undefined') {
            this.render().style[prop] = value;
            return this;
        }
        return this.render().style[prop];
    }
    data(name, value) {
        const isName = typeof name !== 'undefined';
        const isValue = typeof value !== 'undefined';
        if (isName && isValue) {
            this.render().dataset[name] = value;
            return this;
        } else if (isName) {
            return this.render().dataset[name];
        } else {
            return this.render().dataset;
        }
    }

    val(value) {
        if  (value) {
            this.render().value = value;
            return this;
        }

        return this.render().value;
    }

    setSelectionRange(start, end) {
        this.render().setSelectionRange(start, end);
        return this;
    }

    insertItemAfter(htmlItem) {
        const targetNode = htmlItem.render();
        const myNode = this.render();
        targetNode.insertAdjacentElement('afterend', myNode);
        this._staged = false;

        return this;
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

        return this;
    }

    removeEventListener(evtName, cb) {
        this.render().removeEventListener(evtName, cb);

        return this;
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

    hover(cbIn, cbOut) {
        this.addEventListener('mouseenter', cbIn);
        this.addEventListener('mouseleave', cbOut);
    }
}