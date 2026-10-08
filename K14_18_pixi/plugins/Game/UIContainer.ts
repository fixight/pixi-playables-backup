import {Application, Container, Ticker} from "pixi.js";
import {clamp} from "../Utils/utils.ts";
import {Resizer} from "./Resizer.ts";


export class UIContainer extends Container {
    private _target!: Container;
    private _boundaryContainer!: Container;

    private APP: Application;
    private RESIZER: Resizer;


    constructor(app: Application, resizer: Resizer) {
        super();

        this.APP = app;
        this.RESIZER = resizer;

        this.pivot = .5;

        Ticker.shared.add(() => this.followTarget());
    }

    public setTarget(target: Container) {
        this._target = target;
    }

    public setPivot(pivot: { x: number, y: number }) {
        this.pivot = pivot;
    }

    public setBounds(boundaryContainer: Container): void {
        this._boundaryContainer = boundaryContainer;
    }


    private followTarget() {
        if (!this._target) return;

        const targetPos = this._target.position.clone();
        targetPos.x *= this._target.parent?.scale.x || 1;
        targetPos.y *= this._target.parent?.scale.y || 1;

        if (this._boundaryContainer) {
            const bounds = this._boundaryContainer.getLocalBounds();

            const minBounds = {
                x: (-bounds.x + bounds.minX) * (this._boundaryContainer.parent?.scale.x || 1) + this.RESIZER.realWidth * this.pivot.x,
                y: (-bounds.y + bounds.minY) * (this._boundaryContainer.parent?.scale.y || 1) + this.RESIZER.realHeight * this.pivot.y
            };
            const maxBounds = {
                x: (-bounds.x + bounds.maxX) * (this._boundaryContainer.parent?.scale.x || 1) - this.RESIZER.realWidth * (1 - this.pivot.x),
                y: (-bounds.y + bounds.maxY) * (this._boundaryContainer.parent?.scale.y || 1) - this.RESIZER.realHeight * (1 - this.pivot.y)
            };

            if (minBounds.x > maxBounds.x)
                targetPos.x = (minBounds.x + maxBounds.x) / 2;
            else
                targetPos.x = clamp(targetPos.x, minBounds.x, maxBounds.x);

            if (minBounds.y > maxBounds.y)
                targetPos.y = (minBounds.y + maxBounds.y) / 2;
            else
                targetPos.y = clamp(targetPos.y, minBounds.y, maxBounds.y);
        }

        this.APP.stage.pivot.set(
            targetPos.x - this.pivot.x * this.RESIZER.realWidth,
            targetPos.y - this.pivot.y * this.RESIZER.realHeight,
        );

        this.position.set(
            this.APP.stage.pivot.x,
            this.APP.stage.pivot.y,
        );
    }
}