import { HorizontalGradientRenderer } from "./HorizontalGradientRenderer.js";
import { VerticalGradientRenderer } from "./VerticalGradientRenderer.js";
import { RadialGradientRenderer } from "./RadialGradientRenderer.js";
import { BarRenderer } from "./BarRenderer.js";


const RendererFactory = {
    // Map categories to Engine classes
    mapping: {
        'horizontal': HorizontalGradientRenderer,
        'vertical': VerticalGradientRenderer,
        'radial': RadialGradientRenderer,
        'bar': BarRenderer
    },

    create(renderer = 'horizontal', graph) {
        const RendererClass = this.mapping[renderer];
        
        if (!RendererClass) {
            // Default to BarChartEngine if category isn't found
            console.warn(`No renderer found for ${renderer}, defaulting to HorizontalGradientRenderer.`);
            return new HorizontalGradientRenderer(graph);
        }

        return new RendererClass(graph);
    }
};

export default RendererFactory;