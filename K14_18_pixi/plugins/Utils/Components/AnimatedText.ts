import {CanvasTextOptions, Text} from "pixi.js";

import * as PIXI from "pixi.js";
import {gsap} from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);

export class AnimatedText extends Text {
    private _value: number;
    private _animDuration: number;
    private _prefix: string;
    private _postfix: string;
    private _roundTo: number;


    constructor(options?: CanvasTextOptions, initValue: number = 0, animDuration: number = .5, prefix: string = "", postfix: string = "", roundTo: number = 0) {
        super(options);

        this._value = initValue;
        this._animDuration = animDuration;
        this._prefix = prefix;
        this._postfix = postfix;
        this._roundTo = roundTo;

        this.refreshView();
    }

    public async setValue(value: number, targetValue: number) {
        this._value = value;
        await gsap.to(this, {
            duration: this._animDuration,
            ease: 'power2.inOut',
            _value: targetValue,
            onUpdate: () => this.refreshView(),
        })
    }


    private refreshView() {
        this.text = `${this._prefix}${this._value.toFixed(this._roundTo)}${this._postfix}`;
    }
}