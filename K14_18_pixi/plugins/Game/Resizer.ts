import { Application } from "pixi.js";
import { debounceFunc } from "../Utils/utils.ts";

export type ResizeAction = (w: number, h: number) => void;

export class Resizer {
  private _app: Application;

  private _designWidth: number;
  private _designHeight: number;
  private _designAspectRatio: number;

  private _resizeActions: Map<number, ResizeAction>;

  private _realWidth: number = -1;
  private _realHeight: number = -1;

  private _started: boolean = false;

  public get designAspectRatio(): number {
    return this._designAspectRatio;
  }

  public get realWidth(): number {
    return this._realWidth;
  }
  public get realHeight(): number {
    return this._realHeight;
  }

  public get canvasWidth(): number {
    return this._app.canvas.width;
  }
  public get canvasHeight(): number {
    return this._app.canvas.height;
  }

  public constructor(app: Application, designSize: { x: number; y: number }) {
    this._app = app;

    this._designWidth = designSize.x;
    this._designHeight = designSize.y;
    this._designAspectRatio = this._designWidth / this._designHeight;

    this._resizeActions = new Map<number, (w: number, h: number) => void>();
  }

  public startProcess() {
    if (!this._started)
      window.addEventListener(
        "resize",
        debounceFunc(() => {
          this.resize();
        }),
      );
    this._started = true;
  }

  public stopProcess() {
    if (this._started)
      window.removeEventListener(
        "resize",
        debounceFunc(() => {
          this.resize();
        }),
      );
    this._started = false;
  }

  public addResizeAction(id: number, action: ResizeAction) {
    if (!action) {
      console.error(`Action of ${id} is ${action}`);
      return;
    }

    action(this.realWidth, this.realHeight);
    this._resizeActions.set(id, action);
  }

  public removeResizeAction(actionID: number) {
    this._resizeActions.delete(actionID);
  }

  public resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowAspect = windowWidth / windowHeight;

    let newWidth, newHeight;
    if (windowAspect > this._designAspectRatio) {
      newHeight = windowHeight;
      newWidth = newHeight * this._designAspectRatio;
    } else {
      newWidth = windowWidth;
      newHeight = newWidth / this._designAspectRatio;
    }

    this._app.renderer.resize(windowWidth, windowHeight);

    this._app.stage.scale.set(
      newWidth / this._designWidth,
      newHeight / this._designHeight,
    );

    this._realWidth = windowWidth / this._app.stage.scale.x;
    this._realHeight = windowHeight / this._app.stage.scale.y;

    this._resizeActions.forEach((action) =>
      action(this._realWidth, this._realHeight),
    );

    const log = {
      window: { windowWidth, windowHeight },
      windowAspect: windowAspect,
      design: {
        designWidth: this._designWidth,
        designHeight: this._designHeight,
      },
      designAspect: this._designAspectRatio,
      real: { realWidth: this._realWidth, realHeight: this._realHeight },
    };

    console.log(log);
  }
}
