export class ImageProviderFactory {
    // Private registry of strategies
    static #registry = new Map();

    /**
     * Registers a new animation strategy.
     * @param {string} key - The name used to identify the animation.
     * @param {class} ImageProviderClass - The class definition.
     */
    static register(key, ImageProviderClass, MediaTorClass) {
        this.#registry.set(key, {ImageProviderClass, MediaTorClass});
        console.log(`Image Provider registered: ${key}`);
    }

    /**
     * Creates an instance of a registered strategy.
     */
    static create(key, startegy, config = {}) {
        let {ImageProviderClass, MediaTorClass} = this.#registry.get(key);
        
        if (!ImageProviderClass) {
            console.warn(`Image Provider "${key}" not found. Falling back to default.`);
            // You can return a default or the first one registered
            ({ImageProviderClass, MediaTorClass} = this.#registry.values().next().value);
        }

        if (!ImageProviderClass)
            return null;

        const provider = new ImageProviderClass(config);
        return new MediaTorClass(startegy, provider);
    }

    static getAvailableTypes() {
        return Array.from(this.#registry.keys());
    }
}