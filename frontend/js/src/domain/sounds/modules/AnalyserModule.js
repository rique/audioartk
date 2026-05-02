import { BaseAudioModule, BaseCompositeModule } from "./BaseModules.js";

export class AnalyserModule extends BaseAudioModule {
    constructor(ctx) {
        super(ctx)
        this.node = this.ctx.createAnalyser();
    }

    setAnalyserConfig(fftSize) {
        this.node.fftSize = fftSize;
        return {
            analyser: this.node,
            bufferLength: this.node.frequencyBinCount
        };
    }
}