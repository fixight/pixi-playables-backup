import { Container } from "pixi.js";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { Game } from "../../../../plugins/Game/Game";
import { GameConfig } from "../../../../plugins/Game/GameConfig";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { getLayoutType } from "../../Layouts";
import { StaticAtlasObject, StaticSpriteObject } from "../../SpriteObjectTypes";

export class PackshotBG extends StaticSpriteObject {
  private _config: GameConfig;

  constructor(game: Game, config: GameConfig, parent?: Container) {
    super(
      game,
      AssetsDB.texture.packshot_bg_x066,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 0 },
        scale: 1, // config.getEnergyBlastInitialScale(getLayoutType(game))
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
      },
      parent,
    );
    this._config = config;
    console.log("packshot created");
  }

  override onResize(w: number, h: number): void {
    const layout = getLayoutType(this._game);
    console.log("packshot resize: ", w, h, layout);
  }

  // Custom animation method
  runAnimation(): void {
    if (!this.animator) return;

    const initialScale = 1;

    /* const initialScale = this._config.getEnergyBlastInitialScale(
      getLayoutType(this._game),
    ); */

    this.animator.createTimeline();
    this.animator.setScale(
      { x: initialScale * 0.33, y: initialScale * 0.33 },
      0,
    );
    this.animator.setRotation(-30, 0);
    this.animator.addScaleTo(
      1,
      initialScale * 2.5,
      initialScale * 2.5,
      0.6,
      "quad.in",
    );
    this.animator.play();
  }
}
