import VisualizerManager, {BGImagesProcessor, GraphProcessor} from './VisualizerManager.js'

VisualizerManager.init();
const bgImgProcessor = new BGImagesProcessor();
const graphProcessor = new GraphProcessor();

export {VisualizerManager, bgImgProcessor, graphProcessor}