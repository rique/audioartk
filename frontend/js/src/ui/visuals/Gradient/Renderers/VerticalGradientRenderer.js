import BaseRenderer from "./BaseRenderer.js";

export class VerticalGradientRenderer extends BaseRenderer {
    render(renderContext) {
        const { dataArray, bufferLength, canvasWidth, canvasHeight, ctx } = renderContext;
        const sliceWidth = canvasWidth / bufferLength;
        let x = 0;

        // 1. START OPTIMIZATION: Prepare a single path
        ctx.beginPath();
        
        // 2. GRADIENT OPTIMIZATION: Create a gradient for the whole width
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
        // const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);

        gradient.addColorStop(0.0, 'red');    // Peak (Loud)
        gradient.addColorStop(0.08, 'red'); 
        gradient.addColorStop(0.25, 'orange');
        gradient.addColorStop(0.5, 'purple'); // Silence (Center)
        gradient.addColorStop(0.75, 'orange');
        gradient.addColorStop(0.92, 'red');
        gradient.addColorStop(1.0, 'red');    // Trough (Loud)
        
        let r, g, b;
        for (let i = 0; i < bufferLength; i++) {
            const audioValue = dataArray[i];
            const v = audioValue / 128.0;
            const y = (v * canvasHeight) / 2;

            renderContext.audioValue = audioValue;
            renderContext.i = i;

            // 3. Get color components from the subclass
            ({ r, g, b } = this.graph.getColorAt(i, renderContext));

            // 5. Connect the coordinates
            this.graph.draw(x, y, i, r, g, b, ctx);

            x += sliceWidth;
        }

        // 6. SINGLE STROKE: Apply the gradient and draw once
        ctx.strokeStyle = gradient;
        /*ctx.shadowBlur = 25;
        ctx.shadowColor = `rgba(255, 50, 50, 0.6)`; // Add a purple glow*/
        ctx.stroke();
    }
}