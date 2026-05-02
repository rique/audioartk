import { TrippleChannelEqModule } from "./modules/EqModule.js";
import { GainModule } from './modules/GainModule.js';
import { AnalyserModule } from "./modules/AnalyserModule.js";

class AudioEngine {
    constructor() {
        if (!AudioEngine.instance) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupModules();
            AudioEngine.instance = this;
        }
        return AudioEngine.instance;
    }

    setupModules() {
        // 1. Gain Node (Main Volume & Fading)
        this.masterGain = new GainModule(this.ctx);
        
        // 2. Analyser Node (The Visualizer's Data Source)
        this.analyserMod = new AnalyserModule(this.ctx);

        // 3. EQ Nodes (Example: 3-Band EQ)
        this.trippleBandEQ = new TrippleChannelEqModule(this.ctx, this.masterGain.getNode());
        this.masterGain.patchTo(this.analyserMod.getNode());
        this.analyserMod.patchTo(this.ctx.destination);
    }

    connectSource(element) {
        if (!this.source) {
            this.source = this.ctx.createMediaElementSource(element);
            this.trippleBandEQ.patchOn(this.source);
        }
        return this.source;
    }

    gain() {
        return this.masterGain;
    }

    analyser() {
        return this.analyserMod;
    }

    EQ() {
        return this.trippleBandEQ;
    }
}

const audioEngine = new AudioEngine();

export {audioEngine as AudioEngine};
