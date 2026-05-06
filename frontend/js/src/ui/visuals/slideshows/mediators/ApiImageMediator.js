export class ApiImageMediator {
    constructor(strategy, provider) {
        this.strategy = strategy;
        this.provider = provider;
    }

    async getNextImage() {
        return await this.provider.getNextImage();
    }

    async setup() {
        return await this.provider.setup();
    }

    destroy() {}
}
