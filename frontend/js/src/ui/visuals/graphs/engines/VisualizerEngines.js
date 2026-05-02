import BaseEngine from "./BaseEngine.js";

export class BarChartEngine extends BaseEngine {
    async setup(audioPlayer, fftSize = 256) {
        // 1. Connect the source (the "Input Jack")
        this.audioSourceNode = this.audioEngine.connectSource(audioPlayer.audioElem);

        // 2. Configure the analyzer via the engine service
        const { analyser, bufferLength } = this.audioEngine.analyser().setAnalyserConfig(fftSize ?? 256);
        
        this.analyserNode = analyser;
        this.bufferLength = bufferLength;

        // 3. Prepare the data array specifically for BarChart requirements
        // BarCharts typically use Frequency data (Float32)
        this.dataArray = new Float32Array(this.bufferLength);
        
        this._buildContext();
    }

    update() {
        if (!this.analyserNode) return;
        // This method pulls fresh data from the hardware
        this.analyserNode.getFloatFrequencyData(this.dataArray);
    }
}

export class WaveformEngine extends BaseEngine {
    async setup(audioPlayer, fftSize = 2048) {
        this.audioSourceNode = this.audioEngine.connectSource(audioPlayer.audioElem);

        // 2. Configure the analyzer via the engine service
        const { analyser, bufferLength } = this.audioEngine.analyser().setAnalyserConfig(fftSize ?? 2048);
        
        this.analyserNode = analyser;
        this.bufferLength = bufferLength;
        this.dataArray = new Uint8Array(this.bufferLength);
        // console.log(this.audioEngine.source.connect(this.audioEngine.ctx.destination));
        this._buildContext();
    }

    update() {
        if (!this.analyserNode) return;
        this.analyserNode.getByteTimeDomainData(this.dataArray);
    }
}
