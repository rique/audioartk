import BaseRenderer from "./BaseRenderer.js";

export class RadialGradientRenderer extends BaseRenderer {
    render(renderContext) {
        const { dataArray, bufferLength, canvasWidth, canvasHeight, ctx } = renderContext;
        // const sliceWidth = canvasWidth / bufferLength;
        
        const step = Math.max(1, Math.floor(bufferLength / 900));
        const sliceWidth = (canvasWidth / bufferLength) * step;
        const centerY = (canvasHeight / 2) | 0;

        // 2. GRADIENT OPTIMIZATION: Create a gradient for the whole width
        // Center of the canvas
        const centerX = canvasWidth / 2;
        // const centerY = canvasHeight / 2;
        // Start radius 0, End radius max
        // const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvasWidth / 2);
        const gradient = ctx.createRadialGradient(canvasWidth/2, centerY, 0, canvasWidth/2, centerY, canvasWidth/2);

        gradient.addColorStop(0, `white`); 
        gradient.addColorStop(.1, 'rgb(255, 218, 96)');
        gradient.addColorStop(.20, 'rgb(255, 240, 109)');
        gradient.addColorStop(.4, 'rgb(253, 255, 125)');
        gradient.addColorStop(.65, 'rgb(255, 172, 104)');
        //gradient.addColorStop(.9, 'rgb(255, 140, 94)');
        gradient.addColorStop(.8, 'rgb(255, 105, 105)');
        gradient.addColorStop(1.0, 'rgb(83, 163, 255)');
        // 1. START OPTIMIZATION: Prepare a single path
        ctx.beginPath();

        let r, g, b, x = 0;
        // PASS 1: FORWARD (Always happens)
        for (let i = 0; i < bufferLength; i += step) {
            const audioValue = dataArray[i];
            const v = audioValue / 128.0;
            const y = (v * canvasHeight) / 2;

            renderContext.audioValue = audioValue;
            renderContext.i = i;

            // Get colors from subclass
            ({ r, g, b } = this.graph.getColorAt(i, renderContext));

            // Call draw with your exact signature
            this.graph.draw(x | 0, y | 0, i, r, g, b, ctx, 'top');
            
            x += sliceWidth;
        }
        
        // PASS 2: BACKWARD (Conditional)
        // Access the static property from the instance's constructor
        if (this.graph.constructor.isMirror) {
        // Reset X to the end to walk backwards
            x = canvasWidth; 

            for (let i = bufferLength - 1; i >= 0; i -= step) {
                const audioValue = dataArray[i];
                const v = audioValue / 128.0;
                const y = (v * canvasHeight) / 2;

                renderContext.audioValue = audioValue;
                renderContext.i = i;

                ({ r, g, b } = this.graph.getColorAt(i, renderContext));

                // Call draw backwards
                this.graph.draw(x | 0, y | 0, i, r, g, b, ctx, 'bottom');
                
                x -= sliceWidth;
            }
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        } else {
            // For non-mirrored, we just stroke the line
            ctx.strokeStyle = gradient;
            ctx.stroke();
        }

        // gradient.addColorStop(.1, `rgba(${r}, ${g}, ${b}, 1)`); 
        // gradient.addColorStop(.5, `rgba(${b}, ${r}, ${g}, 1)`);
        // gradient.addColorStop(1, `rgba(${g}, ${b}, ${r}, 1)`);
        

        // 6. SINGLE STROKE: Apply the gradient and draw once
        // ctx.strokeStyle = gradient;
        // ctx.stroke();
    }
}