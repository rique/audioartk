export class BaseAudioModule {
    constructor(ctx) {
        this.ctx = ctx;
    }
    patchTo(node) {
        this.node.connect(node);
    }

    getNode() {
        return this.node;
    }
}

export class BaseCompositeModule {
    constructor(ctx) {
        this.nodes = [];
        this.ctx = ctx;
    }

    addNodes(...nodes) {
        this.nodes.push(...nodes);
    }
}
