import { BaseAudioModule, BaseCompositeModule } from "./BaseModules.js";

export class EqChannelModule extends BaseAudioModule {
    constructor(ctx, type, frequencyValue, q) {
        super(ctx);
        this.node = this.ctx.createBiquadFilter();
        this.setype(type);
        this.setFrequencyValue(frequencyValue);
        this.setQValue(q);
    }

    setype(type) {
        if (!type) {
            return console.error('Invalid Eq node type given', type);
        }
        if (!this.node) return;

        this.node.type = type;
    }

    setFrequencyValue(frequencyValue) {
        if (!frequencyValue) {
            return console.error('Invalid Eq node frequency value given', frequencyValue);
        }
        if (!this.node) return;

        this.node.frequency.value = frequencyValue;
    }

    setQValue(q) {
        if (!this.node) return;
        this.node.Q.value = q ?? this.node.Q.value;
    }

    setGain(db) {
        this.node.gain.setTargetAtTime(db, this.node.context.currentTime, 0.1);
    }
}

export class TrippleChannelEqModule extends BaseCompositeModule {
    constructor(ctx, inputNode) {
        super(ctx);

        this._setupEqNodes(inputNode);
    }

    _setupEqNodes(inputNode) {
        this.lowShelf = new EqChannelModule(this.ctx, 'lowshelf', 200);
        this.midBand  = new EqChannelModule(this.ctx, 'peaking', 1000, 1);
        this.highShelf = new EqChannelModule(this.ctx, 'highshelf', 3000);
        this.lowShelf.patchTo(this.midBand.getNode());
        this.midBand.patchTo(this.highShelf.getNode());
        this.highShelf.patchTo(inputNode);
    }

    patchOn(source) {
        source.connect(this.lowShelf.getNode());
    }

    bass(db, q) {
        this.lowShelf.setQValue(q);
        this.lowShelf.setGain(db);
    }

    mid(db, q) {
        this.midBand.setQValue(q);
        this.midBand.setGain(db);
    }

    trebble(db, q) {
        this.highShelf.setQValue(q);
        this.highShelf.setGain(db);
    }
}