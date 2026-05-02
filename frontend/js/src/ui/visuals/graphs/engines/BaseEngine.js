import { AudioEngine } from "../../../../domain/sounds/AudioEngine.js";

export default class BaseEngine {
    constructor() {
        this.context = {};
        this.audioEngine = AudioEngine;
    }

    setup(audioPlayer, fftSize) {}
    
    getContext() {
        return this.context;
    }

    mergeContext(context) {
        this.context = {...this.context, ...context};
    }

    update() {}

    _buildContext() {
        for (const [key, val] of Object.entries(this)) {
			if (key === 'context') continue;
			
			this.context[key] = val;
		}
    }
}