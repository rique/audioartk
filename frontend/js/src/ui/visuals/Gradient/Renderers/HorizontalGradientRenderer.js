import BaseRenderer from "./BaseRenderer.js";

export class HorizontalGradientRenderer extends BaseRenderer {
    render(renderContext, graph) {
        const { dataArray, bufferLength, canvasWidth, canvasHeight, ctx } = renderContext;
        const sliceWidth = canvasWidth / bufferLength;
        let x = 0;

        // 1. START OPTIMIZATION: Prepare a single path
        ctx.beginPath();
        // 2. GRADIENT OPTIMIZATION: Create a gradient for the whole width
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
        let r, g, b;
        for (let i = 0; i < bufferLength; i++) {
            const audioValue = dataArray[i];
            const v = audioValue / 128.0;
            const y = (v * canvasHeight) / 2;

            renderContext.audioValue = audioValue;
            renderContext.i = i;

            // 3. Get color components from the subclass
            ({ r, g, b } = graph.getColorAt(i, renderContext));

            // 4. Add a color stop for this specific point (i / bufferLength is 0.0 to 1.0)
            // Note: Adding 2048 stops can be heavy; usually 10-20 stops is enough.
            if (i % 16 === 0 || i === bufferLength - 1) {
                gradient.addColorStop(i / (bufferLength - 1), `rgba(${r}, ${g}, ${b}, .6)`);
            }

            // 5. Connect the coordinates
            graph.draw(x, y, i, r, g, b, ctx);

            x += sliceWidth;
        }

        // 6. SINGLE STROKE: Apply the gradient and draw once
        ctx.strokeStyle = gradient;
        /*ctx.shadowBlur = 25;
        ctx.shadowColor = `rgba(255, 50, 50, 0.6)`; // Add a purple glow*/
        ctx.stroke();
    }
}