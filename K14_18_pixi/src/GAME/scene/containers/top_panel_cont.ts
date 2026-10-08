import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { getLayoutType } from "../../Layouts";
import { ContainerObject, TextObject } from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { TopPanelUI } from "../objects/top_panel_ui";
import { TopPanelLogo } from "../objects/top_panel_logo";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { GameConfig } from "../../../config";

export class TopPanel extends ContainerObject {
  private _config: GameConfig;
  private _rect1: Sprite | null = null;
  private _rect2: Sprite | null = null;
  private _topPanelUI: TopPanelUI | null = null;
  private _topPanelLogo: TopPanelLogo | null = null;
  private _topPanelAmountText: TextObject | null = null;

  constructor(game: Game, config: GameConfig, parent?: Container) {
    const initialOptions = {
      align: WidgetRoot.TOP,
      offset: { x: 0, y: 0 },
    };
    super(game, initialOptions, parent);
    this._config = config;
  }

  formatAmount(amount: number): string {
    return `${amount.toFixed(2)} EUR`;
  }

  override initialize(): void {
    super.initialize();

    if (!this._view) return;

    // Create rect1 using Sprite
    this._rect1 = new Sprite(Texture.WHITE);
    this._rect1.tint = 0x232323;
    this._rect1.alpha = 1;
    this._rect1.width = 0;
    this._rect1.height = this._config.topHeight1;
    this._rect1.anchor.set(0.5, 0);
    this._view.addChild(this._rect1);

    // Create rect2 using Sprite
    this._rect2 = new Sprite(Texture.WHITE);
    this._rect2.tint = 0x232323;
    this._rect2.alpha = 0.5;
    this._rect2.width = 0;
    this._rect2.height = this._config.topHeight2;
    this._rect2.anchor.set(0.5, 0);
    this._view.addChild(this._rect2);

    // Create TopPanelUI and TopPanelLogo
    this._topPanelUI = new TopPanelUI(this._game, this._config, this._view);
    this._topPanelUI.initialize();
    this._topPanelLogo = new TopPanelLogo(this._game, this._config, this._view);
    this._topPanelLogo.initialize();

    this._topPanelAmountText = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: -345, y: 0 },
        scale: 1, // config.getEnergyBlastInitialScale(getLayoutType(game))
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: "38000.00 EUR",
        style: {
          fontFamily: AssetsDB.font.CeraProBlack,
          fontSize: 68,
          fill: 0x000000,
          align: "center",
        },
      },
      this._topPanelUI?.view,
    );
    this._topPanelAmountText.initialize();
    this._topPanelAmountText.textAnimator.createTimeline();
    this._topPanelAmountText.textAnimator.setValue(
      this._config.eurAmountOptions.topAmountValue1,
      0,
      {
        format: this.formatAmount,
      },
    );

    this._updateUIPosition();
  }

  private _updateUIPosition(): void {
    if (!this._view) return;
    const w = this._view.width;
    // Position TopPanelUI at the right edge
    if (this._topPanelUI?.view) {
      // Because TopPanelUI has anchor set to (0.5, 0) in its constructor
      this._topPanelUI.view.position.set(
        w - this._topPanelUI.view.width / 2,
        0,
      );
    }
    if (this._topPanelLogo?.view) {
      this._topPanelLogo.view.position.set(
        this._topPanelLogo.view.width / 2,
        0,
      );
    }
  }

  override onResize(w: number, h: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layout = getLayoutType(this._game);

    // Update the width of the rectangles
    if (this._rect1) {
      this._rect1.width = w;
    }
    if (this._rect2) {
      this._rect2.width = w;
    }

    // Update the position of UI and logo
    this._updateUIPosition();
  }

  // Custom animation method
  runAnimation(): void {
    if (!this.animator) return;
  }

  runTextAmountAnimation(animName: string): void {
    if (!this.animator) return;

    let fromValue = 0;
    let toValue = 0;
    let duration = 0;

    if (animName === "STEP1") {
      fromValue = this._game.config.eurAmountOptions.topAmountValue1;
      toValue = this._game.config.eurAmountOptions.topAmountValue2;
      duration = this._game.config.eurAmountOptions.amountDuration1;
    } else if (animName === "STEP2") {
      fromValue = this._game.config.eurAmountOptions.topAmountValue2;
      toValue = this._game.config.eurAmountOptions.topAmountValue3;
      duration = this._game.config.eurAmountOptions.amountDuration1;
    } else if (animName === "REWARD") {
      fromValue = this._game.config.eurAmountOptions.topAmountValue3;
      toValue = this._game.config.eurAmountOptions.topAmountValue4;
      duration = this._game.config.eurAmountOptions.amountDuration2;
    }

    this._topPanelAmountText?.textAnimator?.createTimeline();
    this._topPanelAmountText?.textAnimator?.runValueAnimation(
      fromValue,
      toValue,
      0,
      duration,
      { format: this.formatAmount },
    );
  }
}
