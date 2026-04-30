import {HTMLItems} from '../../grid/RowTemplates.js';


export class CanvasItem extends HTMLItems {
    constructor({width, height, padWidth = 0, padHeight = 0, autoResize = false}) {
        super('canvas');
        this.attribute('width', width - padWidth)
                .attribute('height', height - padHeight)
                .width(width - padWidth)
                .height(height - padHeight);
        
        this.padWidth = padWidth;
        this.padHeight = padHeight;
        
        if (autoResize)
            this.#_setUpAutoResize(); 
    }

    context(type='2d') {
        return this.render().getContext(type);
    }

    #_setUpAutoResize() {
        window.addEventListener('resize', (evt) => {
            this.attribute('width', window.innerWidth - this.padWidth);
            this.attribute('height', window.innerHeight - this.padHeight);
        });
    }

    appendTo(element) {
        element.append(this.render());
        return this;
    }
}
