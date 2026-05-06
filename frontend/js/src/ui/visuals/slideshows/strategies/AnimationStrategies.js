import { BaseProcessor, api } from "../../VisualizerManager.js";
import { AnimationFactory } from "./AnimationFactory.js";

class BaseAnimation {
    constructor(config = {}) {
        this.alphaCoef = 0;
        this.doFadeIn = true;
        this.config = {
            maxAlphaCoef: 2328,
            zoomThreshold: 610,
            fadeSpeed: 10,
            ...config
        };
        console.log('config', this.config)
        this.type = 'random';
    }

    // This replaces the logic inside your process loop
    update() {
        if (this.doFadeIn) {
            this.alphaCoef += this.config.fadeSpeed;
            if (this.alphaCoef >= this.config.maxAlphaCoef) this.doFadeIn = false;
        } else {
            this.alphaCoef -= this.config.fadeSpeed;
            if (this.alphaCoef <= 0) {
                this.alphaCoef = 0;
                this.doFadeIn = true;
                return true; // Signal that the cycle finished (time to swap images)
            }
        }
        return false;
    }

    getTransform(canvas, img) {
        throw new Error("getTransform must be implemented by subclass");
    }
}

export class PulseZoomStrategy extends BaseAnimation {
    constructor(config = {fadeSpeed: 3}) {
        super(config);
    }
    getTransform(canvas, img) {
        if (!img)
            return { scale: 0, alpha: 0 };
        const canvasH = canvas.attribute('height');
        const coef = (canvasH / img.height) * (1.05 + (this.alphaCoef / 3008));
        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, this.alphaCoef)) / 1000;
        
        return { scale: coef, alpha: alpha };
    }
}


// Strategy 2: A simple static fade (no movement)
export class StaticStrategy extends BaseAnimation {
    getTransform(canvas, img) {
        const canvasH = canvas.attribute('height');
        const scale = (canvasH / img.height) * 1.05; // Fixed scale
        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, this.alphaCoef)) / 1000;
        
        return { scale, alpha };
    }
}

export class GlitchStrategy extends BaseAnimation {
    constructor(config = {}) {
        super(config);
        this.jitterX = 0;
        this.jitterY = 0;
    }

    update() {
        // 1. Run the normal fade in/out logic
        const cycleFinished = super.update();

        // 2. Add some "Randomness"
        // Most of the time (95%), no jitter. 
        // 5% of the time, create a sudden offset.
        if (Math.random() > 0.95) {
            this.jitterX = (Math.random() - 0.5) * 40; // Shift up to 20px
            this.jitterY = (Math.random() - 0.5) * 40;
        } else {
            // Quickly "ease" back to zero jitter
            this.jitterX *= 0.8;
            this.jitterY *= 0.8;
        }

        return cycleFinished;
    }

    getTransform(canvas, img) {
        const canvasH = canvas.attribute('height');
        
        // Base scale + a tiny bit of "shiver" from the jitter
        const scale = (canvasH / img.height) * (1.05 + (Math.abs(this.jitterX) / 2000));
        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, this.alphaCoef)) / 1000;

        return { 
            scale, 
            alpha,
            // We can pass extra data like offsets to our Renderer!
            offsetX: this.jitterX,
            offsetY: this.jitterY
        };
    }
}


export class PanScanStrategy extends BaseAnimation {
    constructor(config = {}) {
        super(config);
        // We want to track the "horizontal progress"
        this.panProgress = 0;
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
        const cycleFinished = super.update();

        // While the image is fading in/staying visible, we move the pan
        // We use a very small increment so it looks smooth
        if (this.alphaCoef > 0) {
            this.panProgress += 0.001; 
        }

        // Reset the pan when the image is fully hidden
        if (cycleFinished) {
            this.direction = Math.random() > 0.5 ? 1 : -1;
            this.panProgress = 0;
        }

        return cycleFinished;
    }

    getTransform(canvas, img) {
        const canvasH = canvas.attribute('height');
        
        // 1. We scale it slightly larger than the screen so we have "room" to slide
        const scale = (canvasH / img.height) * 1.2;
        
        // 2. Standard Alpha logic
        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, this.alphaCoef)) / 1000;

        // 3. Calculate the Pan Offset
        // We figure out how much "extra" width we have, then multiply by progress
        const scaledWidth = img.width * scale;
        const extraWidth = scaledWidth - canvas.attribute('width');
        
        // Slide from +extraWidth/2 to -extraWidth/2
        const offsetX = (extraWidth / 2) - (this.panProgress * extraWidth);
        
        return { 
            scale, 
            alpha,
            offsetX: offsetX * this.direction,
            offsetY: 0 
        };
    }
}


export class SmartPanStrategy extends BaseAnimation {
    constructor(config = {}) {
        super(config);
        this.panProgress = 0;
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
        const cycleFinished = super.update();
        
        // Only progress the pan if we are in a visible state
        if (this.alphaCoef > 0) {
            this.panProgress += 0.001; 
        }

        if (cycleFinished) {
            this.panProgress = 0;
            this.direction = Math.random() > 0.5 ? 1 : -1;
        }

        return cycleFinished;
    }

    getTransform(canvas, img) {
        const canvasW = canvas.attribute('width');
        const canvasH = canvas.attribute('height');
        
        // 1. "Cover" Logic: Ensure the image at least fills the whole canvas
        const scaleW = canvasW / img.width;
        const scaleH = canvasH / img.height;
        
        // Use the larger of the two scales so no black bars are visible,
        // then add our 1.1 buffer to guarantee room for movement.
        const scale = Math.max(scaleW, scaleH) * 1.1; 

        const scaledWidth = img.width * scale;
        const extraWidth = scaledWidth - canvasW;
        
        // 2. The Pan Logic
        // Even if it's portrait, it's now wide enough to slide
        const offsetX = (extraWidth / 2) - (this.panProgress * extraWidth);

        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, this.alphaCoef)) / 1000;

        return { 
            scale, 
            alpha, 
            offsetX, 
            offsetY: 0 
        };
    }
}


export class CrossfadeStrategy extends BaseAnimation {
    constructor(config = {}) {
        super(config);
        this.nextAlpha = 0;
    }

    update() {
        // 1. Fade the current one out
        if (this.alphaCoef > 0) {
            this.alphaCoef -= this.config.fadeSpeed;
        }

        // 2. Fade the next one in at the same time
        this.nextAlpha += this.config.fadeSpeed;

        // 3. Cycle ends when the next image is fully opaque
        if (this.nextAlpha >= this.config.maxAlphaCoef) {
            this.alphaCoef = this.config.maxAlphaCoef; // Reset for next cycle
            this.nextAlpha = 0;
            return true; 
        }
        return false;
    }

    getTransform(canvas, img, isNext = false) {
        const canvasH = canvas.attribute('height');
        const scale = (canvasH / img.height) * 1.05;
        
        // Use the correct alpha depending on if we are drawing the "Outgoing" or "Incoming" image
        const targetCoef = isNext ? this.nextAlpha : this.alphaCoef;
        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, targetCoef)) / 1000;
        
        return { scale, alpha };
    }
}


/**
 * Strategy: TrackArtStrategy
 * Focuses on a single image (the album art).
 * It disables the automatic "fade out" cycle to keep the art visible 
 * as long as the track is playing.
 */

// strategies/AnimationStrategies.js

export class TrackArtStrategy extends BaseAnimation {
    constructor(config = {fadeSpeed: 36, maxAlphaCoef: 1000}) {
        super(config);
        this.type = 'track-art';
        this.isTrackChanging = false;
        this.floatOffset = 0;
        this.floatSpeed = 0.02; // Adjust for faster/slower floating
    }

    update() {
        // 1. Handle Track Change Transitions
        if (this.isTrackChanging) {
            console.log('initiating track switch', this.alphaCoef, this.config.maxAlphaCoef, this.config.fadeSpeed)
            this.alphaCoef -= this.config.fadeSpeed;
            if (this.alphaCoef <= 0) {
                this.alphaCoef = 0;
                this.isTrackChanging = false;
                return true; // Signal manager to swap to NEW track art
            }
        } else if (this.alphaCoef < this.config.maxAlphaCoef) {
            this.alphaCoef += this.config.fadeSpeed;
        }

        // 2. Continuous Floating Animation
        // We use a sine wave to create a smooth up/down motion
        this.floatOffset += this.floatSpeed;
        
        return false; // Prevent auto-cycling to random images
    }

    triggerTrackChange() {
        console.log('triggerTrackChange');
        this.isTrackChanging = true;
    }

    getTransform(canvas, img) {
        if (!img) return { scale: 0, alpha: 0 };

        const canvasW = canvas.attribute('width');
        const canvasH = canvas.attribute('height');

        // 1. "Fit" (Contain) Logic
        // Calculate scale to fit the image entirely within the canvas
        const scaleW = canvasW / img.width;
        const scaleH = canvasH / img.height;
        const fitScale = Math.min(scaleW, scaleH) * 0.8; // 0.8 adds a nice margin

        // 2. Apply Alpha
        const alpha = Math.min(this.config.zoomThreshold, Math.max(0, this.alphaCoef)) / 1000;

        // 3. Apply Floating Animation to Y offset
        const offsetY = Math.sin(this.floatOffset) * 15; // 15px float range

        return { 
            scale: fitScale, 
            alpha: alpha, 
            offsetX: 0, 
            offsetY: offsetY 
        };
    }
}

AnimationFactory.register('track-art', TrackArtStrategy);
AnimationFactory.register('static', StaticStrategy);
AnimationFactory.register('pulse-zoom', PulseZoomStrategy);
AnimationFactory.register('glitch', GlitchStrategy);
AnimationFactory.register('pan-scan', PanScanStrategy);
AnimationFactory.register('smart-pan', SmartPanStrategy);
AnimationFactory.register('crossfade', CrossfadeStrategy);
