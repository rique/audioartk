import { HTMLItems } from "./HTMLItem.js";

class SVGItem extends HTMLItems {
    constructor(shape) {
        super(shape);
    }

    createElement(shape, svgNamespace = 'http://www.w3.org/2000/svg') {
        this.element = document.createElementNS(svgNamespace, shape);
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