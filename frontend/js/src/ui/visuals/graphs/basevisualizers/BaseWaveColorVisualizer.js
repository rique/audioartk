import BaseVisualizer from "./BaseVisualizer.js";
import {getFormatedDate} from '../../../../core/Utils.js';

export class BaseWaveColorVisualizer extends BaseVisualizer {
    process(renderContext) {
        const dateText = getFormatedDate();
        const { dataArray, bufferLength, canvasWidth, canvasHeight, ctx } = renderContext;
        const sliceWidth = canvasWidth / bufferLength;
        let x = 0;

        // 1. START OPTIMIZATION: Prepare a single path
        ctx.beginPath();
        
        // 2. GRADIENT OPTIMIZATION: Create a gradient for the whole width
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);

        for (let i = 0; i < bufferLength; i++) {
            const audioValue = dataArray[i];
            const v = audioValue / 128.0;
            const y = (v * canvasHeight) / 2;

            renderContext.audioValue = audioValue;
            renderContext.i = i;

            // 3. Get color components from the subclass
            const { r, g, b } = this.initialize(renderContext);

            // 4. Add a color stop for this specific point (i / bufferLength is 0.0 to 1.0)
            // Note: Adding 2048 stops can be heavy; usually 10-20 stops is enough.
            if (i % 16 === 0 || i === bufferLength - 1) { 
                gradient.addColorStop(i / (bufferLength - 1), `rgba(${r}, ${g}, ${b}, .6)`);
            }

            // 5. Connect the coordinates
            this.draw(x, y, i, r, g, b, ctx);

            x += sliceWidth;
        }

        // 6. SINGLE STROKE: Apply the gradient and draw once
        ctx.strokeStyle = gradient;
        ctx.stroke();

        this._displayOverlay(dateText, ctx);
    }
    _displayOverlay(dateText, ctx) {
        ctx.font = "25px sans-serif";
        ctx.textAlign = 'left';
        ctx.fillStyle = `#f1f1f1`;
        ctx.fillText(dateText, 10, 36);
    }
}