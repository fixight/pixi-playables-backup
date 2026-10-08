import { ColorSource, Container, Graphics, Sprite, Texture } from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { getLayoutType } from "../../Layouts";
import {
  ContainerObject,
  StaticAtlasObject,
  TextObject,
} from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { LocalKey } from "../../../../plugins/Assets/_DATA_BASE/LocalizationGenerated";
import { GetLocal } from "../../../BUILD/Localization";
import { OffClick, OnClick } from "../../../../plugins/Utils/UIEvents";
import { Sound } from "@pixi/sound";
import { SoundManager } from "../../SoundManager";
import { GameConfig } from "../../../config";

export class BottomPanel extends ContainerObject {
  private _config: GameConfig;
  private _rectV1: Graphics | null = null;
  private _rectV2: Graphics | null = null;
  private _rectH1: Graphics | null = null;
  private _rectH2: Graphics | null = null;
  private _adaptiveCont: Container | null = null;
  private _bottomPanelUI: StaticAtlasObject | null = null;
  private _cashoutBg: StaticAtlasObject | null = null;
  private _goBg: StaticAtlasObject | null = null;
  private _cashoutPanelAmountText: TextObject | null = null;
  private _cashoutPanelHeaderText: TextObject | null = null;
  private _goPanelHeaderText: TextObject | null = null;

  //private readonly _bottomUiBgColor: ColorSource = 0x414141;
  private readonly _bottomUiBgColor1: ColorSource = 0x313131;
  private readonly _bottomUiBgColor2: ColorSource = 0x414141;

  private _goButtonInitialScale = 0.66;
  private _goAnimDebugToggle = 0;

  private _onGoClickCallback: () => void;
  private _onGoClick: () => void;

  constructor(
    game: Game,
    config: GameConfig,
    parent?: Container,
    onGoClick?: () => void,
  ) {
    const initialOptions = {
      align: WidgetRoot.BOTTOM,
      offset: { x: 0, y: 0 },
    };
    super(game, initialOptions, parent);
    this._config = config;
    this._onGoClickCallback = onGoClick ? onGoClick : () => {};
    this._onGoClick = () => {
      if (this._onGoClickCallback) this._onGoClickCallback();
      this.clickGoButtonAnimation();
      SoundManager.play("click");
    };
  }

  formatAmount(amount: number): string {
    return `${amount.toFixed(2)} EUR`;
  }

  override initialize(): void {
    super.initialize();

    if (!this._view) return;

    // ======================================
    /* this._rect1 = new Sprite(Texture.WHITE);
    this._rect1.tint = 0x00cc00;
    this._rect1.alpha = 1;
    this._rect1.width = 0;
    this._rect1.height = this._rect1Height;
    this._rect1.anchor.set(0.5, 1);
    this._view.addChild(this._rect1); */

    this._rectV1 = new Graphics();
    this._drawBottomRect(
      this._rectV1,
      this._game.config.designSize.x,
      this._config.rectVMinHeight,
      0,
      this._bottomUiBgColor1,
    );
    this._view.addChild(this._rectV1);

    this._rectV2 = new Graphics();
    this._drawBottomRect(
      this._rectV2,
      this._game.config.designSize.x,
      this._config.rectVMinHeight,
      8,
      this._bottomUiBgColor2,
    );
    this._view.addChild(this._rectV2);

    this._rectH1 = new Graphics();
    this._drawRightRect(
      this._rectH1,
      this._config.rectHMinWidth,
      this._game.config.designSize.y,
      0,
      this._bottomUiBgColor1,
    );
    this._view.addChild(this._rectH1);

    this._rectH2 = new Graphics();
    this._drawRightRect(
      this._rectH2,
      this._game.config.designSize.y,
      this._config.rectHMinWidth,
      8,
      this._bottomUiBgColor2,
    );
    this._view.addChild(this._rectH2);

    this._adaptiveCont = new Container();
    this._view.addChild(this._adaptiveCont);

    // ======================================
    this._bottomPanelUI = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "ui_bottom_with_text_x050.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: -370 },
        scale: 1.27,
      },
      this._adaptiveCont,
    );
    this._bottomPanelUI.initialize();

    // ======================================
    this._cashoutBg = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "ui_bottom_cash_out_bg.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: -150, y: -120 },
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
      },
      this._adaptiveCont,
    );
    this._cashoutBg.initialize();

    //

    this._cashoutPanelAmountText = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: -42 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: "38000.00 EUR",
        style: {
          fontFamily: AssetsDB.font.CeraProBlack,
          fontSize: 48,
          fill: 0x000000,
          align: "center",
        },
      },
      this._cashoutBg.view,
    );
    this._cashoutPanelAmountText.initialize();

    this._cashoutPanelAmountText.textAnimator.createTimeline();
    this._cashoutPanelAmountText.textAnimator.setValue(
      this._config.eurAmountOptions.topAmountValue1,
      0,
      {
        format: this.formatAmount,
      },
    );

    //

    this._cashoutPanelHeaderText = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 30 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: GetLocal(LocalKey.cash_out),
        style: {
          fontFamily: AssetsDB.font.CeraProBlack,
          fontSize: 64,
          fill: 0x000000,
          align: "center",
          wordWrap: true,
          wordWrapWidth: 330,
          letterSpacing: -2.5,
        },
      },
      this._cashoutBg.view,
    );
    this._cashoutPanelHeaderText.initialize();

    // ======================================
    this._goBg = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "ui_bottom_bg_bg.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: 150, y: -120 },
        scale: this._goButtonInitialScale,
        anchor: { x: 0.5, y: 0.5 },
      },
      this._adaptiveCont,
    );
    this._goBg.initialize();

    //

    this._goPanelHeaderText = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 0 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: GetLocal(LocalKey.go),
        style: {
          fontFamily: AssetsDB.font.CeraProBlack,
          fontSize: 90,
          fill: 0xffffff,
          align: "center",
          wordWrap: true,
          wordWrapWidth: 330,
        },
      },
      this._goBg.view,
    );
    this._goPanelHeaderText.initialize();

    //

    this.enableGoButton();

    // ======================================

    this._updateUIPosition();
  }

  public enableGoButton(): void {
    if (!this._goBg) return;
    console.log("enableGoButton");
    OnClick(this._goBg.view!, this._onGoClick!);
  }
  public disableGoButton(): void {
    if (!this._goBg) return;
    console.log("disableGoButton");
    OffClick(this._goBg.view!, this._onGoClick!);
  }

  private _updateUIPosition(): void {
    if (!this._view) return;

    // Note: _rect1 width is already set correctly in onResize() via _drawBottomRect()
    // Setting width here would stretch the graphics and distort rounded corners
  }

  private _drawBottomRect(
    gr: Graphics,
    width: number,
    height: number,
    inset: number = 0,
    color: ColorSource = 0,
  ): void {
    gr.clear();
    const h = height;
    const r = 16;
    gr.moveTo(r + inset, inset)
      .lineTo(width - r - inset, inset)
      .arcTo(width - inset, inset, width - inset, r + inset, r)
      .lineTo(width - inset, h)
      .lineTo(inset, h)
      .lineTo(inset, r + inset)
      .arcTo(inset, inset, r + inset, inset, r)
      .closePath()
      .fill({ color: color });
    // Position to match rect1's anchor (0.5, 1) - centered horizontally, bottom-aligned
    gr.x = -width / 2;
    gr.y = -height;
  }

  private _drawRightRect(
    gr: Graphics,
    height: number,
    width: number,
    inset: number = 0,
    color: ColorSource = 0,
  ): void {
    gr.clear();
    const w = width;
    const padTop = 174 * 0.667;
    const rh = height - padTop;
    const r = 16;
    /* gr.moveTo(w - inset, r + inset)
      .lineTo(w - inset, height - r - inset)
      .arcTo(w - inset, height - inset, w - r - inset, height - inset, r)
      .lineTo(inset, height - inset)
      .lineTo(inset, inset)
      .lineTo(r + inset, inset)
      .arcTo(inset, inset, inset, r + inset, r)
      .closePath()
      .fill({ color: color }); */

    gr.moveTo(w, inset) // правый верхний угол
      .lineTo(w, rh - inset) // вниз по правой стороне
      .lineTo(inset + r, rh - inset) // влево по нижней стороне до скругления
      .arcTo(inset, rh - inset, inset, rh - inset - r, r) // левый нижний скруглённый угол
      .lineTo(inset, inset + r) // вверх по левой стороне до скругления
      .arcTo(inset, inset, inset + r, inset, r) // левый верхний скруглённый угол
      .lineTo(w, inset) // вправо по верхней стороне к началу
      .closePath()
      .fill({ color: color });
    // Position to match rect1's anchor - right-aligned
    gr.x = 0;
    gr.y = -rh;
  }

  override onResize(w: number, h: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layout = getLayoutType(this._game);

    // Update the width of the rectangles
    if (layout === "vertical") {
      const maxContentHeight =
        h - this._config.topHeight2 - this._config.rectVMinHeight;
      const minContentHeight = this._config.contentHeight + 40;
      const contentHeight = Math.max(maxContentHeight, minContentHeight);
      const contentScaleY = contentHeight / this._config.contentHeight;

      const maxContentWidth = w;
      const contentScaleX = maxContentWidth / this._config.contentWidth;
      const contentScale = Math.min(contentScaleX, contentScaleY);
      const fitContentHeight = this._config.contentHeight * contentScale;
      
      
      const rectH = Math.max(this._config.rectHMinWidth, h - fitContentHeight - this._config.topHeight2 - 4);

      if (this._rectV1) {
        //this._rect1.width = w;
        this._rectV1.visible = true;
        this._drawBottomRect(this._rectV1, w, rectH, 0, this._bottomUiBgColor1);
      }
      if (this._rectV2) {
        this._rectV2.visible = true;
        this._drawBottomRect(this._rectV2, w, rectH, 8, this._bottomUiBgColor2);
      }
      if (this._rectH1) {
        this._rectH1.visible = false;
      }
      if (this._rectH2) {
        this._rectH2.visible = false;
      }

      if (this._adaptiveCont) {
        this._adaptiveCont.x = 0;
        this._adaptiveCont.y = 0;
        this._adaptiveCont.scale.set(1);

        this._adaptiveCont.y =
          -rectH * 0.5 +          
          this._adaptiveCont.height * 0.5 + 20 ;
      }
    }

    if (layout === "horizontal") {
      const rectW = Math.max(this._config.rectHMinWidth, w / 2);

      if (this._rectH1) {
        //this._rect1.width = w;
        this._rectH1.visible = true;
        this._drawRightRect(this._rectH1, h, rectW, 0, this._bottomUiBgColor1);
      }
      if (this._rectH2) {
        this._rectH2.visible = true;
        this._drawRightRect(this._rectH2, h, rectW, 8, this._bottomUiBgColor2);
      }

      if (this._rectV1) {
        this._rectV1.visible = false;
      }
      if (this._rectV2) {
        this._rectV2.visible = false;
      }

      if (this._adaptiveCont) {
        const currentAdaptRatio = this._adaptiveCont.height / this._adaptiveCont.width;
        const adaptWidth = rectW * 0.75;
        const adaptHeight = adaptWidth * currentAdaptRatio;
        this._adaptiveCont.height = adaptHeight;
        this._adaptiveCont.width = adaptWidth;
        
        this._adaptiveCont.x = rectW / 2 + 20;
        this._adaptiveCont.y =
          -h / 2 +
          this._config.topHeight2 * 0.5 +
          this._adaptiveCont.height * 0.5 ;

        

        /* const maxWidth = adaptHeight * 1.5;
        const currentW = this._adaptiveCont.width;
        const adaptiveScale = Math.max(1, maxWidth / currentW);
        this._adaptiveCont.scale.set(adaptiveScale); */
      }
    }

    // Update the position of UI and logo
    this._updateUIPosition();
  }

  startGoButtonAnimation(): void {
    if (!this._goBg?.animator) return;

    const startScale = this._goButtonInitialScale;
    const endScale = this._goButtonInitialScale * 0.8;
    const duration = 0.5;
    //const betweenDuration = 1.5;

    this._goBg?.animator.createTimeline();
    this._goBg?.animator.setScale({ x: startScale, y: startScale }, 0);
    this._goBg?.animator.addScaleTo(
      0,
      endScale,
      endScale,
      duration / 2,
      "cubic.inOut",
    );

    this._goBg?.animator.addScaleTo(
      duration / 2,
      startScale,
      startScale,
      duration / 2,
      "cubic.inOut",
    );

    this._goBg?.animator.addDelay(
      duration,
      this._game.config.idleTimeout || 1,
      () => {
        this._goBg?.animator?.restart();
      },
    );

    this._goBg?.animator.play();
  }

  clickGoButtonAnimation(): void {
    if (!this._goBg?.animator) return;
    this.stopGoButtonAnimation();

    const startScale = this._goButtonInitialScale;
    const endScale = this._goButtonInitialScale * 0.8;
    const duration = 0.5;

    this._goBg?.animator.createTimeline();
    //this._goBg?.animator.setScale({ x: startScale, y: startScale }, 0);
    this._goBg?.animator.addScaleTo(
      0,
      endScale,
      endScale,
      duration * 0.1,
      "cubic.out",
    );

    this._goBg?.animator.addScaleTo(
      duration * 0.1,
      startScale,
      startScale,
      duration * 0.9,
      "cubic.elastic.out(5.5, 5.1)",
    );

    this._goBg?.animator.play();
  }

  stopGoButtonAnimation(): void {
    if (!this.animator) return;
    this._goBg?.animator!.kill();

    this._goBg?.applyScale(this._goButtonInitialScale);
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

    this._cashoutPanelAmountText?.textAnimator?.createTimeline();
    this._cashoutPanelAmountText?.textAnimator?.runValueAnimation(
      fromValue,
      toValue,
      0,
      duration,
      { format: this.formatAmount },
    );
  }
}
