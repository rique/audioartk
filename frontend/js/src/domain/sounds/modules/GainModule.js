import { BaseAudioModule, BaseCompositeModule } from "./BaseModules.js";

export class GainModule extends BaseAudioModule {
    constructor(ctx) {
        super(ctx)
        this.node = this.ctx.createGain();
        this.userVolume = 1.0;
        this.isMuted = false;
    }

    setVolume(value, duration = 0.01) {
        this.userVolume = Math.max(0.0001, Math.min(1, value));
        const now = this.node.context.currentTime;
        this.node.gain.cancelScheduledValues(now);
        this.node.gain.linearRampToValueAtTime(this.userVolume, now + duration);
    }

    volume() {
        return this.node.gain.value;
    }

    async fadeIn(duration = 1.0, mode = 'linear') {
        const now = this.ctx.currentTime;
        this.node.gain.cancelScheduledValues(now);
        
        // Anchor to current actual volume (prevents clicks if you hit play while it's still fading out)
        const currentActualVolume = Math.max(0.0001, this.volume());
        this.node.gain.setValueAtTime(currentActualVolume, now);
        
        // Ramp up to the CACHED user volume
        if (mode == 'exp') {
            this.node.gain.exponentialRampToValueAtTime(this.userVolume, now + duration);
        } else {
            this.node.gain.linearRampToValueAtTime(this.userVolume, now + duration);
        }

        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    fadeOut(duration = 1.0, mode = 'linear') {
        const now = this.ctx.currentTime;
        this.node.gain.cancelScheduledValues(now);
        
        // Grab exactly where the volume is right now
        this.node.gain.setValueAtTime(this.volume(), now);
        
        // Ramp to zero
        if (mode == 'exp') {
            this.node.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            this.node.gain.setValueAtTime(0, now + duration + 0.01);
        } else {
            this.node.gain.linearRampToValueAtTime(0, now + duration);
        }

        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    async mute() {
        console.log('mute1', this.isMuted, this.volume())
        if (this.isMuted)
            await this.fadeIn(.1);
        else
            await this.fadeOut(.1);
        console.log('mute2', this.isMuted);
        this.isMuted = !this.isMuted;
        console.log('mute3', this.isMuted);
    }   
}
