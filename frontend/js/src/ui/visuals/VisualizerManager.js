import { CanvasItem } from './canvas/CanvasItem.js';
import {VisualizerFactory, EngineFactory, visualizerManifest} from './graphs/Registry.js';
import { API } from '../../core/HttpClient.js';
import { BarChartEngine, WaveformEngine } from './graphs/engines/VisualizerEngines.js';
import RendererFactory from './Gradient/Renderers/RendererFactory.js';
import { VisualizerDropdownComponent, VisualSelectManager } from '../components/GroupeSelectItem.js';
import { HTMLItems } from '../grid/RowTemplates.js';
import { ListEvents } from '../../core/EventBus.js'

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
        this.alphaCoef = 0; 
        this.doFadeIn = true; 
        this.imgIdx = 0;
        this.speed = 1;
    }

    async setup() {
        try {
            this.curImg = 'img1.jpg';
            // this.curImg =  'binikini.jpg';
            // this.curImg =  'space.jpg';
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
            this.alphaCoef += this.speed;
        else
            this.alphaCoef -= this.speed;
        if (this.alphaCoef >= 2328)
            this.doFadeIn = false;
        else if (this.alphaCoef == 0) {
            this.doFadeIn = true;
            this.curImg = encodeURI(`${this.imgList[this.imgIdx]}`);
            this.background = new Image();
            console.log('curImg', this.curImg);
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

/*
WaveForm:
VisualizerFactory.register('waveform', 'waveform-visualizer', WaveformVisualizer);
VisualizerFactory.register('waveform', 'neon-pulse-wave', NeonPulseWave);
VisualizerFactory.register('waveform', 'mirror-oscilloscope-wave', MirrorOscilloscope);
VisualizerFactory.register('waveform', 'solid-mountain-wave', SolidMountainWave);
VisualizerFactory.register('waveform', 'digital-fragment-wave', DigitalFragmentWave);
VisualizerFactory.register('waveform', 'cycling-mirror-oscilloscope-wave', CyclingMirrorOscilloscope);
VisualizerFactory.register('waveform', 'rainbow-mirror-oscilloscope-wave', RainbowMirrorWave);
VisualizerFactory.register('waveform', 'heatmap-cycling-mirror-oscilloscope-wave', HeatmapCyclingMirrorOscilloscope);

Bars:
VisualizerFactory.register('barchart', 'classic-red', ClassicRed);
VisualizerFactory.register('barchart', 'mono-color', MonoColor);
VisualizerFactory.register('barchart', 'red-to-purple', RedToPurpel);
VisualizerFactory.register('barchart', 'red-and-purple', RedAndPurpel);
VisualizerFactory.register('barchart', 'red-to-orange', RedToOrange);
VisualizerFactory.register('barchart', 'ripple-waves', RippleWaves);
VisualizerFactory.register('barchart', 'trigbased-rgb-plasma', TrigBasedRGBPlasma);
*/
export class GraphProcessor extends BaseProcessor {
    constructor(audioPlayer, category = 'waveform', chartName = 'heatmap-cycling-mirror-oscilloscope-wave', renderer = 'radial') {
        super();
        this.audioPlayer = audioPlayer;
        this.category = category;
        this.graph = VisualizerFactory.create(category, chartName);
        this.renderer = RendererFactory.create(renderer);
        this.engine = EngineFactory.create(category);
        VisualizerManager.onSwitchVisualizer(this.setChart.bind(this), this);
    }

    async setup(fftSize) {
        await this.engine.setup(this.audioPlayer, fftSize);
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

        this.graph.process(renderContext, this.renderer); // passing or injecting the renderer as param
    }

    setChart(category, chartName, renderer) {
        if (!category || !chartName) return;

        if (!renderer)
            renderer = category == 'waveform' ? 'radial' : 'bar';

        this.graph = VisualizerFactory.create(category, chartName);
        this.renderer = RendererFactory.create(renderer);
        this.engine = EngineFactory.create(category);
        this.setup();
    }
}


const VisualizerManager = {
    init() {
        this._initCanvas();
        this._processors = [];
        this.isRunning = false;
        this._events = new ListEvents();
        this._buildVisualizerSelector();
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
        this._stop = false;
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
                // SET AND RESET CANVAS CONTEXT TO DEFAULTS
                this.canvasCtx.clearRect(0, 0, this.canvas.attribute('width'), this.canvas.attribute('height'));
                this.canvasCtx.font = "11px sans-serif";
                this.canvasCtx.textAlign = 'center';
                this.canvasCtx.lineWidth = 2;
                this.canvasCtx.lineCap = 'round';
                this._processors.forEach(({processor}) => processor.process());
                
            } catch(e) {
                return console.error(e);
            } 
            if (!this._stop)
                requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    },

    _initCanvas() {
        this.container = new HTMLItems('div').css({
            position: 'relative',
            width: 'fit-content',
            margin: 'auto'
        }).appendTo(document.body);

        this.canvas = new CanvasItem({
            width: window.innerWidth, 
            height: window.innerHeight, 
            padWidth: 36, 
            padHeight: 182, 
            autoResize: true
        }).css({
            display: 'block',
        }).appendTo(this.container.render());

        this.canvasCtx = this.canvas.context('2d');
    },

    _buildVisualizerSelector() {
        VisualSelectManager.init(this.container);
        VisualSelectManager.onCategoryChange((category, graphName, renderer) => {
            this._events.trigger('onSwitchVisualizer', category, graphName, renderer);
        });
    },

    onSwitchVisualizer(cb, subscriber) {
        // Here you would tell your processor to update its internal 'graph'
        // Example: this.mainProcessor.setVisualizer(type);
        
        this._events.onEventRegister({cb, subscriber}, 'onSwitchVisualizer');
    }
}

export default VisualizerManager;