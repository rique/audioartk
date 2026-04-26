// graphs/engines/EngineFactory.js
import { BarChartEngine, WaveformEngine } from './VisualizerEngines.js';

const EngineFactory = {
    // Map categories to Engine classes
    mapping: {
        'barchart': BarChartEngine,
        'waveform': WaveformEngine,
        // 'particles': ParticlePhysicsEngine,  <-- Future expansion
        // 'webgl': ThreeJSEngine,              <-- Future expansion
    },

    create(category) {
        const EngineClass = this.mapping[category];
        
        if (!EngineClass) {
            // Default to BarChartEngine if category isn't found
            console.warn(`No engine found for ${category}, defaulting to BarChart.`);
            return new BarChartEngine();
        }

        return new EngineClass();
    }
};

export default EngineFactory;
