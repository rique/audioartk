import {getFormatedDate} from '../../core/Utils.js';
import { CanvasItem } from './canvas/CanvasItem.js';
import VisualizerFactory from './graphs/Registry.js';
import { API } from '../../core/HttpClient.js';
import { BarChartEngine, WaveformEngine } from './graphs/engines/VisualizerEngines.js';

const api = new API();

class BaseProcessor {
    constructor() {
        this.canvas = VisualizerManager.getCanvas();
        this.canvasCtx = VisualizerManager.getContext();
    }
    setup(...args) {}

    process(...args) {}
}


export class BGImagesProcessor extends BaseProcessor {
    constructor() {
        super();

        this.curImg = 'img1.jpg';
        this.alphaCoef = 0; 
        this.doFadeIn = true; 
        this.imgIdx = 0;
    }

    async setup() {
        try {
            const res = await api.loadBGImages();
            this.imgList = res['img_list'];
            this.background = new Image();
            this.background.src = `https://audioartk.me/static/${this.curImg}`;
            this.background = await this.imageLoader(this.background);
        } catch (e) {
            console.error(e);
        }
        
        console.log(
            'img loaded', this.background.width, this.background.height, this.canvas.attribute('width'), this.canvas.attribute('height')
        );
        let width = 0, height = 0, x = 0, y = 0;
        //let coef = (canvas.width / background.width) * .8;
        let coef = (this.canvas.attribute('width') / this.background.height) * 1.05;
        width = this.background.width * coef;
        height = this.background.height * coef;
        x = parseInt((this.canvas.attribute('width') / 2) - (width / 2));
        this.canvasCtx.globalAlpha = .1;
        this.canvasCtx.drawImage(this.background, x, y, width, height);
        this.canvasCtx.globalAlpha = 1;
    }

    process() {
        if (!this.background || !this.background.height) return;

        if (this.doFadeIn)
            this.alphaCoef += 1;
        else
            this.alphaCoef -= 1;
        if (this.alphaCoef >= 2328)
            this.doFadeIn = false;
        else if (this.alphaCoef == 0) {
            this.doFadeIn = true;
            this.curImg = encodeURI(`${this.imgList[this.imgIdx]}`);
            this.background = new Image();
            this.background.src = `https://audioartk.me/${this.curImg}`;
            ++this.imgIdx;
            if (this.imgIdx >= this.imgList.length)
                this.imgIdx = 0;
        }

        this.canvasCtx.fillStyle = "#181717";
        this.canvasCtx.fillRect(0, 0, this.canvas.attribute('width'), this.canvas.attribute('height'));
        
        let width, height, x, y = 0;
        
        let coef = (this.canvas.attribute('height') / this.background.height) * (1.05 + (this.alphaCoef / 3008)); // <-- HERE!
        width =  this.background.width * coef;
        height = this.background.height * coef;
        let alphaVal = this.alphaCoef;

        if (alphaVal >= 610)
            alphaVal = 610;
        else if (alphaVal <= 0)
            alphaVal = 0

        this.canvasCtx.globalAlpha = alphaVal / 1000;
        x = parseInt((this.canvas.attribute('width') / 2) - (width / 2));
        this.canvasCtx.drawImage(this.background, x, y, width, height);
        this.canvasCtx.globalAlpha = 1;
    }

    async imageLoader(img) {
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
        })
    }
}


export class GraphProcessor extends BaseProcessor {
    constructor(chartType = 'barchart', chartName = 'red-to-purple') {
        super();
        this.graph = VisualizerFactory.create(chartType, chartName, this.canvasCtx);
    }

    setup() {
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
    }

    process() {
        this.analyserNode.getFloatFrequencyData(this.dataArray);
        const barWidth = (this.canvas.attribute('width') / this.bufferLength); // * 2.2;
        let posX = 0, posY = 0, maxBarHeight = (255 + 140) * 2;
        const dateText = getFormatedDate();
        const time = Date.now() * 0.002;

        for (let i = 0; i < this.bufferLength; i++) {
            const audioValue = this.dataArray[i];
            const barHeight = (audioValue + 140) * 2;
            posY = this.canvas.attribute('height') - barHeight * 2;
            const barContext = {
                hue: 180, i, time, barHeight, saturation: '100%', light: '75%', alpha: .6, pulse: false, ctx: this.canvasCtx
            };

            const waveContext = {
                dataArray: this.dataArray, bufferLength: this.bufferLength, canvasWidth: this.canvas.attribute('width'), canvasHeight: this.canvas.attribute('height'), ctx: this.canvasCtx
            }

            this.graph.initialize(barContext);
            this.canvasCtx.fillRect(
                posX,
                posY,
                barWidth,
                barHeight * 2,
            );
            this.canvasCtx.font = "25px sans-serif";
            this.canvasCtx.textAlign = 'left';
            this.canvasCtx.fillStyle = `#f1f1f1`;
            this.canvasCtx.fillText(dateText, 10, 36);
            this.canvasCtx.font = "15px sans-serif";
            this.canvasCtx.textAlign = 'center';
            this.canvasCtx.fillStyle = `#f1f1f1`;
            this.canvasCtx.fillText(Math.round(barHeight).toString(), posX + 10, posY - 5, barWidth);
            posX += barWidth + 1;
        }
    }

    setChart(chartType, chartName) {
        if (!chartType || !chartName) return;
        this.graph = VisualizerFactory.create(chartType, chartName, this.canvasCtx);
    }
}


export class GraphProcessor extends BaseProcessor {
    setup(audioPlayer, fftSize = 2048) { // FFT size usually higher for smooth waveforms
        // ... (standard AudioContext setup) ...
        this.analyserNode.fftSize = fftSize;
        this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    }

    process() {
        // CRITICAL: Use Time Domain for waveforms
        this.analyserNode.getByteTimeDomainData(this.dataArray);

        // If the visualizer has a custom 'draw' method, use it
        if (typeof this.graph.draw === 'function') {
            this.graph.draw({
                dataArray: this.dataArray,
                bufferLength: this.bufferLength,
                canvasWidth: this.canvas.attribute('width'),
                canvasHeight: this.canvas.attribute('height'),
                ctx: this.canvasCtx
            });
        } else {
            // ... fallback to your existing bar chart loop ...
        }
    }
}


const VisualizerManager = {
    init() {
        this._initCanvas();
        this._processors = [];
        this.isRunning = false;
    },
    
    addProcessor(processor, ...args) {
        this._processors.push({processor, args});
    },
    
    async executeProcessors() {
        if (this.isRunning) return;

        const tasks = this._processors.map(({processor, args}) => processor.setup(...args));

        try {
            await Promise.all(tasks);
        } catch(e) {
            console.error(e);
        }
        
        this.isRunning = true;
        this._startMainLoop();
    },

    getCanvas() {
        return this.canvas;
    },

    getContext() {
        return this.canvasCtx;
    },

    _startMainLoop() {
        const loop = () => {
            try {
                this.canvasCtx.clearRect(0, 0, this.canvas.attribute('width'), this.canvas.attribute('height'));
                this._processors.forEach(({processor}) => processor.process());
            } catch(e) {
                console.error(e);
            } finally {
                requestAnimationFrame(loop);
            }
        }

        requestAnimationFrame(loop);
    },

    _initCanvas() {
        this.canvas = new CanvasItem({
            width: window.innerWidth, 
            height: window.innerHeight, 
            padWidth: 36, 
            padHeight: 182, 
            autoResize: true
        }).css({
            display: 'block',
            margin: 'auto'
        }).appendTo(document.body);

        this.canvasCtx = this.canvas.context('2d');
        this.canvasCtx.clearRect(0, 0, this.canvas.attribute('width'), this.canvas.attribute('height'));
    },
}

export default VisualizerManager;