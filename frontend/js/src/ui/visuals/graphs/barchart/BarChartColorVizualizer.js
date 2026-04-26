import { BaseChartColorVisualizer } from "../basevisualizers/BaseChartColorVisualizer.js";
import VisualizerFactory from '../Factory.js';


class ClassicRed extends BaseChartColorVisualizer {
    initialize({barHeight, ctx}) {
        this.draw(barHeight, ctx);
    }

    draw(barHeight, ctx) {
        ctx.fillStyle = `rgba(${Math.floor((barHeight / 1.4) + 140)}, 50, 50, 66)`;
    }
}

class MonoColor extends BaseChartColorVisualizer {
    initialize({hue = 180, barHeight, saturation = '100%', light = '75%', alpha = .6, pulse = false, ctx}) {
        if (pulse) {
            const pulsed = this._pulseLigthness(barHeight);
            light = `${pulsed}%`;
        }
        this.draw(hue, saturation, light, alpha, ctx);
    }

    draw(hue, saturation, light, alpha, ctx) {
        ctx.fillStyle = `hsla(${hue}, ${saturation}, ${light}, ${alpha})`;
    }
}

class RedToPurpel extends BaseChartColorVisualizer {
    initialize({barHeight, saturation = '100%', light = '75%', alpha = .6, pulse = false, ctx}) {
        const maxRange = 190; 
        const intensity = Math.min(barHeight / maxRange, 1);
        // 2. The "Warm to Cold" Formula
        // Low intensity (0) = 280 (Purple/Cold)
        // High intensity (1) = 0 (Red/Hot)
        const hue = 280 - (intensity * 280);
        // console.log('intensity', intensity);
        if (pulse) {
            const pulsed = pulseLigthness(barHeight);
            light = `${pulsed}%`;
        }

        this.draw(hue, saturation, light, alpha, ctx);
    }
    
    draw(hue, saturation, light, alpha, ctx) {
        ctx.fillStyle = `hsla(${hue}, ${saturation}, ${light}, ${alpha})`;
    }
}


class RedAndPurpel extends BaseChartColorVisualizer {
    initialize({barHeight, saturation = '100%', light = '75%', alpha = .6, pulse = false, ctx}) {
        const minThreshold = 40;  // Everything below this is pure Purple
        const maxThreshold = 180; // Everything above this is pure Red

        // Normalize barHeight to a 0-1 value within our specific window
        
        this.draw(barHeight, minThreshold, maxThreshold, 280, saturation, light, alpha, pulse, ctx);
    }

    draw(barHeight, minThreshold, maxThreshold, coef, saturation, light, alpha, pulse, ctx) {
        this._applyCompression(barHeight, minThreshold, maxThreshold, coef, saturation, light, alpha, pulse, ctx);
    }
}


class RedToOrange extends BaseChartColorVisualizer { 
    initialize({barHeight, saturation = '100%', light = '75%', alpha = .6, pulse = false, ctx}) {
        const minThreshold = 50; 
        const maxThreshold = 178;

        this.draw(barHeight, minThreshold, maxThreshold, 35,  saturation, light, alpha, pulse, ctx);
    }

    draw(barHeight, minThreshold, maxThreshold, coef,  saturation, light, alpha, pulse, ctx) {
        this._applyCompression(barHeight, minThreshold, maxThreshold, coef, saturation, light, alpha, pulse, ctx);
    }
}


class RippleWaves extends BaseChartColorVisualizer { 
    initialize({time, i, saturation = '100%', light = '75%', alpha = .6, pulse = false, ctx}) {
        const wave = Math.sin(i * 0.1 + time); 
        const hue = 36 + (wave * 40);

        if (pulse) {
            const pulsed = pulseLigthness(barHeight);
            light = `${pulsed}%`;
        }

        this.draw(hue, saturation, light, alpha, ctx);
    }

    draw(hue, saturation, light, alpha, ctx) {
        ctx.fillStyle = `hsla(${hue}, ${saturation}, ${light}, ${alpha})`;
    }
}


class TrigBasedRGBPlasma extends BaseChartColorVisualizer { 
    initialize({barHeight, alpha = .6, ctx}) {
        // Normalize: Divide barHeight by your typical "max" (e.g., 300 or 400)
        // This ensures intensity stays between 0 and 1
        let intensity = barHeight / 1500;
        const timeOffset = Date.now() * 0.002;
        const dynamicIntensity = intensity + timeOffset;
        intensity = Math.min(1, Math.max(0, intensity)) //+ (timeOffset / 10);
        const r = Math.abs(Math.sin(intensity * Math.PI) * 255);
        const g = Math.abs(Math.cos(intensity * Math.PI * 0.5) * 255);
        const b = Math.abs(Math.sin(intensity * Math.PI + 2) * 255);

        this.draw(r, g, b, alpha, ctx);
    }

    draw(r, g, b, alpha, ctx) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}


VisualizerFactory.register('barchart', 'classic-red', ClassicRed);
VisualizerFactory.register('barchart', 'mono-color', MonoColor);
VisualizerFactory.register('barchart', 'red-to-purple', RedToPurpel);
VisualizerFactory.register('barchart', 'red-and-purple', RedAndPurpel);
VisualizerFactory.register('barchart', 'red-to-orange', RedToOrange);
VisualizerFactory.register('barchart', 'ripple-waves', RippleWaves);
VisualizerFactory.register('barchart', 'trigbased-rgb-plasma', TrigBasedRGBPlasma);