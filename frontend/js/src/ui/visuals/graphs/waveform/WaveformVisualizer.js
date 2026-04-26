import { BaseWaveColorVisualizer } from "../basevisualizers/BaseWaveColorVisualizer.js";
import VisualizerFactory from '../Factory.js';


class WaveformVisualizer extends BaseWaveColorVisualizer {
    initialize({ dataArray, bufferLength, canvasWidth, canvasHeight, ctx }) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 255, 0)'; // Classic oscilloscope green
        ctx.beginPath();

        const sliceWidth = canvasWidth / bufferLength;
        let x = 0;

        this.draw(dataArray, bufferLength, canvasWidth, canvasHeight, ctx);
    }
    // We override the default behavior because we aren't drawing "bars"
    draw(dataArray, bufferLength, canvasWidth, canvasHeight, ctx) {
        

        for (let i = 0; i < bufferLength; i++) {
            // Normalize the 0-255 value to the canvas height
            // 128 is the middle of the canvas
            const v = dataArray[i] / 128.0;
            const y = (v * canvasHeight) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvasWidth, canvasHeight / 2);
        ctx.stroke();
    }
}



