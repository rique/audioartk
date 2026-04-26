import { BaseWaveColorVisualizer } from "../basevisualizers/BaseWaveColorVisualizer.js";
import VisualizerFactory from '../Factory.js';


class WaveformVisualizer extends BaseWaveColorVisualizer {
    initialize({ dataArray, bufferLength, canvasWidth, canvasHeight, ctx }) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 255, 0)'; // Classic oscilloscope green
        ctx.beginPath();

        const sliceWidth = canvasWidth / bufferLength;
        let x = 0;

        this.draw(dataArray, bufferLength, canvasWidth, canvasHeight, ctx);
    }
    // We override the default behavior because we aren't drawing "bars"
    draw(dataArray, bufferLength, canvasWidth, canvasHeight, ctx) {
        

        for (let i = 0; i < bufferLength; i++) {
            // Normalize the 0-255 value to the canvas height
            // 128 is the middle of the canvas
            const v = dataArray[i] / 128.0;
            const y = (v * canvasHeight) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvasWidth, canvasHeight / 2);
        ctx.stroke();
    }
}

class NeonPulseWave extends BaseWaveColorVisualizer {
    initialize({ audioValue, time }) {
        // Calculate the "Point Color" based on audio intensity
        let intensity = Math.abs(audioValue - 128) / 128;
        
        const r = Math.abs(Math.sin(intensity * Math.PI + time) * 255);
        const g = Math.abs(Math.cos(intensity * Math.PI) * 255);
        const b = 200; 

        return { r, g, b };
    }

    draw(x, y, i, r, g, b, ctx) {
        // We removed stokeStyle/lineWidth from here to keep the path clean
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
}


class MirrorOscilloscope extends BaseWaveColorVisualizer {
    initialize({ audioValue, time }) {
        // High-energy neon blue
        const r = 0, g = 191, b = 255;
        return { r, g, b };
    }

    draw(x, y, i, r, g, b, ctx) {
        const centerY = ctx.canvas.height / 2;
        const offset = y - centerY;

        ctx.lineWidth = 2;
        
        // Draw Top Half
        if (i === 0) ctx.moveTo(x, centerY + offset);
        else ctx.lineTo(x, centerY + offset);

        // Draw Bottom Half (Mirrored)
        // Note: This works because the Base class calls stroke() once at the end
        // connecting all these segments into one mirrored path.
        ctx.moveTo(x, centerY - offset);
        ctx.lineTo(x, centerY - offset);
    }
}

class CyclingMirrorOscilloscope extends BaseWaveColorVisualizer {
    initialize({ time }) {
        // 1. Calculate hue: 0-360 degrees. 
        // Multiplying time by 50 controls the rotation speed.
        const hue = (time * 50) % 360;
        
        // 2. Convert HSL to RGB components for your current draw() signature
        // Or, if you prefer, we can modify draw to accept HSL strings.
        // For now, let's stick to your signature with a quick helper:
        return this._hslToRgb(hue, 100, 70);
    }

    draw(x, y, i, r, g, b, ctx) {
        const centerY = ctx.canvas.height / 2;
        const offset = y - centerY;

        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

        // Top line
        if (i === 0) ctx.moveTo(x, centerY + offset);
        else ctx.lineTo(x, centerY + offset);

        // Mirror line (Bottom)
        ctx.moveTo(x, centerY - offset);
        ctx.lineTo(x, centerY - offset);
    }

    // Helper to keep your existing r,g,b signature working with Hue
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

class HeatmapCyclingMirrorOscilloscope extends BaseWaveColorVisualizer {
    /**
     * @param {number} audioValue (0-255, 128 is silence)
     * @param {number} time (不斷增加的系統時間)
     */
    initialize({ audioValue, time }) {
        // 1. Determine "Wideness" (Amplitude from silence)
        // Convert to absolute deviation: 0 (silent) to 128 (max amplitude)
        const deviation = Math.abs(audioValue - 128);

        // 2. Map Deviation to Hue (0-1 range first)
        // Red (0) when silent, Purple (~270) when maxed.
        // Normalize: 0 to 1
        const intensity = Math.min(1, deviation / 128); 

        // --- THE REACTIVE MATH ---
        // Map intensity to Hue range:
        // We want a range from ~0 degrees (Red) to ~270 degrees (Purple)
        const reactiveHue = intensity * 270; 
        
        // --- THE CYCLE MATH ---
        // Roll the background color wheel slowly (0.01 speed)
        // This makes the "baseline" color shift over time.
        const rollingBaseline = (time * .4) % 360;

        // --- COMBINE BOTH ---
        // Add the reactive hue to the rolling baseline.
        // Modulo 360 ensures it wraps around the color wheel.
        const finalHue = (rollingBaseline + reactiveHue) % 360;
        
        // Return RGB for your process's gradient logic
        // Use 100% saturation for vibrant neon, 50% lightness.
        return this._hslToRgb(finalHue, 100, 50);
    }

    draw(x, y, i, r, g, b, ctx) {
        const centerY = ctx.canvas.height / 2;
        // deviation calculated during process()
        const offset = y - centerY;

        ctx.lineWidth = 3; // Wider lines look better for neon effects
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Set dynamic style for this segment
        // Your process method handles stroking, but we can preset parameters here.
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`; // Slightly higher alpha for neon

        // Top line segment
        if (i === 0) {
            ctx.moveTo(x, centerY + offset);
        } else {
            ctx.lineTo(x, centerY + offset);
        }

        // Mirror line segment (Bottom)
        // Move the pen without lineTo to keep paths separate
        ctx.moveTo(x, centerY - offset);
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

class RainbowMirrorWave extends BaseWaveColorVisualizer {
    /**
     * Matches your process() call: 
     * const { r, g, b } = this.initialize(renderContext);
     */
    initialize({ audioValue, time }) {
        // 1. Create a rolling hue (0-360)
        const hue = (time * 126) % 360;
        
        // 2. Convert HSL to RGB so your gradient logic gets valid numbers
        return this._hslToRgb(hue, 100, 70);
    }

    /**
     * Matches your process() call:
     * this.draw(x, y, i, r, g, b, ctx);
     */
    draw(x, y, i, r, g, b, ctx) {
        const centerY = ctx.canvas.height / 2;
        // Calculate how far the wave deviates from the center
        const offset = y - centerY;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Top line segment
        if (i === 0) {
            ctx.moveTo(x, centerY + offset);
        } else {
            ctx.lineTo(x, centerY + offset);
        }

        // Mirror line segment (Bottom)
        // We move the "pen" to the mirrored position
        ctx.moveTo(x, centerY - offset);
        // This effectively draws two paths simultaneously within one stroke()
    }

    // Helper for your RGB-based gradient logic
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
    initialize({ time }) {
        // Shifting purple/pink gradient
        const r = Math.abs(Math.sin(time) * 100) + 155;
        const g = 50;
        const b = 255;
        return { r, g, b };
    }

    draw(x, y, i, r, g, b, ctx) {
        const canvasHeight = ctx.canvas.height;
        
        if (i === 0) {
            ctx.moveTo(x, canvasHeight); // Start at bottom-left
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        // On the very last point, close the shape to the bottom-right
        if (i === this.bufferLength - 1) {
            ctx.lineTo(x, canvasHeight);
            ctx.closePath();
            // We use fill() here instead of the default stroke() 
            // defined in the Base class (you might need to add ctx.fill() to Base)
            ctx.fill(); 
        }
    }
}


class DigitalFragmentWave extends BaseWaveColorVisualizer {
    initialize({ audioValue }) {
        const intensity = Math.abs(audioValue - 128) / 128;
        return { 
            r: 255, 
            g: 255 * intensity, 
            b: 0 
        };
    }

    draw(x, y, i, r, g, b, ctx) {
        // Optimization: We don't use lineTo/stroke here.
        // We draw small rectangles.
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        // Draw a 3x3 pixel square for every 4th point to save performance
        if (i % 4 === 0) {
            ctx.fillRect(x, y, 3, 3);
        }
    }
}


VisualizerFactory.register('waveform', 'waveform-visualizer', WaveformVisualizer);
VisualizerFactory.register('waveform', 'neon-pulse-wave', NeonPulseWave);
VisualizerFactory.register('waveform', 'mirror-oscilloscope-wave', MirrorOscilloscope);
VisualizerFactory.register('waveform', 'solid-mountain-wave', SolidMountainWave);
VisualizerFactory.register('waveform', 'digital-fragment-wave', DigitalFragmentWave);
VisualizerFactory.register('waveform', 'cycling-mirror-oscilloscope-wave', CyclingMirrorOscilloscope);
VisualizerFactory.register('waveform', 'rainbow-mirror-oscilloscope-wave', RainbowMirrorWave);
VisualizerFactory.register('waveform', 'heatmap-mirror-oscilloscope-wave', HeatmapCyclingMirrorOscilloscope);