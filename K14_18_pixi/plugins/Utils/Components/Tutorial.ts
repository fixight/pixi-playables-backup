import {Assets, Sprite} from "pixi.js";

import {AnimAlpha, AnimAmplitude, Play} from "../Animations.ts";

import Animation = gsap.core.Animation;


export class Tutorial extends Sprite {
    private readonly _duration: number;
    private readonly _amplitude: number;

    private _showAnim: () => Animation;
    private _hideAnim: () => Animation;


    constructor(tutorialKey: string = "tutorial", amplitude: number = 25, duration: number = .5) {
        super();

        this._duration = duration;
        this._amplitude = amplitude;

        this.texture = Assets.get(tutorialKey);

        AnimAmplitude(this, { x: this._amplitude, y: this._amplitude }, this._duration);

        this._showAnim = Play(AnimAlpha(this, { from: 0, to: 1 }, this._duration));
        this._hideAnim = Play(AnimAlpha(this, { from: 1, to: 0 }, this._duration));
    }

    public async show(onComplete: () => void = () => {}) { await this._showAnim(); onComplete(); }
    public async hide(onComplete: () => void = () => {}) { await this._hideAnim(); onComplete(); }
}