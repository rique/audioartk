import { API } from "../../../../core/HttpClient.js";
import { ResourceManager } from "../../../../domain/StateManager.js";
import { ImageProviderFactory } from "./ImageProviderFactory.js";
import { AudioPlayer } from "../../../../domain/AudioPlayer.js";
import { ApiImageMediator } from "../mediators/ApiImageMediator.js";
import { TrackArtMediator } from "../mediators/TrackArtMediator.js";

class BaseImageProvider {
    getNextImage() {}
    async setup() {}
    async _imageLoader(img) {
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    }
}

export class ApiImageProvider extends BaseImageProvider {
    constructor()  {
        super()
        this.api = new API();
        this.imgList = [];
        this.imgIdx = 0;
    }

    async setup() {
        await this._loadImageList();
    }

    async getNextImage() {
        console.log('getNextImage')
        const img = await this._loadImage();
        this.imgIdx = (this.imgIdx + 1) % this.imgList.length;
        return img;
    }

    async _loadImage() {
        let img = new Image();
        const path = '/' + this.imgList[this.imgIdx].split('/').map(segment => encodeURIComponent(segment)).join('/');
        img.src = path;

        try {
            // We update this.background only after the new image has fully loaded
            img = await this._imageLoader(img);
        } catch (e) {
            console.error(`Failed to load background image at ${path}`, e);
            return;
        }

        return img;
    }

    async getPreviousImage() {
        this.imgIdx = (this.imgIdx - 1 + this.imgList.length) % this.imgList.length; 
        return await this._loadImage();
    }


    async _loadImageList() {
        const result = await this.api.loadBGImages();
        this.imgList = result['img_list'];
    }
}

export class TrackAlbumArtImageProvider extends BaseImageProvider {
    constructor() {
        super()
        this.img = null;
        this.hasChangedTrack = false;
    }

    async trackChange(track) {
        this.hasChangedTrack = false;
        // 2. Fetch the new image using your ResourceManager
        const url = ResourceManager.getAlbumArtURL(track);
        
        // 3. Load the image object
        const img = new Image();
        img.src = url;

        // 4. Wait for it to load, then assign it to the property 
        // the renderer uses (likely this.background or this.img)
        this.img = await this._imageLoader(img);
        this.hasChangedTrack = true;
    }

    async getNextImage() {
        if (!this.img || !this.hasChangedTrack) return;
        this.hasChangedTrack = false;
        return await this.img;
    }
}

ImageProviderFactory.register('api-provider', ApiImageProvider, ApiImageMediator);
ImageProviderFactory.register('trackart-provider', TrackAlbumArtImageProvider, TrackArtMediator);