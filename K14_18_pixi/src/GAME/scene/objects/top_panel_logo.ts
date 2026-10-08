import { Container } from "pixi.js";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { Game } from "../../../../plugins/Game/Game";
import { GameConfig } from "../../../../plugins/Game/GameConfig";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { getLayoutType } from "../../Layouts";
import { StaticAtlasObject, StaticSpriteObject } from "../../SpriteObjectTypes";

export class TopPanelLogo extends StaticAtlasObject {
  private _config: GameConfig;

  constructor(game: Game, config: GameConfig, parent?: Container) {
    super(
      game,
      AssetsDB.data.atlas_ui,
      "logo_big.png",
      {
        align: WidgetRoot.LEFT,
        offset: { x: 15, y: 54 },
        scale: 0.65 * 0.5, // config.getEnergyBlastInitialScale(getLayoutType(game))
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0.5 },
      },
      parent,
    );
    this._config = config;
  }

  override onResize(w: number, h: number): void {
    const layout = getLayoutType(this._game);
  }

  // Custom animation method
  runAnimation(): void {
    if (!this.animator) return;
  }
}
