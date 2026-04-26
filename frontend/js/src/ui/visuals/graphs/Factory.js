const VisualizerFactory = {
    // Structure: { 'bar': Map, 'radial': Map, 'physics': Map }
    categories: new Map(),

    register(category, type, cls) {
        if (!this.categories.has(category)) {
            this.categories.set(category, new Map());
        }
        this.categories.get(category).set(type, cls);
    },

    create(category, type, ...args) {
        const cat = this.categories.get(category);
        if (!cat) throw new Error(`Category ${category} not found`);
        
        const cls = cat.get(type);
        if (!cls) throw new Error(`Type ${type} not found in ${category}`);
        
        return new cls(...args);
    },

    getManifest() {
        const manifest = {};
        this.categories.forEach((map, catName) => {
            manifest[catName] = Array.from(map.keys());
        });
        return manifest;
    }
}

export default VisualizerFactory; 