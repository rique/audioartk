// AnimationFactory.js
export class AnimationFactory {
    // Private registry of strategies
    static #registry = new Map();

    /**
     * Registers a new animation strategy.
     * @param {string} key - The name used to identify the animation.
     * @param {class} StrategyClass - The class definition.
     */
    static register(key, StrategyClass) {
        this.#registry.set(key, StrategyClass);
        console.log(`Animation registered: ${key}`);
    }

    /**
     * Creates an instance of a registered strategy.
     */
    static create(key) {
        const StrategyClass = this.#registry.get(key);
        
        if (!StrategyClass) {
            console.warn(`Strategy "${key}" not found. Falling back to default.`);
            // You can return a default or the first one registered
            const DefaultClass = this.#registry.values().next().value;
            return DefaultClass ? new DefaultClass() : null;
        }

        return new StrategyClass();
    }

    static getAvailableTypes() {
        return Array.from(this.#registry.keys());
    }
}