import { ListEvents } from "../../core/EventBus.js";
import { HTMLItems } from "./HTMLItem.js";

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

    init(seekParent, anchorElement) {
        if (!this.element)
            return false;

        if (seekParent)
            this.setSeekParent();

        if (anchorElement) {
            
        }

        this.css({
            position: 'absolute',
            left: `${this.offsetLeft()}px`,
            top: `${this.offsetTop()}px`,
            zIndex: 999,
        });

        this.render().classList.replace('dropped', 'dragged');

        return true;
    }

    reset() {
        this.css({
            position: 'static',
            zIndex: 0
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
            { background: elementBGColor, fontSize: '0.8rem' },
            { background: '#e5fce8', fontSize: '0.9rem' },
            { background: '#e5fce8', fontSize: '1rem' },
            { background: elementBGColor, fontSize: '1.25rem' },
            { fontSize: '1.4rem' }
        ];

        const kfEffect = new KeyframeEffect(element, keyFrames, {
            duration: timeout,
        });

        return new Animation(kfEffect, document.timeline);
    }
}