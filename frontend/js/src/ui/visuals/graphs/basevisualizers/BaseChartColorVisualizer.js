import BaseVisualizer from "./BaseVisualizer.js"
import {getFormatedDate} from '../../../../core/Utils.js';

export class BaseChartColorVisualizer extends BaseVisualizer {
    initialize(renderContext) {
        const {ctx} = renderContext;
        ctx.shadowColor = 'rgba(255, 255, 255, 0)'
    }
    _pulseLigthness(barHeight) {
        let intensity = barHeight / 250;
        // Map intensity to a radian (0 to PI)
        const angle = intensity * Math.PI //+ (timeOffset / 2);

        // Lightness will be highest (70%) when intensity is at 0.5PI (the peak of the curve)
        // and lowest at the ends.
        return 40 + Math.sin(angle) * 30;
    }
    _applyCompression = (barHeight, minThreshold, maxThreshold, coef, saturation, light, alpha, pulse = false, ctx) => {
        let intensity = (barHeight - minThreshold) / (maxThreshold - minThreshold);
        
        // Clamp the value between 0 and 1 so the math doesn't "loop" the color wheel
        intensity = Math.max(0, Math.min(1, intensity));
        // --- RANGE COMPRESSION END ---
    
        // Apply the same Warm-to-Cold formula
        const hue = coef - (intensity * coef);
    
        if (pulse) {
            const pulsed = this._pulseLigthness(barHeight);
            light = pulsed;
        }
    
        return {h: hue, s: saturation, l: light, a: alpha};
    }

    process(renderContext) {
        const {ctx} = renderContext;
        this.renderer.render(renderContext);
        this._displayOverlay(getFormatedDate(), ctx);
    }

    _displayOverlay(dateText, ctx) {
        ctx.font = "25px sans-serif";
        ctx.textAlign = 'left';
        ctx.fillStyle = `#f1f1f1`;
        ctx.fillText(dateText, 10, 36);
    }

    _defaultCalculationBarHeight(i, dataArray) {
        return (dataArray[i] + 140) * 2;
    }
}