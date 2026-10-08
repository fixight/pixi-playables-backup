import { BlendModeFilter, Container, Graphics } from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { GameConfig } from "../../../../plugins/Game/GameConfig";
import { getLayoutType } from "../../Layouts";
import {
  AnimatedSpriteObject,
  ContainerObject,
  StaticAtlasObject,
  TextObject,
} from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { lerp, v2lerp, v2sum } from "../../../../plugins/Utils/utils";
import { Street as StreetBG } from "../objects/street_bg";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { GetLocal } from "../../../BUILD/Localization";
import { LocalKey } from "../../../../plugins/Assets/_DATA_BASE/LocalizationGenerated";
import { SoundManager } from "../../SoundManager";
import { Sound } from "@pixi/sound";

export class WinStage extends ContainerObject {
  private _config: GameConfig;

  private readonly _contentWidth = this._game._config.contentWidth;
  private readonly _contentHeight = this._game._config.contentHeight;

  private _mainContent: Container | null = null;
  //private _centeredContent: Container | null = null;
  private _animatedContent: Container | null = null;
  private _streetContainer: Container | null = null;
  private _mainContentMask: Graphics | null = null;
  private _mainContentMaskDebug: Graphics | null = null;
  private _noMaskedContent: Container | null = null;

  private _streetMain: StreetBG | null = null;
  private _hatchEnd: StaticAtlasObject | null = null;
  private _win_panel: StaticAtlasObject | null = null;
  private _sms_panel: StaticAtlasObject | null = null;
  private _smsPanelHeaderText: TextObject | null = null;
  private _smsPanelNowText: TextObject | null = null;
  private _smsPanelText1: TextObject | null = null;
  private _smsPanelText2: TextObject | null = null;

  private _kura_finish: AnimatedSpriteObject | null = null;
  private _tara_broken: AnimatedSpriteObject | null = null;
  private _kura_win: AnimatedSpriteObject | null = null;
  private _smoke_explosion: AnimatedSpriteObject | null = null;
  private _finish_fx: AnimatedSpriteObject | null = null;

  private _hatchEnd_start_pos = { x: 1120, y: 409 };

  private _step = 0;

  private _skyInitScale = this._contentHeight / 459;
  private _skyInitPos = {
    x: -this._contentWidth / 2,
    y: -this._contentHeight / 2,
  };

  private _onStageInit: () => void;
  private _onRewardStart: () => void;
  private _onStageEnd: () => void;

  constructor(
    game: Game,
    config: GameConfig,
    parent?: Container,
    onStageInit?: () => void,
    onRewardStart?: () => void,
    onStageEnd?: () => void,
  ) {
    const initialOptions = {
      align: WidgetRoot.TOP,
      offset: { x: 0, y: 120 },
      anchor: { x: 0.5, y: 0 },
    };
    super(game, initialOptions, parent);
    this._config = config;

    this._onStageInit = onStageInit ? onStageInit : () => {};
    this._onRewardStart = onRewardStart ? onRewardStart : () => {};
    this._onStageEnd = onStageEnd ? onStageEnd : () => {};
  }

  override initialize(): void {
    super.initialize();

    if (!this._view) return;

    // ======================================
    // mainContent - container with anchor (0, 0), fixed size
    // ======================================
    this._mainContent = new Container();
    this._mainContent.width = this._contentWidth;
    this._mainContent.height = this._contentHeight;
    this._mainContent.y = this._contentHeight / 2;
    this._view.addChild(this._mainContent);

    // ======================================
    // mainContentMask - masks mainContent
    // ======================================
    this._mainContentMask = new Graphics();
    this._mainContentMask.rect(0, 0, this._contentWidth, this._contentHeight);
    this._mainContentMask.fill({ color: 0xffffff, alpha: 1 });
    this._mainContent.mask = this._mainContentMask;
    this._view.addChild(this._mainContentMask);

    this._mainContentMaskDebug = new Graphics();
    this._mainContentMaskDebug.rect(
      0,
      0,
      this._contentWidth,
      this._contentHeight,
    );
    this._mainContentMaskDebug.fill({ color: 0xcc0000, alpha: 0.0 });
    this._view.addChild(this._mainContentMaskDebug);

    //----------------------------------

    this._animatedContent = new Container();
    //this._mainContent.width = this._contentWidth;
    //this._mainContent.height = this._contentHeight;
    this._mainContent.addChild(this._animatedContent);
    this._animatedContent.position.set(0, 0);

    this._streetContainer = new Container();
    this._animatedContent.addChild(this._streetContainer);
    this._streetContainer.position.set(
      -this._contentWidth / 2,
      -this._contentHeight / 2,
    );

    //==========================================================

    this._noMaskedContent = new Container();
    this._noMaskedContent.width = this._contentWidth;
    this._noMaskedContent.height = this._contentHeight;
    this._noMaskedContent.y = this._contentHeight / 2;
    this._view.addChild(this._noMaskedContent);

    // ======================================
    // Street on mainContent
    // ======================================
    this._streetMain = new StreetBG(
      this._game,
      this._config,
      this._streetContainer,
    );
    this._streetMain.applyScale(0.5);
    this._streetMain.applyOffset({ x: -0, y: 0 });
    this._streetMain.initialize();

    //==========================================================

    this._hatchEnd = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "hatch_static.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._hatchEnd_start_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
      },
      this._streetMain.view,
    );
    this._hatchEnd.initialize();
    //=====================================

    this._kura_finish = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.sc3_kura_finish,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 1000, y: -100 },
        scale: 2,
        anchor: { x: 0, y: 0 },
        alpha: 0,
        animationSpeed: 0.33,
        autoStart: false,
        loop: false,
      },
      this._streetMain.view,
    );
    this._kura_finish.initialize();

    this._tara_broken = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.sc3_tara_broken,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 1050, y: -60 },
        scale: 1.5,
        anchor: { x: 0, y: 0 },
        alpha: 1,
        animationSpeed: 0.25,
        autoStart: false,
        loop: true,
      },
      this._streetMain.view,
    );
    this._tara_broken.initialize();

    this._kura_win = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.sc3_kura_win,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 1050, y: -60 },
        scale: 1.2,
        anchor: { x: 0, y: 0 },
        alpha: 1,
        animationSpeed: 0.25,
        autoStart: false,
        loop: false,
      },
      this._streetMain.view,
    );
    this._kura_win.initialize();

    this._smoke_explosion = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.smoke_explosion,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 1000, y: -100 },
        scale: 2,
        anchor: { x: 0, y: 0 },
        alpha: 0,
        animationSpeed: 0.33,
        autoStart: false,
        loop: false,
      },
      this._streetMain.view,
    );
    this._smoke_explosion.initialize();

    this._finish_fx = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.finish_fx,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 80 },
        scale: 5,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
        animationSpeed: 0.25,
        autoStart: false,
        loop: false,
      },
      this._noMaskedContent,
    );
    this._finish_fx.initialize();

    // ======================================

    this._win_panel = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "win_panel.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 70 },
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 10,
      },
      this._noMaskedContent,
    );
    this._win_panel.initialize();

    const win_panel_amount = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 66 },
        text: "38000,00 EUR",
        style: {
          fontSize: 135,
          fill: 0xffffff,
          fontFamily: "CeraProBlack",
          align: "center",
          fontWeight: "bold",
          dropShadow: {
            color: 0x000000,
            alpha: 0.7,
            blur: 2,
            distance: 12,
            angle: Math.PI / 6,
          },
        },
      },
      this._win_panel.view,
    );
    win_panel_amount.initialize();
    // ======================================
    this._sms_panel = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "sms_panel.png",
      {
        position: { x: 0, y: -350 },
        offset: { x: 0, y: -0 },
        scale: 0.66,
        anchor: { x: 0.5, y: 0 },
        alpha: 1,
      },
      this._noMaskedContent,
    );
    this._sms_panel.initialize();

    this._smsPanelHeaderText = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: -300, y: 50 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0.5 },
        text: GetLocal(LocalKey.sms_header),
        style: {
          fontFamily: "Arial",
          fontSize: 40,
          fill: 0x000000,
          align: "left",
        },
      },
      this._sms_panel.view,
    );
    this._smsPanelHeaderText.initialize();

    this._smsPanelNowText = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 460, y: 50 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 1, y: 0.5 },
        text: GetLocal(LocalKey.sms_now),
        style: {
          fontFamily: "Arial",
          fontSize: 30,
          fill: 0x000000,
          align: "right",
        },
      },
      this._sms_panel.view,
    );
    this._smsPanelNowText.initialize();

    this._smsPanelText1 = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: -300, y: 80 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
        text: GetLocal(LocalKey.sms_block),
        style: {
          fontFamily: "Arial",
          fontSize: 36,
          fill: 0x000000,
          align: "left",
          wordWrap: true,
          wordWrapWidth: 1000,
          letterSpacing: -1,
        },
      },
      this._sms_panel.view,
    );
    this._smsPanelText1.initialize();

    this._smsPanelText2 = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: -300, y: 180 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
        text: GetLocal(LocalKey.sms_more_info),
        style: {
          fontFamily: "Arial",
          fontSize: 32,
          fill: 0x000000,
          align: "left",
          wordWrap: true,
          wordWrapWidth: 1000,
          letterSpacing: -1,
        },
      },
      this._sms_panel.view,
    );
    this._smsPanelText2.initialize();

    //=====================================

    //=====================================

    this._updatePositions();

    //this.graphicsInit();
    //this.runMainAnimation();
  }

  private _updatePositions(): void {
    if (!this._view) return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onResize(w: number, h: number): void {
    console.log("RoadGame.onResize");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layout = getLayoutType(this._game);

    /* if (this._mainContent) {
      this._mainContent!.x = 0;
      this._mainContent!.y = this._contentHeight / 2;
    }

    if (this._mainContentMask) {
      this._mainContentMask!.x = -this._contentWidth / 2;
      this._mainContentMask!.y = 0;
    }

    if (this._mainContentMaskDebug) {
      this._mainContentMaskDebug!.x = -this._contentWidth / 2;
      this._mainContentMaskDebug!.y = 0;
    } */

      if (layout === "vertical") {
      const offsetY = this._config.topHeight2 * 0.5;

      const maxContentHeight =
        h - this._config.topHeight2 - this._config.rectVMinHeight;
      const minContentHeight = this._contentHeight + 40;
      const contentHeight = Math.max(maxContentHeight, minContentHeight);
      const contentScaleY = contentHeight / this._contentHeight;

      const maxContentWidth = w;
      const contentScaleX = maxContentWidth / this._contentWidth;
      const contentScale = Math.min(contentScaleX, contentScaleY);

      const contentX = 0;
      const contentY = this._contentHeight / 2;

      if (this._mainContent) {
        this._mainContent!.x = contentX;
        this._mainContent!.y = contentY;

        this._mainContent.scale.set(contentScale);
      }

      if (this._mainContentMask) {
        this._mainContentMask!.x = (-this._contentWidth / 2) * contentScale;
        this._mainContentMask!.y = 0;

        this._mainContentMask.scale.set(contentScale);
      }

      if (this._mainContentMaskDebug) {
        this._mainContentMaskDebug!.x =
          (-this._contentWidth / 2) * contentScale;
        this._mainContentMaskDebug!.y = 0;

        this._mainContentMaskDebug.scale.set(contentScale);
      }
    }

    if (layout === "horizontal") {
      const maxContentWidth = w / 2;
      const minContentWidth = this._contentWidth;
      const contentWidth = Math.max(maxContentWidth, minContentWidth);
      const contentScaleX = contentWidth / this._contentWidth;
      const maxContentHeight = h - this._config.topHeight2;
      const contentScaleY = maxContentHeight / this._contentHeight;
      const contentScale = Math.min(contentScaleX, contentScaleY);
      const offsetY = this._config.topHeight2 * 0.5;

      const contentX = -w / 2 + (this._contentWidth / 2) * contentScale;
      const contentY = h / 2 - offsetY;

      if (this._mainContent) {
        this._mainContent!.x = contentX;
        this._mainContent!.y = contentY;

        this._mainContent.scale.set(contentScale);
      }

      if (this._mainContentMask) {
        this._mainContentMask!.x = -w / 2;
        this._mainContentMask!.y =
          h / 2 - (this._contentHeight / 2) * contentScale - offsetY;

        this._mainContentMask.scale.set(contentScale);
      }

      if (this._mainContentMaskDebug) {
        this._mainContentMaskDebug!.x = -w / 2;
        this._mainContentMaskDebug!.y =
          h / 2 - (this._contentHeight / 2) * contentScale - offsetY;

        this._mainContentMaskDebug.scale.set(contentScale);
      }
    }

    /* if (this._streetMain) {
      this._streetMain.applyOffset({ x: -200, y: 0 });
    } */

    //===============================
  }

  graphicsInit(): void {
    console.log("road game init ");
    console.log("street ", this._streetMain?.view);

    this._step = 0;

    this._streetContainer!.position.set(
      -this._contentWidth / 2 - 1010,
      -this._contentHeight / 2,
    );

    this._tara_broken!.applyAlpha(0);
    this._kura_win!.applyAlpha(0);
    this._kura_finish!.applyAlpha(0);
    this._smoke_explosion!.applyAlpha(0);

    this._finish_fx!.applyAlpha(0);

    this._sms_panel!.applyAlpha(0);
    this._win_panel!.applyAlpha(0);

    // Set blend mode to ADD for overlay effect
    if (this._finish_fx?.view) {
      this._finish_fx.view.blendMode = "screen";
      //this._finish_fx.view.blendMode = "hard-light";
    }

    //-----------------------------

    if (this._onStageInit) this._onStageInit();
  }

  // Custom animation method
  public runMainAnimation(): void {
    if (!this.animator) return;

    this.animator.createTimeline();

    let startTime = 0;

    this.animator.addCallback(startTime, () => {
      this._kura_finish!.applyAlpha(1);
      this._kura_finish!.gotoAndPlay(0);
    });

    this.animator.addCallback(startTime + 0.5, () => {
      this._smoke_explosion!.applyAlpha(1);
      this._smoke_explosion!.gotoAndPlay(0);

      SoundManager.playWithVolume("hit", 1);
    });

    this.animator.addCallback(startTime + 0.75, () => {
      this._kura_finish!.applyAlpha(0);
    });

    this.animator.addCallback(startTime + 0.83, () => {
      this._tara_broken!.applyAlpha(1);
      this._tara_broken!.gotoAndPlay(0);
      this._kura_win!.applyAlpha(1);
      this._kura_win!.gotoAndPlay(0);
    });

    this.animator.addCallback(startTime + 1.8, () => {
      this._finish_fx!.applyAlpha(1);
      this._finish_fx!.gotoAndPlay(0);
    });

    startTime += 2.8;
    const winScale = this._win_panel!.view!.scale.x;

    this.animator.addCallback(startTime, () => {
      this._win_panel!.applyAlpha(1);
    });

    this.animator.addAnimation(
      startTime,
      startTime + 0.3,
      "power3.out",
      (et) => {
        const s = lerp(winScale * 0.2, winScale * 0.9, et);
        this._win_panel!.view!.scale.set(s, s);
      },
    );

    this.animator.addAnimation(
      startTime + 0.3,
      startTime + 6.3,
      "linear",
      (et) => {
        const s = 0.9 * winScale + winScale * Math.sin(et * Math.PI * 6) * 0.06;
        this._win_panel!.view!.scale.set(s, s);
      },
    );

    const smsPos = { x: 0, y: -350 };

    this.animator.addCallback(startTime + 0.4, () => {
      this._sms_panel!.applyAlpha(1);
      //this._sms_panel!.applyPosition(smsPos);
    });

    this.animator.addCallback(startTime + 0.6, () => {
      SoundManager.play("sms");
    });

    this.animator.addAnimation(
      startTime + 0.4,
      startTime + 0.8,
      "power3.out",
      (t, et) => {
        const dy = lerp(-300, 0, et);
        const pos = v2sum(smsPos, { x: 0, y: dy });
        //this._sms_panel!.applyPosition(pos);
        this._sms_panel!.view!.position.set(pos.x, pos.y);

        //console.log(`t=${t}, et=${et}`);
      },
    );

    this.animator.addCallback(startTime + 2, () => {
      if (this._onStageEnd) this._onStageEnd();
    });
  }

  runFinishAnimation(): void {
    if (!this.animator) return;

    const startTime = 0;

    this._kura_finish!.applyAlpha(1);
    this._kura_finish!.gotoAndPlay(0);

    // finish callbacks

    this.animator.addCallback(startTime, () => {
      if (this._onStageEnd) this._onStageEnd();
    });
  }
}
