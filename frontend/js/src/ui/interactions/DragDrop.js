/**  Drag and drop manager for drag and drop functionality.
 * This module provides a comprehensive implementation of drag and drop functionality for the music player application, allowing users to easily rearrange tracks within the tracklist and queue by dragging and dropping them. The DragIt class encapsulates the logic for handling drag events, while the DragmeMover class manages the movement of the dragged element. The DragitManager class oversees the overall drag and drop process, including activation, deactivation, and event handling.
 * The design allows for flexibility in defining draggable elements and their behavior during drag operations, making it adaptable to various contexts within the application. The module also ensures smooth user interactions by utilizing requestAnimationFrame for efficient updates during dragging.
 * Overall, this module enhances the user experience by providing an intuitive and responsive drag and drop interface, contributing to a polished and user-friendly music player application.
 * The implementation promotes code reusability and maintainability by encapsulating drag and drop logic within dedicated classes, allowing for easy updates and extensions in the future as new features are introduced.
 * In summary, this module serves as a crucial component of the music player application, providing a robust and flexible system for managing drag and drop interactions across different contexts, ultimately enhancing the overall user experience.
 * This module provides a comprehensive implementation of the API interactions required for the music player application, ensuring smooth communication between the frontend and backend while enhancing the overall user experience through efficient data management and retrieval. The Api class encapsulates methods for making HTTP requests to various API endpoints, allowing for operations such as browsing files, adding tracks, and editing track information.
 * Each method within the Api class is designed to send an appropriate HTTP request to the corresponding API endpoint and process the response to provide feedback to the caller through callbacks or promises. The module is structured to be easily integrated with other components of the application, allowing for seamless communication between the frontend and backend.
 * /*/
const getButton = (key) => {
    const buttons = {
        0: 'uninitialized',
        1: 'leftClick',
        2: 'rightClick',
        4: 'middle',
        8: 'back',
        16: 'forward'
    };
    if (buttons.hasOwnProperty(key))
        return buttons[key];
    return 'unknown';
};

const getCursor = (evt) => {
    return {
        X: evt.clientX,
        Y: evt.clientY,
        buttons: getButton(evt.buttons)
    }
}

const DragmeMover = function(dragme) {
    this.dragme = dragme;
}
DragmeMover.prototype = {
    init(seekParent) {
        return this.dragme.init(seekParent);
    },
    moveTo(x, y) {
        if (this.prevX && this.prevY) {
            let dragX = this.dragme.offsetLeft() + (x - this.prevX),
                dragY = this.dragme.offsetTop() + (y - this.prevY);

            requestAnimationFrame(this.dragme.setLeftTop.bind(this.dragme, dragX, dragY));
        }

        this.prevX = x;
        this.prevY = y;
    },
    moveXTo(x) {
        if (this.prevX) {
            let dragX = this.dragme.offsetLeft() + (x - this.prevX);
            requestAnimationFrame(this.dragme.left.bind(this.dragme, dragX, 'px'));
        }

        this.prevX = x;
    },
    moveYTo(y) {
        if (this.prevY) {
            let dragY = this.dragme.offsetTop() + (y - this.prevY);
            requestAnimationFrame(this.dragme.top.bind(this.dragme, dragY, 'px'));
        }

        this.prevY = y;
    },
    done() {
        this.prevX = undefined;
        this.prevY = undefined;
        this.dragme.reset();
    },
    getDragme() {
        return this.dragme;
    }
};

const DragIt = function(dragMover) {
    this.dragMover = dragMover;
    this.pressed = false;
}
DragIt.prototype = {
    setDragMover(dragMover) {
        this.dragMover = dragMover;
    },
    getDragMover() {
        return this.dragMover;
    },
    getDragme() {
        return this.dragMover.getDragme();
    },
    setDragmeSeekParent() {
        this.dragMover.getDragme().setSeekParent();
    },
    unsetDragmeSeekParent() {
        this.dragMover.getDragme().unsetSeekParent();
    },
    dragit(cursor, seekParent) {
        if (cursor.buttons != 'leftClick')
            return;
                        
        if (!this._isInit)
            this._init(seekParent);
        this.pressed = true;

        this.getDragme().dispatchEvent('dragged');
        this.dragMover.moveTo(cursor.X, cursor.Y);
    },
    dragmove(cursor, seekParent) {
        if (this.pressed)
            this.dragit(cursor, seekParent);
    },
    dragstop(cursor) {
        if (!this.pressed)
            return;

        this.getDragme().dispatchEvent('dropped');

        this._finish();
    },
    insertDragAfter(drag, seekParent) {
        let dragme = drag.getDragme(), 
            thisdragme = this.getDragme();
        if (seekParent) {
            dragme = dragme.getParentItem();
            thisdragme = thisdragme.getParentItem();
        }

        thisdragme.insertItemAfter(dragme);
    },
    toggleHovered(hovered) {
        this.getDragme().toggleHovered(hovered)
    },
    _init(seekParent) {
        this._isInit = this.dragMover.init(seekParent);
    },
    _finish() {
        this.pressed = false;
        this._isInit = false;
        this.dragMover.done();
        if (this.onFinish && typeof this.onFinish === 'function')
            this.onFinish(this);
    }
}

const DragitManager = function(drags) {
    this.drags = drags || [];
    this.seekParent = false;
}
DragitManager.prototype = {
    activate(elementsArray, seekParent) {
        this.seekParent = seekParent;
        this._bindedDragit = this._dragit.bind(this);
        this._bindedDragmove = this._dragmove.bind(this);
        this._bindedDragstop = this._dragstop.bind(this);

        document.addEventListener('mousedown', this._bindedDragit);
        document.addEventListener('mousemove', this._bindedDragmove);
        document.addEventListener('mouseup', this._bindedDragstop);

        if (elementsArray)
            this.setDrags(elementsArray);

        this.activated = true;
    },
    setDrags(elementsArray) {
        this.drags = [];
        for (let i = 0; i < elementsArray.length; ++i) {
            this.drags.push(new DragIt(new DragmeMover(elementsArray[i])));
        }
    },
    deactivate() {
        if (!this.activated)
            return;

        document.removeEventListener('mousedown', this._bindedDragit);
        document.removeEventListener('mousemove', this._bindedDragmove);
        document.removeEventListener('mouseup', this._bindedDragstop);

        this._bindedDragit = null;
        this._bindedDragmove = null;
        this._bindedDragstop = null;

        this.activated = false;
    },
    reactivate() {
        this.deactivate();
        this.activate(undefined, this.seekParent);
    },
    _dragit(evt) {
        if (this.currentDrag) {
            return;
        }

        const cursor = getCursor(evt);
        const drag = this._findCursorHoveredDrag(cursor);

        if (drag) {
            drag.dragit(cursor, this.seekParent);
            this.currentDrag = drag;
        }
    },
    _dragmove(evt) {
        if (!this.currentDrag)
            return;

        const drag = this._findHoveredDrag(this.currentDrag);
        console.log('Dragging over element:', drag, 'Current drag:', this.currentDrag.getDragme());
        if (drag && drag != this.hoveredDrag) {
            if (this.hoveredDrag) {
                if (this.seekParent)
                    this.hoveredDrag.setDragmeSeekParent();
                this.hoveredDrag.getDragme().toggleHovered();
                if (this.seekParent)
                    this.hoveredDrag.unsetDragmeSeekParent();
            }
            if (this.seekParent)
                drag.setDragmeSeekParent();
            drag.getDragme().toggleHovered();
            if (this.seekParent)
                drag.unsetDragmeSeekParent();
            this.hoveredDrag = drag;
        }

        this.currentDrag.dragmove(getCursor(evt), this.seekParent);
    },
    _dragstop(evt) {
        if (!this.currentDrag)
            return;

        let drag = this._findHoveredDrag(this.currentDrag);

        if (this.hoveredDrag) {
                if (this.seekParent)
                this.hoveredDrag.setDragmeSeekParent();
            this.hoveredDrag.getDragme().toggleHovered();
            if (this.seekParent)
                this.hoveredDrag.unsetDragmeSeekParent();
        }

        if (drag) {
            this.currentDrag.insertDragAfter(drag, this.seekParent);
        }

        this.currentDrag.dragstop(getCursor(evt), this.seekParent);
        this.currentDrag = undefined;
        this.hoveredDrag = undefined;
    },
    _divContainsDrag(drag, div) {
        const dragOffsetLeft = drag.offsetLeft() + (drag.offsetWidth() / 2);
        const dragOffsetTop = drag.offsetTop() + (drag.offsetHeight() / 2);
        
        const res = (dragOffsetLeft >= div.offsetLeft() && dragOffsetLeft < div.offsetRight()) && 
                    (dragOffsetTop  >= div.offsetTop()  && dragOffsetTop  < div.offsetBottom());

        return  res;
    },
    _TargetContainsCursor(cursor, target) {
        const X = cursor.X + target.scrollLeft();
        const Y = cursor.Y //+ target.scrollTop();
            
        const res = X > target.offsetLeft(true) && X < target.offsetRight(true) &&
                    Y > target.offsetTop(true)  && Y < target.offsetBottom(true, 0);

        return res;
    },
    _findCursorHoveredDrag(cursor, cb) {
        for (let i = 0; i < this.drags.length; ++i) {
            let drag = this.drags[i];
            if (this._TargetContainsCursor(cursor, drag.getDragme())) {
                if (typeof cb === 'function')
                    cb(drag, cursor);
                return drag;
            }
        }
    },
    _findHoveredDrag(drag) {
        let foundDrag;
        for (let i = 0; i < this.drags.length; ++i) {
            let dr = this.drags[i];
            if (dr.getDragme() == drag.getDragme())
                continue;

                if (this.seekParent)
                dr.setDragmeSeekParent();
            if (this._divContainsDrag(drag.getDragme(), dr.getDragme())) {
                if (this.seekParent)
                    dr.unsetDragmeSeekParent();
                foundDrag = dr;
                break;
            }
            if (this.seekParent)
                dr.unsetDragmeSeekParent();
        }

        return foundDrag;
    }
};

export default DragitManager;
