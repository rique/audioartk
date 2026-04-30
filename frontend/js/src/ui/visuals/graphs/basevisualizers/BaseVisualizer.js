export default class BaseVisualizer {
    constructor(renderer) {
        this.renderer = renderer;
        this.renderer.setGraph(this);
    }
    initialize({...args}) {}
    getColorAt(i, renderContext, ...args) {}
    draw(...args) {}
    process() {}
    _displayOverlay(...args) {}

    /**
     * Converts RGBA to HSLA.
     * @param {number} r 0-255
     * @param {number} g 0-255
     * @param {number} b 0-255
     * @param {number} a 0-1 (optional)
     * @returns {object} { h, s, l, a }
     */
    _rgbaToHsla(r, g, b, a = 1) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // Achromatic (gray)
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
            a: a
        };
    }
}