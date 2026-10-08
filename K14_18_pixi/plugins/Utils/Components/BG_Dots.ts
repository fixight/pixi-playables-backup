import {Color, Container, Graphics} from "pixi.js";
import {gsap} from 'gsap';
import Physics2DPlugin from 'gsap/Physics2DPlugin';
import {random} from "../utils";

// @ts-expect-error API
import Tween = gsap.core.Tween;

gsap.registerPlugin(Physics2DPlugin);

export interface BG_DotsParams {
    amount: number,
    durationMin: number,
    durationMax: number,
    sizeMin: number,
    sizeMax: number,
    color1: Color,
    color2: Color,
    velocity1: number,
    velocity2: number,
}

export class BG_Dots extends Container {
    private _params!: BG_DotsParams;

    private _dots: Graphics[] = [];
    private _dotTweens: Tween[] = [];


    constructor(params: BG_DotsParams) {
        super();
        this._params = params;
    }

    public showDots(): void {
        if (!this._dots || this._dots.length <= 0)
            this.createDots();

        this._dots.forEach(dot => dot.alpha = 1);
    }

    public hideDots(): void {
        if (!this._dots || this._dots.length <= 0)
            return;

        this._dots.forEach(dot => dot.alpha = 0);
    }

    public recreateDots() {
        if (this._dots && this._dots.length > 0)
            this.destroyDots();

        this.createDots();
    }

    public destroyDots(): void {
        if (!this._dots || this._dots.length <= 0)
            return;

        this._dots.forEach((dot, i) => {
            dot.destroy();
            this._dotTweens[i].kill();
        });
        this._dots.length = 0;
        this._dotTweens.length = 0;
    }


    private createDots() {
        for (let i = 0; i < this._params.amount; i++) {
            const x = this.width * Math.random();
            const y = this.height * Math.random();

            const size = random(this._params.sizeMin, this._params.sizeMax);
            const color = random(this._params.color1.toNumber(), this._params.color2.toNumber());

            const dot = new Graphics()
                .circle(0, 0, size)
                .fill(color);

            dot.position.set(x, y);

            this.addChild(dot);
            this._dots[i] = dot;

            this._dotTweens[i] = gsap.to(dot, {
                physics2D: {
                    velocity: random(-1, 1) * random(this._params.velocity1, this._params.velocity2),
                    gravity: random(-1, 1) * random(this._params.velocity1, this._params.velocity2),
                    angle: random(-360, -360),
                },
                alpha: 0,
                duration: random(this._params.durationMin, this._params.durationMax),
                ease: 'power1.out',
                repeat: -1,
                delay: i * -0.2,
                onComplete: () => { // Reset
                    dot.x = x;
                    dot.y = y;
                    dot.scale.set(1);
                    dot.alpha = 1;
                },
            });
        }
    }
}