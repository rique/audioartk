export class ImageRenderer {
    static render(renderContext, img, transform) {
        const { ctx, canvasWidth, canvasHeight } = renderContext;
        const { scale, alpha, offsetX = 0, offsetY = 0 } = transform;

        // 1. Clear the frame
        ctx.fillStyle = "#181717";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (!img) return;

        // 2. Calculate dimensions based on the scale provided by the strategy
        const w = img.width * scale;
        const h = img.height * scale;
        
        // 3. Center the image
        const x = (canvasWidth / 2) - (w / 2) + offsetX; // Apply the glitch shift!
        const y = (canvasHeight / 2) - (h / 2) + offsetY;

        // 4. Paint
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, x, y, w, h);
        ctx.globalAlpha = 1;
    }
}