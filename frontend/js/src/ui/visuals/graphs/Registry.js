import VisualizerFactory from './Factory.js';

import "./barchart/BarChartColorVizualizer.js"
const manifest = VisualizerFactory.getManifest();
console.log('le manifest, le manifest', {manifest});
export default VisualizerFactory;