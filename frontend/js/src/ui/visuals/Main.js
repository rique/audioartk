import VisualizerManager, {BGImagesProcessor, GraphProcessor} from './VisualizerManager.js'
import { visualizerManifest } from './graphs/Registry.js';
import { AnimationFactory, ImageRenderer, ImageProviderFactory } from './slideshows/Registry.js';

VisualizerManager.init();

export {VisualizerManager, AnimationFactory, ImageRenderer, BGImagesProcessor, GraphProcessor, ImageProviderFactory, visualizerManifest}