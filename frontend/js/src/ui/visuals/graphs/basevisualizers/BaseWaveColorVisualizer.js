import BaseVisualizer from "./BaseVisualizer.js";
import {getFormatedDate} from '../../../../core/Utils.js';

export class BaseWaveColorVisualizer extends BaseVisualizer {
    initialize({ time }) {
        this.baseHue = (time * 126) % 360;
        // We don't return {r,g,b} here anymore because the Renderer 
        // will ask getColorAt for them inside the loop.
    }

    // 2. SAMPLING: Calculate the color for a specific point "i"
    getColorAt(i, renderContext) {
        // We take the base (time) and add a shift based on position (i)
        // Adjust '0.2' to make the rainbow colors closer together or further apart
        const pointHue = (this.baseHue + (i * 0.2)) % 360;
        
        return this._hslToRgb(pointHue, 100, 70);
    }
    process(renderContext) {
        this.initialize(renderContext);
        const dateText = getFormatedDate();
        const {ctx} = renderContext;
        this.renderer.render(renderContext);
        this._displayOverlay(dateText, ctx);
    }
    _displayOverlay(dateText, ctx) {
        ctx.font = "25px sans-serif";
        ctx.textAlign = 'left';
        ctx.fillStyle = `#f1f1f1`;
        ctx.fillText(dateText, 10, 36);
    }
}

export class BaseMirrorWaveColorVisualizer extends BaseWaveColorVisualizer {
    static isMirror = true;
}