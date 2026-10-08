import { Container } from "pixi.js";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { Game } from "../../../../plugins/Game/Game";
import { GameConfig } from "../../../../plugins/Game/GameConfig";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { getLayoutType } from "../../Layouts";
import { StaticAtlasObject, StaticSpriteObject } from "../../SpriteObjectTypes";

export class TopPanelUI extends StaticAtlasObject {
  private _config: GameConfig;

  constructor(game: Game, config: GameConfig, parent?: Container) {
    super(
      game,
      AssetsDB.data.atlas_ui,
      "top_panel.png",
      {
        align: WidgetRoot.RIGHT,
        offset: { x: -2, y: 56 },
        scale: 0.65, // config.getEnergyBlastInitialScale(getLayoutType(game))
        alpha: 1,
        rotation: 0,
        anchor: { x: 1, y: 0.5 },
      },
      parent,
    );
    this._config = config;
  }

  override onResize(w: number, h: number): void {
    const layout = getLayoutType(this._game);
    console.log("top panel resize: ", w, h, layout);
  }

  // Custom animation method
  runAnimation(): void {
    if (!this.animator) return;
  }
}
