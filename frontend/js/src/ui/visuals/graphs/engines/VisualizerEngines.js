import BaseEngine from "./BaseEngine.js";

export class BarChartEngine extends BaseEngine {
    setup(audioPlayer, fftSize = 256) {
        this.audioCtx = new AudioContext();
        this.audioSourceNode = this.audioCtx.createMediaElementSource(audioPlayer.audioElem);

        //Create analyser node
        this.analyserNode = this.audioCtx.createAnalyser();
        this.analyserNode.fftSize = fftSize;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Float32Array(this.bufferLength);
        // this.analyserNode.fftSize = fftSize;
        // this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

        //Set up audio node network
        this.audioSourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioCtx.destination);

        this._buildContext();
    }
}

export class WaveformEngine extends BaseEngine {
    setup(audioPlayer, fftSize = 2048) {
        this.audioCtx = new AudioContext();
        this.audioSourceNode = this.audioCtx.createMediaElementSource(audioPlayer.audioElem);

        //Create analyser node
        this.analyserNode = this.audioCtx.createAnalyser();
        this.analyserNode.fftSize = fftSize;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

        //Set up audio node network
        this.audioSourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioCtx.destination);

        this._buildContext();
    }
}