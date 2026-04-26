export default class BaseEngine {
    constructor() {
        this.context = {};
    }
    setup(audioPlayer, fftSize) {}
    getContext() {
        return this.context;
    }
    mergeContext(context) {
        this.context = {...this.context, ...context};
    }
    _buildContext() {
        for (const [key, val] of Object.entries(this)) {
			if (key === 'context') continue;
			
			this.context[key] = val;
		}
    }
}