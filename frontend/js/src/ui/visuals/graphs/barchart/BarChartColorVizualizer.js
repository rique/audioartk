import { BaseChartColorVisualizer } from "../basevisualizers/BaseChartColorVisualizer.js";
import VisualizerFactory from '../Factory.js';
import { withNumericContext } from '../../../../core/Decorators/ContextDecorators.js'
import { decorate } from '../../../../core/Decorators/Utils.js'


class ClassicRed extends BaseChartColorVisualizer {
    static name = 'classic red';
    static key = 'classic-red';
    getColorAt(i, {dataArray}) {
        const barHeight = this._defaultCalculationBarHeight(i, dataArray);
        return this._rgbaToHsla(Math.floor((barHeight / 1.4) + 140), 50, 50, 0.66);
    }
    
}

class MonoColor extends BaseChartColorVisualizer {
    static name = 'mono color';
    static key = 'mono-color';
    getColorAt(i, {dataArray, ctx, hue, saturation, light, alpha, pulse = false}) {
        if (pulse) {
            const barHeight = this._defaultCalculationBarHeight(i, dataArray);
            const pulsed = this._pulseLigthness(barHeight);
            light = pulsed;
        }

        return {h: hue, s: saturation, l: light, a: alpha}
    }
}

decorate(MonoColor, 'getColorAt', withNumericContext({
    hue: 180,
    saturation: 100,
    light: 75,
    alpha: .6
}));

class RedToPurpel extends BaseChartColorVisualizer {
    static name = 'red to purple';
    static key = 'red-to-purple';
    /**
     * COLOR: Runs for every bar.
     * Takes the barHeight and determines the "Warm to Cold" color.
     */
    getColorAt(i, renderContext) {
        // 1. Get the specific height for this bar
        const barHeight = this._defaultCalculationBarHeight(i, renderContext.dataArray);
        
        const maxRange = 190; 
        const intensity = Math.min(barHeight / maxRange, 1);

        // 2. The "Warm to Cold" Formula
        // Low intensity (0) = 280 (Purple) -> High intensity (1) = 0 (Red)
        const hue = 280 - (intensity * 280);
        
        let light = 75;
        if (renderContext.pulse) {
            light = this._pulseLigthness(barHeight);
        }

        // Return the color components
        return { 
            h: hue, 
            s: 100, 
            l: light, 
            a: 0.6 
        };
    }
}


class RedAndPurpel extends BaseChartColorVisualizer {
    static name = 'red and purple';
    static key = 'red-and-purple';
    getColorAt(i, {dataArray, saturation, light, alpha, ctx, pulse = false}) {
        const barHeight = this._defaultCalculationBarHeight(i, dataArray);
        const minThreshold = 40;  // Everything below this is pure Purple
        const maxThreshold = 180; // Everything above this is pure Red

        // Normalize barHeight to a 0-1 value within our specific window
        
        return this._applyCompression(barHeight, minThreshold, maxThreshold, 280, saturation, light, alpha, pulse, ctx);
    }
}

decorate(RedAndPurpel, 'getColorAt', withNumericContext({
    saturation: 100,
    light: 75,
    alpha: .6
}));

class RedToOrange extends BaseChartColorVisualizer {
    static name = 'red to orange';
    static key = 'red-to-orange';
    getColorAt(i, {dataArray, saturation, light, alpha, ctx, pulse = false}) {
        const barHeight = this._defaultCalculationBarHeight(i, dataArray);
        const minThreshold = 50; 
        const maxThreshold = 178;

        return this._applyCompression(barHeight, minThreshold, maxThreshold, 35,  saturation, light, alpha, pulse, ctx);
    }
}

decorate(RedToOrange, 'getColorAt', withNumericContext({
    saturation: 100,
    light: 75,
    alpha: .6
}));


class RippleWaves extends BaseChartColorVisualizer {
    static name = 'ripple waves';
    static key = 'ripple-waves';
    getColorAt(i, {time, saturation, light, alpha, ctx, pulse = false}) {
        const wave = Math.sin(i * 0.1 + time); 
        const hue = 36 + (wave * 40);

        if (pulse) {
            const pulsed = this._pulseLigthness(barHeight);
            light = pulsed;
        }

        return {h: hue, s: saturation, l: light, a: alpha};
    }
}

decorate(RippleWaves, 'getColorAt', withNumericContext({
    saturation: 100,
    light: 75,
    alpha: .6
}));

class TrigBasedRGBPlasma extends BaseChartColorVisualizer {
    static name = 'trigonometry based RGB';
    static key = 'trigbased-rgb-plasma';
    getColorAt(i, {dataArray, alpha, ctx}) {
        // Normalize: Divide barHeight by your typical "max" (e.g., 300 or 400)
        // This ensures intensity stays between 0 and 1
        const barHeight = this._defaultCalculationBarHeight(i, dataArray);
        let intensity = barHeight / 1500;
        const timeOffset = Date.now() * 0.002;
        const dynamicIntensity = intensity + timeOffset;
        intensity = Math.min(1, Math.max(0, intensity)) //+ (timeOffset / 10);
        const r = Math.abs(Math.sin(intensity * Math.PI) * 255);
        const g = Math.abs(Math.cos(intensity * Math.PI * 0.5) * 255);
        const b = Math.abs(Math.sin(intensity * Math.PI + 2) * 255);

        return this._rgbaToHsla(r, g, b, alpha);
    }
}

decorate(TrigBasedRGBPlasma, 'getColorAt', withNumericContext({
    alpha: .6
}));

VisualizerFactory.register('barchart', 'classic-red', ClassicRed);
VisualizerFactory.register('barchart', 'mono-color', MonoColor);
VisualizerFactory.register('barchart', 'red-to-purple', RedToPurpel);
VisualizerFactory.register('barchart', 'red-and-purple', RedAndPurpel);
VisualizerFactory.register('barchart', 'red-to-orange', RedToOrange);
VisualizerFactory.register('barchart', 'ripple-waves', RippleWaves);
VisualizerFactory.register('barchart', 'trigbased-rgb-plasma', TrigBasedRGBPlasma);