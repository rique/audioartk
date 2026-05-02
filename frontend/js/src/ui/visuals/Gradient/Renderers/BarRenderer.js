import BaseRenderer from "./BaseRenderer.js";

export class BarRenderer extends BaseRenderer {
    render(renderContext, graph) {
        const {ctx, canvasHeight, bufferLength, canvasWidth} = renderContext;
        const barWidth = (canvasWidth / bufferLength);
        let posX = 0;

        // 1. Prepare the graph for the frame
        graph.initialize(renderContext);

        for (let i = 0; i < bufferLength; i++) {
            const audioValue = renderContext.dataArray[i];
            const barHeight = (audioValue + 140) * 2;
            const posY = canvasHeight - barHeight * 2;

            // 2. Get the specific color for THIS bar from the graph
            const { h, s, l, a } = graph.getColorAt(i, renderContext);
            
            // 3. Apply the color and draw the bar
            ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;
            ctx.fillRect(posX, posY, barWidth, barHeight * 2);

            // 4. Draw the text label
            ctx.fillStyle = `#f1f1f1`;
            ctx.fillText(
                Math.round(barHeight).toString(), 
                posX + (barWidth / 2), 
                posY - 5
            );

            posX += barWidth + 1;
        }
    }
}