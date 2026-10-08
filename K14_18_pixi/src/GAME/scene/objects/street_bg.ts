import { Container } from "pixi.js";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { Game } from "../../../../plugins/Game/Game";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { getLayoutType } from "../../Layouts";
import { StaticAtlasObject } from "../../SpriteObjectTypes";
import { GameConfig } from "../../../config";

export class Street extends StaticAtlasObject {
  private _config: GameConfig;

  constructor(game: Game, config: GameConfig, parent?: Container) {
    super(
      game,
      AssetsDB.data.atlas_game1,
      "street_x066.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 0 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
      },
      parent,
    );
    this._config = config;
    console.log("street created");
  }

  override onResize(w: number, h: number): void {
    const layout = getLayoutType(this._game);
    console.log("street resize: ", w, h, layout);

    /* const cw = this._game._config.contentWidth;
    const ch = this._game._config.contentHeight;
    const delta_w = w - cw;
    const offset_x = delta_w > 0 ? delta_w / 2 : 0;

    this.view?.position.set(offset_x, 0); */
  }

  // Custom animation method
  runAnimation(): void {
    if (!this.animator) return;
  }
}
