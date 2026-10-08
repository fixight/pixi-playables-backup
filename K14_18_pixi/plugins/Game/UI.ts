import { Container, ContainerChild } from "pixi.js";
import { UIContainer } from "./UIContainer.ts";
import { Game } from "./Game.ts";
import { clamp } from "../Utils/utils.ts";

export enum WidgetRoot {
  CENTER = 0,

  TOP = 1,
  BOTTOM = 2,
  LEFT = 3,
  RIGHT = 4,

  TOP_LEFT = 5,
  TOP_RIGHT = 6,
  BOTTOM_LEFT = 7,
  BOTTOM_RIGHT = 8,
}

export class UI {
  private _game: Game;
  private _root: UIContainer;

  constructor(game: Game) {
    this._game = game;

    this._root = new UIContainer(this._game.app, this._game.resizer);

    this._game.resizer.addResizeAction(this.container.uid, (w) => {
      this.container.scale.set(
        clamp(
          w / this._game.config.designSize.x,
          this._game.config.uiScale?.min ?? 1,
          this._game.config.uiScale?.max ?? 1,
        ),
      );
    });
  }

  setChildIndex(container: Container<ContainerChild>, targetIndex: number) {
    this._root.setChildIndex(container, targetIndex);
  }

  public get container(): Container {
    return this._root;
  }

  public setFollowObject(
    followObj: Container,
    followPoint: { x: number; y: number } = { x: 0.5, y: 0.5 },
  ) {
    this._root.setTarget(followObj);
    this._root.setPivot(followPoint);
  }

  public setFollowBounds(bounds: Container) {
    this._root.setBounds(bounds);
  }

  public add<T extends Container>(
    ins: T,
    pos: WidgetRoot = WidgetRoot.CENTER,
    offset: { x: number; y: number } = { x: 0, y: 0 },
    resizeFunc: (
      ins: T,
      realWidth: number,
      realHeight: number,
    ) => void = () => {},
    runBefore: boolean = false,
  ) {
    let posFactor: { x: number; y: number } = { x: 0.5, y: 0.5 };
    switch (pos) {
      case WidgetRoot.TOP:
        posFactor = { x: 0.5, y: 0 };
        break;
      case WidgetRoot.BOTTOM:
        posFactor = { x: 0.5, y: 1 };
        break;
      case WidgetRoot.LEFT:
        posFactor = { x: 0, y: 0.5 };
        break;
      case WidgetRoot.RIGHT:
        posFactor = { x: 1, y: 0.5 };
        break;

      case WidgetRoot.TOP_LEFT:
        posFactor = { x: 0, y: 0 };
        break;
      case WidgetRoot.TOP_RIGHT:
        posFactor = { x: 1, y: 0 };
        break;
      case WidgetRoot.BOTTOM_LEFT:
        posFactor = { x: 0, y: 1 };
        break;
      case WidgetRoot.BOTTOM_RIGHT:
        posFactor = { x: 1, y: 1 };
        break;

      case WidgetRoot.CENTER:
      default:
        posFactor = { x: 0.5, y: 0.5 };
        break;
    }

    this._game.resizer.addResizeAction(ins.uid, (w, h) => {
      if (runBefore) resizeFunc(ins, w, h);

      w /= this.container.scale.x;
      h /= this.container.scale.y;

      ins.position.set(w * posFactor.x, h * posFactor.y);

      ins.x += ins.width * (0.5 - posFactor.x);
      //ins.x += ins.width * sprite.scale.x * (0.5 - posFactor.x);

      ins.y += ins.height * (0.5 - posFactor.y);
      //ins.y += ins.height * sprite.scale.y * (0.5 - posFactor.y);

      ins.x += offset.x;
      ins.y += offset.y;

      if (!runBefore) resizeFunc(ins, w, h);
    });

    return this.container.addChild(ins);
  }

  public remove<T extends Container>(ins: T): void {
    this._game.resizer.removeResizeAction(ins.uid);
    ins.destroy();
  }
}
