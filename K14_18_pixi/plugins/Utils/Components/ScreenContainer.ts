import {Container} from "pixi.js";

import {Play, AnimScale} from "../Animations.ts";

import Animation = gsap.core.Animation;


export class ScreenContainer extends Container {
    private _showAnim: () => Animation;
    private _hideAnim: () => Animation;

    private _animDuration: number;

    public get animDuration(): number {
        return this._animDuration;
    }


    constructor(animDuration: number = .5, targetScale: number = 1) {
        super();

        this._animDuration = animDuration;

        this._showAnim = Play(AnimScale(this, { from: 0, to: targetScale }, animDuration, "back.out"));
        this._hideAnim = Play(AnimScale(this, { from: targetScale, to: 0 }, animDuration, "back.in"));

        this._hideAnim().play(this._hideAnim().endTime());
    }


    public async show(onComplete: () => void = () => {}) { await this._showAnim(); onComplete(); }
    public async hide(onComplete: () => void = () => {}) { await this._hideAnim(); onComplete(); }
}