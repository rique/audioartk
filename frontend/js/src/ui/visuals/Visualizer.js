import {getFormatedDate} from '../../core/Utils.js';
import { CanvasItem } from './canvas/CanvasItem.js';
import VisualizerFactory from './graphs/Registry.js';

const setUp = (audioPlayer, imgList) => {
    const audioCtx = new AudioContext();
    const audioSourceNode = audioCtx.createMediaElementSource(audioPlayer.audioElem);

    //Create analyser node
    const analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    //Set up audio node network
    audioSourceNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    //Create 2D canvas
    const canvas = new CanvasItem({
        width: window.innerWidth, 
        height: window.innerHeight, 
        padWidth: 36, 
        padHeight: 182, 
        autoResize: true
    }).appendTo(document.body);
    canvas.css({
        display: 'block',
        margin: 'auto'
    });
    const canvasCtx = canvas.context('2d');
    canvasCtx.clearRect(0, 0, canvas.attribute('width'), canvas.attribute('height'));
    let curImg = 'img1.jpg';
    let background = new Image();
    background.src = `https://audioartk.me/static/${curImg}`;

    background.onload = () => {
        console.log('img loaded', background.width, background.height, canvas.attribute('width'), canvas.attribute('height'));
        let width = 0, height = 0, x = 0, y = 0;
        //let coef = (canvas.width / background.width) * .8;
        let coef = (canvas.attribute('width') / background.height) * 1.05;
        width = background.width * coef;
        height = background.height * coef;
        x = parseInt((canvas.attribute('width') / 2) - (width / 2));
        canvasCtx.globalAlpha = .1;
        canvasCtx.drawImage(background, x, y, width, height);
        canvasCtx.globalAlpha = 1;
        
        draw(0, true, 0);
    }

    const redToPurpel = VisualizerFactory.create('barchart', 'red-to-purple', canvasCtx);
    /*
    c -> Alpha coefficient for the image being loaded, also used to determine when to load the next image
    d -> is fading in or out: true -> fading in, false -> fading out
    i -> index of the image to be loaded next
    */
    const draw = (alphaCoef, doFadeIn, imgIdx) => {

        if (doFadeIn)
            alphaCoef += 1;
        else
            alphaCoef -= 1;
        if (alphaCoef >= 2328)
            doFadeIn = false;
        else if (alphaCoef == 0) {
            doFadeIn = true;
            curImg = encodeURI(`${imgList[imgIdx]}`);
            background = new Image();
            background.src = `https://audioartk.me/${curImg}`;
            ++imgIdx;
            if (imgIdx >= imgList.length)
                imgIdx = 0;
        }
        

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = "#181717";
        canvasCtx.fillRect(0, 0, canvas.attribute('width'), canvas.attribute('height'));
        
        let width, height, x, y = 0;
        // let coef = (canvas.width / background.width) * .8;
        // determine coeficient of the speed in which the image proportions are increased/decreased
        let coef = (canvas.attribute('height') / background.height) * (1.05 + (alphaCoef / 3008));
        width =  background.width * coef;
        height = background.height * coef;
        let alphaVal = alphaCoef;

        if (alphaVal >= 610)
            alphaVal = 610;
        else if (alphaVal <= 0)
            alphaVal = 0

        canvasCtx.globalAlpha = alphaVal / 1000;
        x = parseInt((canvas.attribute('width') / 2) - (width / 2));
        canvasCtx.drawImage(background, x, y, width, height);
        canvasCtx.globalAlpha = 1;
        //Draw spectrum
        const barWidth = (canvas.attribute('width') / bufferLength); // * 2.2;
        let posX = 0, posY = 0, maxBarHeight = (255 + 140) * 2;
        const dateText = getFormatedDate();
        const time = Date.now() * 0.002;
        for (let i = 0; i < bufferLength; i++) {
            const audioValue = dataArray[i];
            const barHeight = (audioValue + 140) * 2;
            posY = canvas.attribute('height') - barHeight * 2;
            canvasCtx.fillStyle = redToPurpel.initialize({barHeight, light: '70%'});
            canvasCtx.fillRect(
                posX,
                posY,
                barWidth,
                barHeight * 2,
            );
            canvasCtx.font = "25px sans-serif";
            canvasCtx.textAlign = 'left';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(dateText, 10, 36);
            canvasCtx.font = "15px sans-serif";
            canvasCtx.textAlign = 'center';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(Math.round(barHeight).toString(), posX + 10, posY - 5, barWidth);
            posX += barWidth + 1;
        }

        //Schedule next redraw
        requestAnimationFrame(() => {
            draw(alphaCoef, doFadeIn, imgIdx);
        });
    };
}
const Vizualizer = {
    draw: setUp
}

export default Vizualizer.draw;
