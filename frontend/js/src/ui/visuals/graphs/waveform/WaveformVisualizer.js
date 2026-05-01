import { BaseWaveColorVisualizer, BaseMirrorWaveColorVisualizer } from "../basevisualizers/BaseWaveColorVisualizer.js";
import VisualizerFactory from '../Factory.js';


class WaveformVisualizer extends BaseWaveColorVisualizer {
    static name = 'wave form visualizer';
    static key = 'waveform-visualizer';
    /**
     * SETUP: Called once per frame.
     * Use this to set the 'base' state for the frame.
     */
    initialize({ ctx, time }) {
        // We can define a base hue that shifts over time
        this.currentBaseHue = (time * 50) % 360;

        // Set global styles for the stroke
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255, 255, 255, 0)';
    }

    /**
     * COLOR: Called by the Renderer inside the loop.
     * This defines the "Color Personality".
     */
    getColorAt(i, renderContext) {
        // For a classic oscilloscope green:
        return { r: 0, g: 255, b: 0 };

        // OR for a subtle rainbow shift:
        // const pointHue = (this.currentBaseHue + (i * 0.1)) % 360;
        // return this._hslToRgb(pointHue, 100, 50);
    }

    /**
     * COORDINATES: Called by the Renderer inside the loop.
     * This defines the "Shape Personality".
     */
    draw(x, y, i, r, g, b, ctx) {
        // The Renderer handles the 'beginPath' and 'stroke'.
        // We only handle the line segments.
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
}


class NeonPulseWave extends BaseWaveColorVisualizer {
    static name = 'neon pulse wave';
    static key = 'neon-pulse-wave';
    initialize({ ctx, time }) {
        // Setup global frame state
        this.time = time;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        // We can't calculate a single intensity here if we want the 
        // colors to ripple along the wave.
        ctx.shadowColor = 'rgba(255, 255, 255, 0)';
    }

    getColorAt(i, { dataArray, time }) {
        // 1. Get the intensity for THIS specific point in the audio
        const audioValue = dataArray[i];
        const intensity = Math.abs(audioValue - 128) / 128;

        // 2. Use that local intensity to calculate the RGB
        // Using Math.sin/cos creates that "pulsing" neon transition
        const r = Math.abs(Math.sin(intensity * Math.PI + time) * 255);
        const g = Math.abs(Math.cos(intensity * Math.PI) * 255);
        const b = 200; 

        return { r, g, b };
    }

    draw(x, y, i, r, g, b, ctx) {
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
}


class MirrorOscilloscope extends BaseMirrorWaveColorVisualizer {
    static name = 'mirror oscilloscope';
    static key = 'mirror-oscilloscope-wave';

    initialize({ ctx, time }) {
        this.time = time;
        
        // Setup styles once per frame
        ctx.lineWidth = 2; // Moved from draw() for performance
        ctx.lineJoin = 'miter'; 
        
        // Note: You had shadowBlur set to 20, but no shadowColor.
        // If you want a glow, uncomment the line below:
        // ctx.shadowBlur = 20;
        // ctx.shadowColor = 'rgba(0, 191, 255, 0.5)'; 
        ctx.shadowColor = 'rgba(255, 255, 255, 0)';
    }

    getColorAt(i) {
        const r = this._shiftColor(0, i), 
              g = this._shiftColor(191, i), 
              b = 255;
        return { r, g, b };
    }

    // Normalized to accept 'side'
    draw(x, y, i, r, g, b, ctx, side) {
        const centerY = (ctx.canvas.height / 2) | 0;
        const offset = (y - centerY) | 0;

        if (side === 'top') {
            // Forward Path
            if (i === 0) ctx.moveTo(x, centerY + offset);
            else ctx.lineTo(x, centerY + offset);
        } else {
            // Backward Path (Mirrored)
            ctx.lineTo(x, centerY - offset);
        }
    }

    _shiftColor(colorVal, i) {
        // We use Math.sin to make the color "wave" back and forth 
        // rather than just hitting 255 and staying there (clamping).
        // 0.05 is a 'speed' multiplier for the spatial shift.
        const shift = Math.sin(this.time + i * 0.05) * 50; 
        return Math.floor(Math.max(0, Math.min(255, colorVal + shift)));
    }
}

class CyclingMirrorOscilloscope extends BaseMirrorWaveColorVisualizer {
    static name = 'cycling mirror oscilloscope';
    static key = 'cycling-mirror-oscilloscope-wave';
    initialize({ time, ctx }) {
        // 1. Store time for the getColorAt method
        this.time = time;

        // 2. Setup styles once per frame (Performance win!)
        ctx.lineWidth = 2;
        ctx.lineJoin = 'miter'; // 'miter' is faster than 'round' for complex paths
        ctx.lineCap = 'butt';
        ctx.shadowColor = 'rgba(255, 255, 255, 0)';
    }

    // Added 'renderContext' as a second argument to access data if needed
    getColorAt(i, { time }) {
        // Fix: Use the 'time' passed from the context or 'this.time'
        // Using (i / 2) creates a nice spatial spread across the wave
        const hue = (time * 50 + (i / 2)) % 360;
        return this._hslToRgb(hue, 100, 70);
    }

    draw(x, y, i, r, g, b, ctx, side) {
        const centerY = (ctx.canvas.height / 2) | 0;
        const offset = (y - centerY) | 0;

        if (side === 'top') {
            // If it's the start of the buffer, move to position
            if (i === 0) ctx.moveTo(x, centerY + offset);
            else ctx.lineTo(x, centerY + offset);
        } else {
            // This draws the mirrored part (Pass 2)
            // No moveTo needed here if we want a closed loop, 
            // the last lineTo from the top pass connects to the first of the bottom pass
            ctx.lineTo(x, centerY - offset);
        }
    }

    _hslToRgb(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color);
        };
        return { r: f(0), g: f(8), b: f(4) };
    }
}

class HeatmapCyclingMirrorOscilloscope extends BaseMirrorWaveColorVisualizer {
    static name = 'heatmap cycling mirror oscilloscope';
    static key = 'heatmap-cycling-mirror-oscilloscope-wave';

    initialize({ ctx, time }) {
        this.rollingBaseline = (time * 0.4) % 360;

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        // Setting a global fallback shadow based on the rolling baseline is safer 
        // for single-fill paths than per-vertex shadows.
        const fallbackRgb = this._hslToRgb(this.rollingBaseline, 100, 50);
        ctx.shadowColor = `rgba(${fallbackRgb.r}, ${fallbackRgb.g}, ${fallbackRgb.b}, 0.6)`;
    }

    getColorAt(i, { dataArray }) {
        const audioValue = dataArray[i];
        const deviation = Math.abs(audioValue - 128);
        const intensity = Math.min(1, deviation / 128); 
        const reactiveHue = intensity * 270; 
        const finalHue = (this.rollingBaseline + reactiveHue) % 360;
        
        return this._hslToRgb(finalHue, 100, 50);
    }

    // 2. NORMALIZE DRAW METHOD: Match the signature and use the 'side' logic
    draw(x, y, i, r, g, b, ctx, side) {
        // Optional: Update the shadow color dynamically. 
        // Be aware that only the final computed color of the loop will apply to the fill.
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`; 
        
        const centerY = (ctx.canvas.height / 2) | 0;
        const offset = (y - centerY) | 0;

        if (side === 'top') {
            // Forward Path
            if (i === 0) ctx.moveTo(x, centerY + offset);
            else ctx.lineTo(x, centerY + offset);
        } else {
            // Backward Path
            ctx.lineTo(x, centerY - offset);
        }
    }

    _hslToRgb(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color);
        };
        return { r: f(0), g: f(8), b: f(4) };
    }
}

class RainbowMirrorWave extends BaseMirrorWaveColorVisualizer {
    static name = 'rainbow mirror oscilloscope';
    static key = 'rainbow-mirror-oscilloscope-wave'; // Fixed: This was accidentally 'name' before

    /**
     * SETUP: Runs once per frame.
     */
    initialize({ ctx, time }) {
        // We calculate the base starting point for the rainbow.
        // Storing it on 'this' allows us to reference it in getColorAt.
        this.baseHue = (time * 126) % 360;

        // Set global styles for the frame.
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'miter'; // Recommended for single continuous paths to prevent vertex lag
        ctx.shadowColor = 'rgba(255, 255, 255, 0)';
    }

    /**
     * COLOR: Called by the Renderer for the gradient stops.
     * This turns the "Solid Color" into a "Spatial Rainbow".
     */
    getColorAt(i) {
        // (i * 0.2) determines how many colors are visible at once.
        // Smaller numbers = subtle transition. Larger = full rainbow.
        const pointHue = (this.baseHue + (i * 0.2)) % 360;
        
        return this._hslToRgb(pointHue, 100, 70);
    }

    /**
     * DRAW: Carves the mirrored path.
     * Normalized to use the 'side' parameter for two-pass rendering.
     */
    draw(x, y, i, r, g, b, ctx, side) {
        const centerY = (ctx.canvas.height / 2) | 0;
        const offset = (y - centerY) | 0;

        if (side === 'top') {
            // Forward Path
            if (i === 0) ctx.moveTo(x | 0, (centerY + offset) | 0);
            else ctx.lineTo(x | 0, (centerY + offset) | 0);
        } else {
            // Backward Path (Mirrored)
            ctx.lineTo(x | 0, (centerY - offset) | 0);
        }
    }

    _hslToRgb(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color);
        };
        return { r: f(0), g: f(8), b: f(4) };
    }
}


class SolidMountainWave extends BaseWaveColorVisualizer {
    static name = 'solid mountain wave';
    static key = 'solid-mountain-wave';
    /**
     * SETUP: Runs once per frame.
     */
    initialize({ ctx, time }) {
        this.time = time;
        
        // For a "Mountain", a subtle glow at the top edge looks great
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 50, 255, 0.3)';
    }

    /**
     * COLOR: Defines the shifting purple/pink spectrum.
     */
    getColorAt(i, { time }) {
        // We use the same math you had, but now it can shift per-point
        // adding (i * 0.01) creates a slight color drift across the mountain range
        const r = Math.abs(Math.sin(time + i * 0.01) * 100) + 155;
        const g = 50;
        const b = 255;
        return { r, g, b };
    }

    /**
     * DRAW: Defines the "Mountain" silhouette.
     */
    draw(x, y, i, r, g, b, ctx) {
        const canvasHeight = ctx.canvas.height;
        const canvasWidth = ctx.canvas.width;
        
        if (i === 0) {
            // 1. Start at the bottom-left corner
            ctx.moveTo(0, canvasHeight); 
            // 2. Line up to the first audio data point
            ctx.lineTo(x, y);
        } else {
            // 3. Trace the waveform
            ctx.lineTo(x, y);
        }

        // 4. On the last point, drop down to the bottom-right and close the shape
        // Note: Check if your renderer passes bufferLength, otherwise use renderContext
        if (i === 2047) { // Assuming bufferLength - 1
            ctx.lineTo(canvasWidth, canvasHeight);
            ctx.closePath();
            
            /* CRITICAL PEER NOTE:
               Since your base 'process' method likely calls ctx.stroke(), 
               you should call ctx.fill() here. 
               The renderer will apply the gradient to the fill!
            */
            ctx.fillStyle = ctx.strokeStyle; // Syncs the gradient to the fill
            ctx.fill();
        }
    }
}


class DigitalFragmentWave extends BaseWaveColorVisualizer {
    static name = 'digital fragment wave';
    static key = 'digital-fragment-wave';
    /**
     * SETUP: Runs once per frame.
     */
    initialize({ ctx }) {
        // Since we are drawing individual blocks, we don't need a glow on a path,
        // but a shadow on the context can make the fragments look like they are glowing.
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(94, 255, 94, 0.5)';
    }

    /**
     * COLOR: Calculates the yellow-to-white intensity for each fragment.
     */
    getColorAt(i, { dataArray }) {
        const audioValue = dataArray[i];
        const intensity = Math.abs(audioValue - 128) / 128;
        
        // As intensity increases, it moves from Yellow towards pure White

        return { 
            r: Math.floor(127 * intensity),
            g: 255, 
            b: Math.floor(255 * intensity) // Adding a bit of blue at high intensity makes it "whiter" 'rgba(0, 255, 0, 0.8)'
        };
    }

    /**
     * DRAW: Draws the digital particles.
     */
    draw(x, y, i, r, g, b, ctx) {
        // 1. Every 4th point check to maintain your performance optimization
        if (i % 4 === 0) {
            // 2. Set the color for this specific fragment
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            
            // 3. Draw the 3x3 square
            ctx.fillRect(x, y, 3, 3);
            
            // 4. Optional: Add a "mirror" fragment for symmetry if you like that look
            // const centerY = ctx.canvas.height / 2;
            // const offset = y - centerY;
            // ctx.fillRect(x, centerY - offset, 3, 3);
        }
        
        /* PEER NOTE: 
           Since the Renderer will call ctx.stroke() at the end of the loop,
           and we haven't used moveTo/lineTo, it will effectively do nothing.
           This is fine! It keeps the class compatible with the logic flow.
        */
    }
}


VisualizerFactory.register('waveform', 'waveform-visualizer', WaveformVisualizer);
VisualizerFactory.register('waveform', 'neon-pulse-wave', NeonPulseWave);
VisualizerFactory.register('waveform', 'mirror-oscilloscope-wave', MirrorOscilloscope);
VisualizerFactory.register('waveform', 'solid-mountain-wave', SolidMountainWave);
VisualizerFactory.register('waveform', 'digital-fragment-wave', DigitalFragmentWave);
VisualizerFactory.register('waveform', 'cycling-mirror-oscilloscope-wave', CyclingMirrorOscilloscope);
VisualizerFactory.register('waveform', 'rainbow-mirror-oscilloscope-wave', RainbowMirrorWave);
VisualizerFactory.register('waveform', 'heatmap-cycling-mirror-oscilloscope-wave', HeatmapCyclingMirrorOscilloscope);