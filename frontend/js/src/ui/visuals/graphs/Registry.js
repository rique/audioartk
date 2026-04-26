import VisualizerFactory from './Factory.js';
import EngineFactory from './engines/EngineFactory.js'

import "./barchart/BarChartColorVizualizer.js";
import './waveform/WaveformVisualizer.js';
import './engines/VisualizerEngines.js';

const manifest = VisualizerFactory.getManifest();
console.log('le manifest, le manifest, stop la violence!', {manifest});

export {VisualizerFactory, EngineFactory};