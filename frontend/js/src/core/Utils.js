/**
 * CORE UTILITIES & UI EFFECTS
 * Consolidated from utils.js and effects.js
 */

// --- DATA & FORMATTING ---

export const generateLoremText = (numParagraphs, numWords, words) => {
    let loremText = '';
    words = words || [
        'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod',
        'tempor', 'incididunt', 'ut', 'ut', 'labore', 'et', 'dolore', 'magna', 'magnam', 'aliqua', 'Ut', 'enim',
        'in', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut',
        'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'Duis', 'aute', 'irure', 'et', 'est', 'dolor', 'in',
        'reprehenderit', 'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
        'pariatur', 'Excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'in', 'culpa',
        'qui', 'quid', 'quam', 'quo', 'officia', 'deserunt', 'mollit', 'morietur', 'anim', 'id', 'est',
        'laborum', 'besto', '10', '11', '12', '22', '28', 'Itaque', 'modorenai', 'earum', 'rerum', 'Maximus',
        'tenetur', 'a', 'sapiente', 'dominam', 'facilis', '1', '2', 'quidem', 'delectus', 'delectam', 'nobis',
        'eligendi', 'optio', 'cumque', 'impedit', 'minus', 'maxima', 'maxime', 'labora', 'placeat', 'facere',
        'possimus', 'omnis', 'alias', 'et', 'id', 'sit', '5', '8', 'vorbis', 'comentitur', 'tremens', 'quando',
        'Regis', 'expectare', 'vel', 'voluptas', 'quam', 'nihil', 'molestiae', 'consequatur', 'autem', 'Quis',
        'eum', 'iure', 'corpum', 'Corpus', 'magnam', 'aliquam', 'quaerat', 'voluptatem', 'fugit', 'perspiciatis',
        'error', 'accusantium', 'doloremque', 'dolorem', 'laudantium', 'totam', 'rem', 'aperiam', 'arepam',
        'architecto', 'beatae', 'vitae', 'dicta', 'loream', 'explicabo', 'Nemo', 'Lucius', 'aqua', 'dignissimos',
        'ducimus', 'blanditiis', 'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'dolores',
        'quas', 'molestias', 'excepturi', 'sint', 'occaecati', 'et', 'cupiditate', 'provident', 'in', 'similique',
        'sunt', 'mollitia', 'animi', 'voluptatibus', 'maiores', 'recusandae', 'cuius', 'accusamus', 'doloribus',
        'asperiores', 'perferendis', 'repellat', 'assumenda', 'quibusdam', 'eveniet'
    ];

    for (let i = 0; i < numParagraphs; i++) {
        let paragraph = '';
        for (let j = 0; j < numWords; j++) {
            let randomWord = words[Math.floor(Math.random() * words.length)];
            paragraph += randomWord + ' ';
        }
        loremText += paragraph;
    }
    return loremText;
};

export const getFormatedDate = () => {
    const DateTime = luxon.DateTime;
    const d = DateTime.now().setZone('America/Caracas');
    return d.setLocale('es').toLocaleString(DateTime.TIME_WITH_SECONDS);
};

export const uuidv4 = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
};

export const readCookie = (name) => {
    let nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export const blob2Uint8Array = (blob) => {
    return new Response(blob).arrayBuffer().then(buffer => {
        return [...new Uint8Array(buffer)];
    });
};

export const base64ToBlob = (base64String) => {
    const block = base64String.split(";");
    const contentType = block[0].split(":")[1] || 'image/jpeg';
    const realData = block[1].split(",")[1];

    const byteCharacters = atob(realData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};

// --- DOM HELPERS ---

export const clearElementInnerHTML = (element) => {
    while (element.firstChild)
        element.removeChild(element.firstChild);
};

export const getLastParent = (elem, depth) => {
    let counter = 0;
    while (elem.parentElement && elem.parentElement != document.body) {
        elem = elem.parentElement;
        if (typeof depth === 'number' && depth > counter) {
            break;
        }
        ++counter;
    }
    return elem;
};

export const whileMousePressedAndMove = (element, cb, doMouseout = false) => {
    let mouseID = -1;

    const mousedown = (evt) => {
        mouseID = 1;
        cb.call(cb, evt, true);
    }

    const mousemove = (evt) => {
        if (mouseID != -1) {
            cb.call(cb, evt, true);
        }
    };

    const mouseup = (evt) => {
        if (mouseID != -1) {
            mouseID = -1;
            cb.call(cb, evt, false);
        }
    }

    element.addEventListener("mousedown", mousedown);
    document.addEventListener('mousemove', mousemove);
    document.addEventListener("mouseup", mouseup);

    if (doMouseout)
        element.addEventListener('mouseout', mouseup);
};

export const whileMousePressed = (element, cb, interval = 100) => {
    let mouseID = -1;

    const mousedown = (evt) => {
        if (mouseID == -1)
            mouseID = setInterval(cb.bind(cb, evt), interval);
    }

    const mouseup = () => {
        if (mouseID != -1) {
            clearInterval(mouseID);
            mouseID = -1;
        }
    }

    element.addEventListener("mousedown", mousedown);
    element.addEventListener("mouseup", mouseup);
    element.addEventListener("mouseout", mouseup);
};

export function getRandomInt(min, max) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    let randomNumber = randomBuffer[0] / (0xffffffff + 1);
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(randomNumber * (max - min + 1)) + min;
}

export const getPercentageWidthFromMousePosition = (clientX, htmlItem, margin = 0) => {
    let widthPixel = (clientX - margin) - (htmlItem.offsetLeft() + htmlItem.offsetParent().offsetLeft),
        totalWidth = htmlItem.offsetWidth();
    return widthPixel / totalWidth;
}

export const shuffle = (list, index) => {
    if (!list instanceof Array || list.length === 0) {
        console.warn('Invalid list', {list});
        return []
    }

    let item;
    if (!isNaN(index))
        [item] = list.splice(index, 1);

    for (let i = list.length - 1; i > 0; i--) {
        let j = Math.floor(getRandomInt(0, i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    if (item)
        list.splice(0, 0, item);
    return list;
}

/**
 * Calculates geometric properties for N bars within an SVG.
 * @param {Object} config - The layout configuration.
 * @returns {Array} Array of objects {x, y, width, height}
 */
export const calculateBarLayout = ({
    totalWidth, 
    totalHeight, 
    nBars, 
    padding, 
    gap, 
    maxHeight
}) => {
    if (nBars <= 0) return [];

    if (isNaN(totalWidth) || totalWidth <= 0 || isNaN(totalHeight) || totalHeight <= 0) {
        console.warn('Invalid width and/or height!', {totalWidth, totalHeight});
        return [];
    }
    
    if (isNaN(padding) || padding < 0) {
        console.warn('Invalid padding values, setting it to 0', {padding});
        padding = 0;
    }

    const availableWidth = totalWidth - (2 * padding);
    
    if (availableWidth <= 0) {
        console.warn('The width is invalid!', {availableWidth});
        return [];
    }

    // Safety: Ensure gap isn't physically impossible
    const maxPossibleGap = (availableWidth * 0.7) / Math.max(1, nBars - 1);
    const safeGap = gap > maxPossibleGap ? maxPossibleGap : gap;

    const barWidth = (availableWidth - ((nBars - 1) * safeGap)) / nBars;
    let y = totalHeight;

    if (!isNaN(maxHeight) && maxHeight > 0) y = y - maxHeight;
    
    return Array.from({ length: nBars }, (_, i) => ({
        x: parseFloat((padding + (i * (barWidth + safeGap))).toFixed(2)),
        y,
        width: parseFloat(barWidth.toFixed(2)),
        height: maxHeight
    }));
};

// --- UI EFFECTS ---

export class Fader {
    constructor() {
        this._animation = null;
    }

    fadeIn(elem, duration = 500, startOpacity = 0, endOpacity = 1, whenDone, ...args) {
        this._fade(elem, duration, startOpacity, endOpacity, false, whenDone, ...args);
    }

    fadeOut(elem, duration = 500, startOpacity = 1, endOpacity = 0, whenDone, ...args) {
        this._fade(elem, duration, startOpacity, endOpacity, true, whenDone, ...args);
    }

    cancelFade() {
        if (this._animation) {
            this._animation.cancel();
        }
    }

    _fade(elem, duration, start, end, isFadingOut, whenDone, ...args) {
        if (!isFadingOut && elem.style.display == 'none')
            elem.style.display = 'block';

        const keyFrames = [{ opacity: start }, { opacity: end }];
        const kfEffect = new KeyframeEffect(elem, keyFrames, { duration });

        this._animation = new Animation(kfEffect, document.timeline);
        this._animation.play();

        this._animation.onfinish = () => {
            if (isFadingOut) elem.style.display = 'none';
            if (typeof whenDone === 'function') whenDone(elem, ...args);
            this._animation = null;
        };

        if (typeof whenDone === 'function') {
            this._animation.oncancel = () => {
                whenDone(elem, ...args);
                this._animation = null;
            };
        }
    }
}