import { BlurFilter, Container, Graphics } from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { getLayoutType } from "../../Layouts";
import {
  AnimatedSpriteObject,
  ContainerObject,
  StaticAtlasObject,
  TextObject,
} from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { gsap } from "gsap";
import { lerp, v2lerp } from "../../../../plugins/Utils/utils";
import { GameConfig } from "../../../config";
import { SoundManager } from "../../SoundManager";
import { ObjectPoint } from "../../ContainerAnimator";

export class SpaceStage extends ContainerObject {
  private _config: GameConfig;

  private readonly _contentWidth = this._game._config.contentWidth;
  private readonly _contentHeight = this._game._config.contentHeight;

  private _mainContent: Container | null = null;
  //private _centeredContent: Container | null = null;
  private _animatedContent: Container | null = null;
  private _tarelka_cont: Container | null = null;
  private _tarelka_anim_cont: Container | null = null;
  private _mainContentMask: Graphics | null = null;
  private _mainContentMaskDebug: Graphics | null = null;

  private _starsSky: StaticAtlasObject | null = null;
  private _eggsMove: AnimatedSpriteObject | null = null;
  private _tarelka: AnimatedSpriteObject | null = null;
  private _kura_v_tare: AnimatedSpriteObject | null = null;

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

    /* this._centeredContent = new Container();
    this._centeredContent.x = 0;
    this._centeredContent.y = this._contentHeight / 2;
    this._mainContent.addChild(this._centeredContent); */

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
    this._mainContentMaskDebug.fill({ color: 0xcc0000, alpha: 0 });
    this._view.addChild(this._mainContentMaskDebug);

    //----------------------------------

    this._animatedContent = new Container();
    //this._mainContent.width = this._contentWidth;
    //this._mainContent.height = this._contentHeight;
    this._mainContent.addChild(this._animatedContent);
    this._animatedContent.position.set(0, 0);

    //==========================================================

    this._starsSky = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "starsSky_x050.jpg",
      {
        align: WidgetRoot.CENTER,
        offset: this._skyInitPos,
        scale: this._skyInitScale,
        anchor: { x: 0, y: 0 },
        alpha: 1,
      },
      this._animatedContent,
    );
    this._starsSky.initialize();

    //==========================================================

    this._eggsMove = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.sc2_eggs,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 42, y: 220 },
        scale: 1.333,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
        animationSpeed: 0.25,
        autoStart: false,
        loop: false,
      },
      this._mainContent,
    );
    this._eggsMove.initialize();

    this._tarelka_cont = new Container();
    this._mainContent.addChild(this._tarelka_cont);
    this._tarelka_cont.position.set(0, 0);
    this._tarelka_cont.rotation = 0;

    this._tarelka_anim_cont = new Container();
    this._tarelka_cont.addChild(this._tarelka_anim_cont);
    this._tarelka_anim_cont.position.set(0, 0);

    this._tarelka = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.packshot_tarelka,
      {
        offset: { x: 0, y: 60 },
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
        animationSpeed: 0.33,
        autoStart: true,
        loop: false,
        yoyo: true,
      },
      this._tarelka_anim_cont,
    );
    this._tarelka.initialize();

    this._kura_v_tare = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.kura_v_tarelke,
      {
        offset: { x: -20, y: -50 },
        scale: 0.9,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
        animationSpeed: 0.35,
        autoStart: true,
        loop: false,
        yoyo: true,
      },
      this._tarelka_anim_cont,
    );
    this._kura_v_tare.initialize();

    //==========================================================

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
      const minContentHeight = this._contentHeight - 8;
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

    //===============================
  }

  graphicsInit(): void {
    console.log("road game init ");

    this._step = 0;

    this._starsSky!.applyAlpha(1);
    this._starsSky!.applyOffset(this._skyInitPos);
    this._starsSky!.applyScale(this._skyInitScale);

    this._eggsMove!.applyAlpha(1);
    this._eggsMove!.applyOffset({ x: 0, y: 0 });

    //-----------------------------

    if (this._onStageInit) this._onStageInit();
  }

  // Custom animation method
  public runMainAnimation(): void {
    if (!this.animator) return;

    this._eggsMove!.gotoAndPlay(0);

    this.animator.createTimeline();

    //----------------------------- sky
    let startTime = 0;

    //const skyInitDeltaX = this._skyInitPos.x;
    //const skyInitY = this._skyInitPos.y;

    const skyInitOffsetX = -this._contentWidth / 2;
    const skyInitOffsetY = -this._contentHeight / 2;

    const skyMoving1Duration = 0.65;
    const skyMoving1Speed = 500;
    const skyOffsetX1 = skyInitOffsetX - skyMoving1Duration * skyMoving1Speed;

    const skyMoving2Duration = 3.85;
    const skyMoving2Speed = 100;
    const skyOffsetX2 = skyOffsetX1 - skyMoving2Duration * skyMoving2Speed;

    const blurFilter = new BlurFilter({ strength: 10 });
    this._starsSky!.view!.filters = [blurFilter];
    this._tarelka_anim_cont!.filters = [blurFilter];

    const startAnFrame = 170;
    //===============================
    const tarelkaPoints: ObjectPoint[] = [
      //{ frame: 166, pos: { x: 260, y: 333 }, rotation: -30, size: 167 },
      { frame: 170, pos: { x: 215 - 100, y: 315 }, rotation: -20, size: 158 },
      { frame: 185, pos: { x: 86, y: 260 }, rotation: 0, size: 149 },
      { frame: 191, pos: { x: 124, y: 260 }, rotation: 0, size: 128 },
      { frame: 204, pos: { x: 154, y: 208 }, rotation: 0, size: 128 },
      { frame: 219, pos: { x: 170, y: 222 }, rotation: 0, size: 154 },
      { frame: 254, pos: { x: 200, y: 394 }, rotation: 0, size: 160 },
      { frame: 265, pos: { x: 156, y: 323 }, rotation: 0, size: 123 },
      { frame: 280, pos: { x: 125, y: 210 }, rotation: 0, size: 160 },
      { frame: 299, pos: { x: 174, y: 278 }, rotation: 0, size: 160 },
      { frame: 320, pos: { x: 260, y: 280 }, rotation: 0, size: 302 },
      //{ frame: 320, pos: { x: 260, y: 280 }, rotation: 0, size: 302 },
      { frame: 340, pos: { x: 308, y: 275 }, rotation: 0, size: 240 },
      //{ frame: 340, pos: { x: 308, y: 275 }, rotation: 0, size: 240 },
      { frame: 345, pos: { x: 308, y: 275 }, rotation: 0, size: 222 },
      //{ frame: 345, pos: { x: 308, y: 275 }, rotation: 0, size: 222 },
      { frame: 351, pos: { x: 474, y: 492 }, rotation: 0, size: 222 },
      { frame: 356, pos: { x: 640, y: 710 }, rotation: 0, size: 222 },
    ];

    this.animator!.addKeyframeAnimation(
      tarelkaPoints,
      {
        startTime: 0,
        positionOffset: { x: -350, y: -450 },
        positionMultiplier: { x: 0.66 / 0.5, y: 0.66 / 0.5 },
        rotationOffset: 45,
        scaleMultiplier: { x: 0.9, y: 0.9 },
      },
      this._tarelka_anim_cont!,
    );

    //========================================================== sounds

    const soundsFrames: number[] = [
      182, 197, 201, 212, 227, 233, 243, 279, 285, 295, 305,
    ];

    soundsFrames.forEach((frame) => {
      const time = (frame - startAnFrame) / 30;

      this.animator!.addCallback(startTime + time, () => {
        SoundManager.play("take-coin");
      });
    });

    const glassFrame = 329;
    const glassTime = (glassFrame - startAnFrame) / 30;
    this.animator!.addCallback(startTime + glassTime, () => {
      SoundManager.play("broken-glass");
    });

    // fast move
    this.animator!.addAnimation(
      startTime,
      startTime + skyMoving1Duration,
      "linear",
      (t, et) => {
        const lerpX = lerp(skyInitOffsetX, skyOffsetX1, et);
        this._starsSky!.applyPosition({ x: lerpX, y: skyInitOffsetY });

        blurFilter.strength = 10 * (1 - et);
      },
    );

    // slow move
    startTime += skyMoving1Duration;
    this.animator!.addAnimation(
      startTime,
      startTime + skyMoving2Duration,
      "linear",
      (t, et) => {
        const lerpX = lerp(skyOffsetX1, skyOffsetX2, et);
        this._starsSky!.applyPosition({ x: lerpX, y: skyInitOffsetY });
      },
    );

    this.animator.addCallback(startTime + 0, () => {
      this._onRewardStart();
    });

    //scale in

    startTime += skyMoving2Duration;
    const scaleInDuration = 0.8;
    //const s1 = this._skyInitScale;
    const s1 = 1;
    const s2 = s1 * 5;
    const s3 = s1 * 2;
    this.animator!.addAnimation(
      startTime,
      startTime + scaleInDuration,
      "linear",
      (t, et) => {
        const lerpS = lerp(s1, s2, et);
        //this._starsSky!.applyScale(lerpS);
        this._animatedContent!.scale.set(lerpS);
      },
    );

    // scale out

    startTime += scaleInDuration;
    const scaleOutDuration = 1;
    this.animator!.addAnimation(
      startTime,
      startTime + scaleOutDuration,
      "linear",
      (t, et) => {
        const lerpS = lerp(s2, s3, et);
        //this._starsSky!.applyScale(lerpS);
        this._animatedContent!.scale.set(lerpS);
      },
    );

    const bluredMovingDuration = 0.33;
    const bluredStartTime = startTime + scaleInDuration - bluredMovingDuration;

    this.animator!.addAnimation(
      bluredStartTime,
      bluredStartTime + bluredMovingDuration,
      "linear",
      (t, et) => {
        blurFilter.strength = 10 * et;
      },
    );

    this.animator.addCallback(bluredStartTime + bluredMovingDuration, () => {
      if (this._onStageEnd) this._onStageEnd();
    });
  }

  runFinishAnimation(): void {
    if (!this.animator) return;

    const startTime = 0;

    // finish callbacks

    this.animator.addCallback(startTime, () => {
      if (this._onStageEnd) this._onStageEnd();
    });
  }
}
