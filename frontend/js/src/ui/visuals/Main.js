import VisualizerManager, {BGImagesProcessor, GraphProcessor} from './VisualizerManager.js'
import { visualizerManifest } from './graphs/Registry.js';

VisualizerManager.init();

export {VisualizerManager, BGImagesProcessor, GraphProcessor, visualizerManifest}