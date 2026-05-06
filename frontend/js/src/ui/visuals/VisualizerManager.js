import { CanvasItem } from './canvas/CanvasItem.js';
import {VisualizerFactory, EngineFactory, visualizerManifest} from './graphs/Registry.js';
import { API } from '../../core/HttpClient.js';
import { BarChartEngine, WaveformEngine } from './graphs/engines/VisualizerEngines.js';
import RendererFactory from './Gradient/Renderers/RendererFactory.js';
import { VisualizerDropdownComponent, VisualSelectManager } from '../components/GroupeSelectItem.js';
import { HTMLItems } from '../grid/RowTemplates.js';
import { ListEvents } from '../../core/EventBus.js';
import { AnimationFactory, ImageRenderer, ImageProviderFactory } from './Main.js';
import { ResourceManager } from '../../domain/StateManager.js';
import { TrackListManager } from '../../domain/TrackList.js';

export const api = new API();

export class BaseProcessor {
    constructor() {
        this.canvas = VisualizerManager.getCanvas();
        this.canvasCtx = VisualizerManager.getContext();
    }
    setup(...args) {}

    process(...args) {}
}


export class BGImagesProcessor extends BaseProcessor {
    //pulse-zoom, track-art, trackart-provider, api-provider
    constructor(strategyType = 'track-art', imageProvider = 'trackart-provider') {
        super();
        this.imgIdx = 0;
        this.imgList = [];
        this.background = null;
        // Use a Factory to set the behavior
        this.strategy = AnimationFactory.create(strategyType); 
        this.imageProvider = ImageProviderFactory.create(imageProvider, this.strategy);
    }

    async setup() {
        // this.curImg = "def_geo.jpg";
        // this.curImg = 'img1.jpg';
        // this.curImg =  'binikini.jpg';
        // this.curImg =  'space.jpg';
        // Load the "Welcome" image first
        // await this._loadNext(`static/img1.jpg`);
        
        await this.imageProvider.setup();
        this.background = await this.imageProvider.getNextImage();
        console.log('setup this.background', this.background);
    }

    async process() {
        // 1. Logic: Update the strategy (the "Film")
        const cycleFinished = this.strategy.update();

        if (cycleFinished || !this.background) {
            this.background = await this.imageProvider.getNextImage();
        }

        // 3. Rendering: Hand everything to the Renderer
        const renderContext = {
            ctx: this.canvasCtx,
            canvasWidth: this.canvas.attribute('width'),
            canvasHeight: this.canvas.attribute('height')
        };

        const transform = this.strategy.getTransform(this.canvas, this.background);

        // The Processor no longer draws! It just calls the Renderer.
        ImageRenderer.render(renderContext, this.background, transform);
    }

    async imageLoader(img) {
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
        })
    }
}


export class GraphProcessor extends BaseProcessor {
    constructor(audioPlayer, category = 'waveform', chartName = 'heatmap-cycling-mirror-oscilloscope-wave', renderer = 'radial') {
        super();
        this.audioPlayer = audioPlayer;
        this.isReady = false;

        // 1. Synchronously create the initial engine/graph so .setup() works immediately
        this.graph = VisualizerFactory.create(category, chartName);
        this.renderer = RendererFactory.create(renderer);
        this.engine = EngineFactory.create(category);

        VisualizerManager.onSwitchVisualizer(this.setChart.bind(this), this);
    }

    async setup(fftSize) {
        await this.engine.setup(this.audioPlayer, fftSize);
        this.isReady = true;
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

        this.graph.process(renderContext, this.renderer);
    }

    async setChart(category, chartName, renderer) {
        if (!category || !chartName) return;
        if (!renderer) renderer = category === 'waveform' ? 'radial' : 'bar';

        // 2. Background creation for "Hot Swapping"
        const newGraph = VisualizerFactory.create(category, chartName);
        const newRenderer = RendererFactory.create(renderer);
        const newEngine = EngineFactory.create(category);

        // Await the setup of the NEW engine without touching the current one
        await newEngine.setup(this.audioPlayer);

        // 3. Atomic swap
        this.graph = newGraph;
        this.renderer = newRenderer;
        this.engine = newEngine;
        
        console.log("Visualizer swapped seamlessly.", {category, chartName, renderer});
    }
}


const VisualizerManager = {
    init() {
        this._initCanvas();
        this._processors = [];
        this.isRunning = false;
        this.animationId = null;
        this._events = new ListEvents();
        this._initVisualizerSelector();
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

    requestStopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
    },

    _startMainLoop() {
        const loop = () => {
            if (!this.isRunning) return;

            // We keep the canvas clearing and rendering at 60fps
            this.canvasCtx.clearRect(0, 0, this.canvas.attribute('width'), this.canvas.attribute('height'));
            
            // This will now call processor.process(), which checks its own "isReady" flag
            this._processors.forEach(({processor}) => processor.process());

            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
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
            margin: 'auto'
        }).appendTo(this.container.render());

        this.canvasCtx = this.canvas.context('2d');
    },

    _initVisualizerSelector() {
        VisualSelectManager.init(this.container);
        VisualSelectManager.onCategoryChange((category, graphName, renderer) => {
            // NOTICE: We no longer call requestStopAnimation() here!
            // We just tell the processors to start their background swap.
            this._events.trigger('onSwitchVisualizer', category, graphName, renderer);
        });
    },

    onSwitchVisualizer(cb, subscriber) {
        this._events.onEventRegister({cb, subscriber}, 'onSwitchVisualizer');
    }
}

export default VisualizerManager;