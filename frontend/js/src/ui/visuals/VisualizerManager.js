import { CanvasItem } from './canvas/CanvasItem.js';
import {VisualizerFactory, EngineFactory} from './graphs/Registry.js';
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
    constructor(category = 'waveform', chartName = 'heatmap-mirror-oscilloscope-wave') {
        super();
        this.category = category;
        this.graph = VisualizerFactory.create(category, chartName, this.canvasCtx);
        this.engine = EngineFactory.create(category);
    }

    async setup(audioPlayer, fftSize) {
        await this.engine.setup(audioPlayer, fftSize);
    }

    process() {
        this.engine.update();
        
        const audioContext = this.engine.getContext();

        const renderContext = {
            ...audioContext,
            canvasWidth: this.canvas.attribute('width'),
            canvasHeight: this.canvas.attribute('height'),
            ctx: this.canvasCtx,
            canvas: this.canvas,
            time: Date.now() * 0.002
        };

        this.graph.process(renderContext);
    }

    setChart(chartType, chartName) {
        if (!chartType || !chartName) return;
        this.graph = VisualizerFactory.create(chartType, chartName, this.canvasCtx);
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
            console.trace(e);
            return console.error(e);
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