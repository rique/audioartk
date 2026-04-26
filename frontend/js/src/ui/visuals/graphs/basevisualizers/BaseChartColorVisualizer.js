import BaseVisualizer from "./BaseVisualizer.js"

export class BaseChartColorVisualizer extends BaseVisualizer {
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
            const pulsed = pulseLigthness(barHeight);
            light = `${pulsed}%`;
        }
    
        ctx.fillStyle = `hsla(${hue}, ${saturation}, ${light}, ${alpha})`;
    }
}