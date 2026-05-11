import { calculateBarLayout } from "../../core/Utils";
import { MAINSVGItem, RectSVGItem } from "../base/SVGItems.js";

class NowPlayingSVGComponent {
    constructor() {
        this.SVGItem = new MAINSVGItem();
        this.rects = [];
        this.initComponent();
    }

    initComponent() {
        this.SVGItem
            .id('now-playing-svg')
            .shapeWidth(18)
            .shapeHeight(18)
            .attribute('viewBox', '0 0 18 18') //  min-x, min-y, width, heigh
            .addEventListener('click', () => {
                this.rects.forEach(rect => {
                    const currentValue = rect.style('transform-origin');
                    const transformOrigin = (currentValue === '' || currentValue.includes('center center')) ? 'bottom' : 'center';
                    rect.style('transform-origin', transformOrigin);
                    // Ensures the browser uses the bar's own bounding box
                    rect.style('transform-box', 'fill-box');
                });
            });
        
        const rectConfig = {
            totalWidth: 18,
            totalHeight: 18,
            nBars: 3,
            padding: 1,
            gap: 2,
            maxHeight: 15
        }

        this.rects = calculateBarLayout(rectConfig).map((layout, i) => {
            return new RectSVGItem()
                .x(layout.x)
                .y(layout.y)
                .shapeWidth(layout.width)
                .shapeHeight(layout.height)
                .classAdd('bar', `bar${i + 1}`);
        });
        
        if (this.rects.length === 0)
            throw new Error('No bars could be defined!', {rectConfig});

        this.SVGItem.append(...this.rects);
    }

    appendTo(htmlItem) {
        htmlItem.append(this.SVGItem);
    }

    hide() {
        this.SVGItem.hide();
    }

    show() {
        this.SVGItem.show();
    }

    remove() {
        this.SVGItem.remove();
    }
}