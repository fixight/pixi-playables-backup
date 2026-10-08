import {DestroyOptions, Graphics} from "pixi.js";
import {Resizer} from "../../Game/Resizer.ts";

import {Play, AnimAlpha} from "../Animations.ts";

import Animation = gsap.core.Animation;


export class Cover extends Graphics {
    private _resizer: Resizer;

    private _animDuration: number;

    public get animDuration(): number {
        return this._animDuration;
    }

    private _showAnim: () => Animation;
    private _hideAnim: () => Animation;


    private resizeAction = (width: number, height: number) => {
        this.clear()
            .rect(-width / 2, -height / 2, width, height,)
            .fill("black")
    };


    constructor(resizer: Resizer, alpha: number = .5, animDuration: number = .5) {
        super();
        this._resizer = resizer;

        this._animDuration = animDuration;

        this._showAnim = Play(AnimAlpha(this, { from: 0, to: alpha }, animDuration));
        this._hideAnim = Play(AnimAlpha(this, { from: alpha, to: 0 }, animDuration));

        this._hideAnim().play(this._hideAnim().endTime());

        this._resizer.addResizeAction(this.uid, this.resizeAction);
    }

    destroy(options?: DestroyOptions) {
        this._resizer.removeResizeAction(this.uid);

        super.destroy(options);
    }


    public async show(onComplete: () => void = () => {}) { await this._showAnim(); onComplete(); }
    public async hide(onComplete: () => void = () => {}) { await this._hideAnim(); onComplete(); }
}