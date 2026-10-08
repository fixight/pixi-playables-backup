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
import { Street as StreetBG } from "../objects/street_bg";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { spawnUIAnimElement } from "../../SpritesFactory";
import { gsap } from "gsap";
import { lerp, v2lerp } from "../../../../plugins/Utils/utils";
import { SoundManager } from "../../SoundManager";
import { GameConfig } from "../../../config";

export class RoadGame extends ContainerObject {
  private _config: GameConfig;

  private readonly _contentWidth = this._game._config.contentWidth;
  private readonly _contentHeight = this._game._config.contentHeight;

  private _masked: Container | null = null;
  private _maskedGraphics: Graphics | null = null;
  private _mask: Graphics | null = null;
  private _bluredContent: Container | null = null;
  private _mainContent: Container | null = null;
  private _animatedContent: Container | null = null;
  private _streetContainer: Container | null = null;
  private _mainContentMask: Graphics | null = null;
  private _mainContentMaskDebug: Graphics | null = null;
  private _streetBlurred: StreetBG | null = null;
  private _streetMain: StreetBG | null = null;

  private _kura_static: StaticAtlasObject | null = null;
  private _kura_jump: AnimatedSpriteObject | null = null;

  private _tarelka_static: StaticAtlasObject | null = null;
  private _kura_v_tare: AnimatedSpriteObject | null = null;

  private _hatch1: StaticAtlasObject | null = null;
  private _hatchAn1: AnimatedSpriteObject | null = null;
  private _hatch2: StaticAtlasObject | null = null;
  private _hatchAn2: AnimatedSpriteObject | null = null;
  private _hatch3: StaticAtlasObject | null = null;
  private _hatch4: StaticAtlasObject | null = null;
  private _hatchEnd: StaticAtlasObject | null = null;

  private _carTaxiCrop: StaticAtlasObject | null = null;
  private _carIceCream: StaticAtlasObject | null = null;
  private _carFire1: StaticAtlasObject | null = null;
  private _carFire2: StaticAtlasObject | null = null;
  private _carPolice1: StaticAtlasObject | null = null;
  private _carPolice2: StaticAtlasObject | null = null;
  private _barrier1: StaticAtlasObject | null = null;
  private _barrier1Shd: StaticAtlasObject | null = null;
  private _barrier2: StaticAtlasObject | null = null;
  private _barrier2Shd: StaticAtlasObject | null = null;

  private _kura_start_pos = { x: 115, y: 440 };
  private _kura_scale = 0.66;
  private _hatch1_start_pos = { x: 237, y: 409 };
  private _hatch2_start_pos = { x: 407, y: 409 };
  private _hatch3_start_pos = { x: 582, y: 409 };
  private _hatch4_start_pos = { x: 758, y: 409 };
  private _hatchEnd_start_pos = { x: 1120, y: 409 };
  private _tarelka_scene_pos = { x: 540, y: 190 };
  private _kura_v_tare_pos = { x: 40, y: -25 };
  private _roadOffsetX0 = 0;
  private _roadOffsetX1 = -50;
  private _roadOffsetX2 = -100;
  private _roadOffsetX3 = -150;

  private _step = 0;

  private _onAnimationInit: (animName: string) => void;
  private _onAnimationStart: (animName: string) => void;
  private _onAnimationEnd: (animName: string) => void;
  private _onGameEnd: () => void;

  constructor(
    game: Game,
    config: GameConfig,
    parent?: Container,
    onAnimationInit?: (animName: string) => void,
    onAnimationStart?: (animName: string) => void,
    onAnimationEnd?: (animName: string) => void,
    onGameEnd?: () => void,
  ) {
    const initialOptions = {
      align: WidgetRoot.TOP,
      offset: { x: 0, y: 120 },
      anchor: { x: 0.5, y: 0 },
      //offset: { x: 120, y: 120 },
      //anchor: { x: 0, y: 0.5 },
    };
    super(game, initialOptions, parent);
    this._config = config;

    this._onAnimationInit = onAnimationInit ? onAnimationInit : () => {};
    this._onAnimationStart = onAnimationStart ? onAnimationStart : () => {};
    this._onAnimationEnd = onAnimationEnd ? onAnimationEnd : () => {};
    this._onGameEnd = onGameEnd ? onGameEnd : () => {};
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

    // ======================================
    // Street on mainContent
    // ======================================
    this._streetMain = new StreetBG(
      this._game,
      this._config,
      this._streetContainer,
    );
    this._streetMain.applyScale(0.5);
    this._streetMain.applyOffset({ x: -200, y: 0 });
    this._streetMain.initialize();

    //=======================================================

    this._hatch1 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "hatch_static.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._hatch1_start_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
      },
      this._streetMain.view,
    );
    this._hatch1.initialize();

    const hatch1Text = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch1_start_pos.x,
          y: this._hatch1_start_pos.y - 2,
        },
        text: "5x",
        style: {
          fontSize: 20,
          fill: 0xffffff,
          fontFamily: "Arial",
          align: "center",
          fontWeight: "bold",
        },
      },
      this._streetMain.view,
    );
    hatch1Text.initialize();

    this._hatchAn1 = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.hatch_in,
      {
        align: WidgetRoot.CENTER,
        offset: this._hatch1_start_pos,
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
        animationSpeed: 0.5,
        autoStart: false,
        loop: false,
      },
      this._streetMain.view,
    );
    this._hatchAn1.initialize();

    //

    this._hatch2 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "hatch_static.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._hatch2_start_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
      },
      this._streetMain.view,
    );
    this._hatch2.initialize();

    const hatch2Text = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch2_start_pos.x,
          y: this._hatch2_start_pos.y - 2,
        },
        text: "10x",
        style: {
          fontSize: 20,
          fill: 0xffffff,
          fontFamily: "Arial",
          align: "center",
          fontWeight: "bold",
        },
      },
      this._streetMain.view,
    );
    hatch2Text.initialize();

    this._hatchAn2 = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.hatch_in,
      {
        align: WidgetRoot.CENTER,
        offset: this._hatch2_start_pos,
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
        animationSpeed: 0.5,
        autoStart: false,
        loop: false,
      },
      this._streetMain.view,
    );
    this._hatchAn2.initialize();

    //

    this._hatch3 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "hatch_static.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._hatch3_start_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
      },
      this._streetMain.view,
    );
    this._hatch3.initialize();

    this._hatch4 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "hatch_static.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._hatch4_start_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
      },
      this._streetMain.view,
    );
    this._hatch4.initialize();

    this._hatchEnd = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "hatch_static.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._hatchEnd_start_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
      },
      this._streetMain.view,
    );
    this._hatchEnd.initialize();

    //------------------------------- barriers
    this._barrier1 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "barrier_normal.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch1_start_pos.x,
          y: this._hatch1_start_pos.y - 145,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 0 },
      },
      this._streetMain.view,
    );
    this._barrier1.initialize();

    this._barrier1Shd = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "barrier_shd_100.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: 0,
          y: 0,
        },
        scale: 1,
        alpha: 0,
        anchor: { x: 0.5, y: 0 },
      },
      this._barrier1.view,
    );
    this._barrier1Shd.initialize();

    this._barrier2 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "barrier_normal.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch2_start_pos.x,
          y: this._hatch2_start_pos.y - 145,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 0 },
      },
      this._streetMain.view,
    );
    this._barrier2.initialize();

    this._barrier2Shd = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "barrier_shd_100.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: 0,
          y: 0,
        },
        scale: 1,
        alpha: 0,
        anchor: { x: 0.5, y: 0 },
      },
      this._barrier2.view,
    );
    this._barrier2Shd.initialize();

    //------------------------------ cars

    this._carTaxiCrop = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "car_taxi_crop.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch1_start_pos.x,
          y: this._contentHeight,
        },
        scale: 0.66,
        alpha: 1,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._carTaxiCrop.initialize();

    this._carIceCream = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "car_ice_cream.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch1_start_pos.x,
          y: this._hatch2_start_pos.y - 150,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._carIceCream.initialize();

    this._carPolice1 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "car_police.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch3_start_pos.x,
          y: this._hatch3_start_pos.y - 150,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._carPolice1.initialize();

    this._carPolice2 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "car_police.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch3_start_pos.x,
          y: this._hatch3_start_pos.y - 150,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._carPolice2.initialize();

    this._carFire1 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "car_fire.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch2_start_pos.x,
          y: this._hatch2_start_pos.y - 150,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._carFire1.initialize();

    this._carFire2 = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "car_fire.png",
      {
        align: WidgetRoot.CENTER,
        offset: {
          x: this._hatch2_start_pos.x,
          y: this._hatch2_start_pos.y - 150,
        },
        scale: 0.66,
        alpha: 0,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._carFire2.initialize();

    //========================= kura

    this._kura_static = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "kura.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._kura_start_pos,
        scale: this._kura_scale,
        anchor: { x: 0.5, y: 1 },
      },
      this._streetMain.view,
    );
    this._kura_static.initialize();

    this._kura_jump = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.kura_jump,
      {
        align: WidgetRoot.CENTER,
        offset: this._kura_start_pos,
        scale: 1,
        anchor: { x: 0.5, y: 1 },
        alpha: 0,
        animationSpeed: 1,
        autoStart: false,
        loop: false,
      },
      this._streetMain.view,
    );
    this._kura_jump.initialize();

    //------------------------------- tarelka
    this._tarelka_static = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_game1,
      "tarelka.png",
      {
        align: WidgetRoot.CENTER,
        offset: this._tarelka_scene_pos,
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
      },
      this._streetMain.view,
    );
    this._tarelka_static.initialize();

    this._kura_v_tare = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.kura_v_tarelke,
      {
        align: WidgetRoot.CENTER,
        offset: this._kura_v_tare_pos,
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
        animationSpeed: 0.5,
        autoStart: false,
        loop: true,
      },
      this._tarelka_static.view,
    );
    this._kura_v_tare.initialize();

    //==========================================================

    this._updatePositions();

    //this.graphicsInit();
    //this.runStepAnimation();
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
      this._mainContent!.x = -w / 2;
      this._mainContent!.y = 0;
    }

    if (this._mainContentMask) {
      this._mainContentMask!.x = -w / 2;
      this._mainContentMask!.y = 0;
    }

    if (this._mainContentMaskDebug) {
      this._mainContentMaskDebug!.x = -w / 2;
      this._mainContentMaskDebug!.y = 0;
    } */

  if (layout === "vertical") {
    // w здесь уже = realWidth = 1304.9 на широком экране
    // h = realHeight = 1280

    const availableH = h - this._config.topHeight2 - this._config.rectVMinHeight;
    const minContentHeight = this._contentHeight + 40;
    const contentHeight = Math.max(availableH, minContentHeight);

    const scaleY = contentHeight / this._contentHeight;
    const scaleX = w / this._contentWidth;  // 1304.9 / 720 = 1.81 на широком

    // Берём меньший — контент влезает и по ширине и по высоте
    // На широком экране scaleX > scaleY, значит ограничивает высота
    // На узком scaleX < scaleY, значит ограничивает ширина
    const contentScale = Math.min(scaleX, scaleY);

    if (this._mainContent) {
      this._mainContent.x = 0;
      this._mainContent.y = this._contentHeight / 2;
      this._mainContent.scale.set(contentScale);
    }

    const maskX = (-this._contentWidth / 2) * contentScale;

    if (this._mainContentMask) {
      this._mainContentMask.x = maskX;
      this._mainContentMask.y = 0;
      this._mainContentMask.scale.set(contentScale);
    }

    if (this._mainContentMaskDebug) {
      this._mainContentMaskDebug.x = maskX;
      this._mainContentMaskDebug.y = 0;
      this._mainContentMaskDebug.scale.set(contentScale);
    }

    }

    if (layout === "horizontal") {

        console.log('onResize vertical', {
        w, h,
        contentWidth: this._contentWidth,
        contentHeight: this._contentHeight,
        topHeight2: this._config.topHeight2,
        rectVMinHeight: this._config.rectVMinHeight,
        mainContentX: this._mainContent?.x,
        mainContentY: this._mainContent?.y,
        mainContentScaleX: this._mainContent?.scale.x,
        mainContentScaleY: this._mainContent?.scale.y,
        mainContentWidth: this._mainContent?.width,
        mainContentHeight: this._mainContent?.height,
        viewX: this._view?.x,
        viewY: this._view?.y,
        viewScaleX: this._view?.scale.x,
        viewScaleY: this._view?.scale.y,
        viewWidth: this._view?.width,
        viewHeight: this._view?.height,
      });
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
  }

  graphicsInit(): void {
    console.log("road game init ");

    this._step = 0;

    this._kura_static?.applyAlpha(1);
    this._kura_static?.applyPosition(this._kura_start_pos);
    this._kura_static?.applyScale(this._kura_scale);
    this._kura_jump?.applyAlpha(0);
    this._hatchAn1?.applyAlpha(0);
    this._hatchAn2?.applyAlpha(0);
    this._tarelka_static?.applyAlpha(0);
    this._tarelka_static?.applyPosition(this._kura_v_tare_pos);
    this._kura_v_tare?.gotoAndStop(55);

    // car taxi on start

    this._carTaxiCrop?.applyAlpha(1);
    this._carTaxiCrop?.animator?.createTimeline();
    const taxiCarStartPos = {
      x: this._carTaxiCrop!.view!.position.x,
      y: this._carTaxiCrop!.view!.position.y,
    };
    const taxiCarEndPos = {
      x: taxiCarStartPos!.x,
      y: taxiCarStartPos.y! + 200,
    };

    this._carTaxiCrop!.animator?.addAnimation(
      0.5,
      0.5 + 0.33,
      "linear",
      (et) => {
        const pos = v2lerp(taxiCarStartPos, taxiCarEndPos, et);
        this._carTaxiCrop!.view!.position.set(pos.x, pos.y);
      },
    );
    this._carTaxiCrop!.animator?.play();

    //-----------------------------

    if (this._onAnimationInit) this._onAnimationInit("INIT");
  }

  // Custom animation method
  public runStepAnimation(): void {
    if (!this.animator) return;

    const x1 = this._kura_start_pos.x;
    const y1 = this._kura_start_pos.y;

    const x2 = this._hatch1_start_pos.x;
    const y2 = this._kura_start_pos.y;

    const x3 = this._hatch2_start_pos.x;
    const y3 = this._kura_start_pos.y;

    const x4 = this._hatch3_start_pos.x;
    const y4 = this._kura_start_pos.y;

    const jumpDuration = 0.33;
    const jumpHeight = 60;
    const moveRoadDuration = 0.75;

    if (this._step === 0) {
      this._step = 1;

      //this.roadGameInit();

      if (this._onAnimationStart) this._onAnimationStart("STEP1");

      const startTime = 0;
      this.animator.createTimeline();

      // road move
      this.animator.addAnimation(
        startTime,
        startTime + moveRoadDuration,
        "linear",
        (t, et) => {
          const lerpX = gsap.utils.interpolate(
            this._roadOffsetX0,
            this._roadOffsetX1,
            et,
          );
          const y = 0;
          this._animatedContent?.position.set(lerpX, y);
        },
      );

      // barrier move
      const barrierX = this._barrier1!.view!.position.x;
      const barrierY2 = this._barrier1!.view!.position.y;
      const barrierY1 = this._barrier1!.view!.position.y - 400;
      const barrierDuration = jumpDuration;

      this._barrier1!.applyAlpha(1);
      this._barrier1!.applyPosition({ x: barrierX, y: barrierY1 });
      this.animator.addAnimation(
        startTime + barrierDuration * 0.5,
        startTime + barrierDuration * 1.5,
        "quad.out",
        (t, et) => {
          const lerpY = lerp(barrierY1, barrierY2, et);
          this._barrier1!.applyPosition({ x: barrierX, y: lerpY });
        },
      );

      this.animator.addCallback(startTime + barrierDuration * 1.5, () => {
        this._barrier1Shd!.applyAlpha(1);
      });

      // ice car move
      const iceCarX = this._carIceCream!.view!.position.x;
      const iceCarY2 = this._carIceCream!.view!.position.y;
      const iceCarY1 = this._carIceCream!.view!.position.y - 800;
      const iceCarStart = startTime + jumpDuration * 0.5;
      const iceCarEnd = iceCarStart + 0.8;

      this._carIceCream!.applyAlpha(1);
      this._carIceCream!.applyPosition({ x: iceCarX, y: iceCarY1 });
      this.animator.addAnimation(iceCarStart, iceCarEnd, "linear", (t, et) => {
        const lerpY = lerp(iceCarY1, iceCarY2, et);
        this._carIceCream!.applyPosition({ x: iceCarX, y: lerpY });
      });

      // fire car 1 move
      const fireCarX = this._carFire1!.view!.position.x;
      const fireCarY2 = this._carFire1!.view!.position.y + 800;
      const fireCarY1 = this._carFire1!.view!.position.y - 600;
      const fireCarStart = startTime + jumpDuration * 1;
      const fireCarEnd = fireCarStart + 1.2;

      this._carFire1!.applyAlpha(1);
      this._carFire1!.applyPosition({ x: fireCarX, y: fireCarY1 });
      this.animator.addAnimation(
        fireCarStart,
        fireCarEnd,
        "linear",
        (t, et) => {
          const lerpY = lerp(fireCarY1, fireCarY2, et);
          this._carFire1!.applyPosition({ x: fireCarX, y: lerpY });
        },
      );

      // jump1 start
      this.animator.addCallback(startTime, () => {
        console.log("road jump1 start");
        this._kura_static?.applyAlpha(0);

        this._kura_jump?.applyAlpha(1);
        this._kura_jump?.gotoAndPlay(0);

        this._kura_jump?.applyPosition({ x: x1, y: y1 });

        SoundManager.play("jump");
      });

      this.animator.addAnimation(
        startTime,
        startTime + jumpDuration,
        "none",
        (t, et) => {
          const y_offset = (1 - (et - 0.5) * (et - 0.5) * 4) * jumpHeight;
          const y_interp = gsap.utils.interpolate(y1, y2, et);
          const y = y_interp - y_offset;
          this._kura_jump?.applyPosition({
            x: gsap.utils.interpolate(x1, x2, et),
            y: y,
          });
        },
      );

      // jump1 end
      this.animator.addCallback(startTime + jumpDuration, () => {
        console.log("road jump1 end");
        this._kura_jump?.applyAlpha(0);
        this._kura_jump?.stop();

        this._kura_static?.applyAlpha(1);
        this._kura_static?.applyPosition({ x: x2, y: y2 });
      });

      this.animator.addCallback(fireCarEnd, () => {
        if (this._onAnimationEnd) this._onAnimationEnd("STEP1");
      });

      return;
    }

    //======================================================================

    if (this._step === 1) {
      this._step = 2;

      if (this._onAnimationStart) this._onAnimationStart("STEP2");

      const startTime = 0;
      this.animator.createTimeline();

      // road move
      this.animator.addAnimation(
        startTime,
        startTime + moveRoadDuration,
        "linear",
        (t, et) => {
          const lerpX = gsap.utils.interpolate(
            this._roadOffsetX1,
            this._roadOffsetX2,
            et,
          );
          const y = 0;
          this._animatedContent?.position.set(lerpX, y);
        },
      );

      // barrier2 move
      const barrierX = this._barrier2!.view!.position.x;
      const barrierY2 = this._barrier2!.view!.position.y;
      const barrierY1 = this._barrier2!.view!.position.y - 400;
      const barrierDuration = jumpDuration;

      this._barrier2!.applyAlpha(1);
      this._barrier2!.applyPosition({ x: barrierX, y: barrierY1 });
      this.animator.addAnimation(
        startTime + barrierDuration * 0.5,
        startTime + barrierDuration * 1.5,
        "quad.out",
        (t, et) => {
          const lerpY = lerp(barrierY1, barrierY2, et);
          this._barrier2!.applyPosition({ x: barrierX, y: lerpY });
        },
      );

      this.animator.addCallback(startTime + barrierDuration * 1.5, () => {
        this._barrier2Shd!.applyAlpha(1);
      });

      // fire car move
      const fireCarX = this._carFire2!.view!.position.x;
      const fireCarY2 = this._carFire2!.view!.position.y;
      const fireCarY1 = this._carFire2!.view!.position.y - 800;
      const fireCarStart = startTime + jumpDuration * 0.5;
      const fireCarEnd = fireCarStart + 0.8;

      this._carFire2!.applyAlpha(1);
      this._carFire2!.applyPosition({ x: fireCarX, y: fireCarY1 });
      this.animator.addAnimation(
        fireCarStart,
        fireCarEnd,
        "linear",
        (t, et) => {
          const lerpY = lerp(fireCarY1, fireCarY2, et);
          this._carFire2!.applyPosition({ x: fireCarX, y: lerpY });
        },
      );

      // police car 1 move
      const policeCar1X = this._carPolice1!.view!.position.x;
      const policeCar1Y2 = this._carPolice1!.view!.position.y + 800;
      const policeCar1Y1 = this._carPolice1!.view!.position.y - 600;
      const policeCar1Start = startTime + jumpDuration * 1;
      const policeCar1End = policeCar1Start + 1.2;

      this._carPolice1!.applyAlpha(1);
      this._carPolice1!.applyPosition({ x: policeCar1X, y: policeCar1Y1 });
      this.animator.addAnimation(
        policeCar1Start,
        policeCar1End,
        "linear",
        (t, et) => {
          const lerpY = lerp(policeCar1Y1, policeCar1Y2, et);
          this._carPolice1!.applyPosition({ x: policeCar1X, y: lerpY });
        },
      );

      // police car 2 move
      const policeCar2X = this._carPolice2!.view!.position.x;
      const policeCar2Y2 = this._carPolice2!.view!.position.y + 800;
      const policeCar2Y1 = this._carPolice2!.view!.position.y - 600;
      const policeCar2Start = startTime + jumpDuration * 2;
      const policeCar2End = policeCar2Start + 1.2;

      this._carPolice2!.applyAlpha(1);
      this._carPolice2!.applyPosition({ x: policeCar2X, y: policeCar2Y1 });
      this.animator.addAnimation(
        policeCar2Start,
        policeCar2End,
        "linear",
        (t, et) => {
          const lerpY = lerp(policeCar2Y1, policeCar2Y2, et);
          this._carPolice2!.applyPosition({ x: policeCar2X, y: lerpY });
        },
      );

      //jump2 start
      this.animator.addCallback(startTime, () => {
        console.log("road jump2 start");
        this._kura_static?.applyAlpha(0);

        this._kura_jump?.applyAlpha(1);
        this._kura_jump?.gotoAndPlay(0);

        this._kura_jump?.applyPosition({ x: x2, y: y2 });

        SoundManager.play("jump");
      });

      this.animator.addAnimation(
        startTime,
        startTime + jumpDuration,
        "none",
        (t, et) => {
          const y_offset = (1 - (et - 0.5) * (et - 0.5) * 4) * jumpHeight;
          const y_interp = gsap.utils.interpolate(y2, y3, et);
          const y = y_interp - y_offset;
          this._kura_jump?.applyPosition({
            x: gsap.utils.interpolate(x2, x3, et),
            y: y,
          });
        },
      );

      this.animator.addCallback(startTime + jumpDuration / 2, () => {
        this._hatchAn1?.applyAlpha(1);
        this._hatchAn1?.gotoAndPlay(0);
      });

      // jump2 end
      this.animator.addCallback(startTime + jumpDuration, () => {
        console.log("road jump2 end");
        this._kura_jump?.applyAlpha(0);
        this._kura_jump?.stop();

        this._kura_static?.applyAlpha(1);
        this._kura_static?.applyPosition({ x: x3, y: y3 });
      });

      this.animator.addCallback(policeCar2End, () => {
        if (this._onAnimationEnd) this._onAnimationEnd("STEP2");
      });

      return;
    }

    //===========================================================================

    if (this._step === 2) {
      this._step = 3;

      if (this._onAnimationStart) this._onAnimationStart("STEP3");

      const startTime = 0;
      this.animator.createTimeline();

      // road move
      this.animator.addAnimation(
        startTime,
        startTime + moveRoadDuration,
        "linear",
        (t, et) => {
          const lerpX = gsap.utils.interpolate(
            this._roadOffsetX2,
            this._roadOffsetX3,
            et,
          );
          const y = 0;
          this._animatedContent?.position.set(lerpX, y);
        },
      );

      //jump3 start
      this.animator.addCallback(startTime, () => {
        console.log("road jump3 start");
        this._kura_static?.applyAlpha(0);

        this._kura_jump?.applyAlpha(1);
        this._kura_jump?.gotoAndPlay(0);

        this._kura_jump?.applyPosition({ x: x3, y: y3 });

        SoundManager.play("jump");
      });

      this.animator.addAnimation(
        startTime,
        startTime + jumpDuration,
        "none",
        (t, et) => {
          const y_offset = (1 - (et - 0.5) * (et - 0.5) * 4) * jumpHeight;
          const y_interp = gsap.utils.interpolate(y3, y4, et);
          const y = y_interp - y_offset;
          this._kura_jump?.applyPosition({
            x: gsap.utils.interpolate(x3, x4, et),
            y: y,
          });
        },
      );

      this.animator.addCallback(startTime + jumpDuration / 2, () => {
        this._hatchAn2?.applyAlpha(1);
        this._hatchAn2?.gotoAndPlay(0);
      });

      // jump3 end
      this.animator.addCallback(startTime + jumpDuration, () => {
        console.log("road jump3 end");
        this._kura_jump?.applyAlpha(0);
        this._kura_jump?.stop();

        this._kura_static?.applyAlpha(1);
        this._kura_static?.applyPosition({ x: x4, y: y4 });
      });

      this.animator.addCallback(startTime + moveRoadDuration, () => {
        if (this._onAnimationEnd) this._onAnimationEnd("STEP3");
        this.runFinishAnimation();
      });

      return;
    }

    // restart
    /* startTime += 3.5;
    this.animator.addCallback(startTime, () => {
      console.log("road game restart");
      this.animator?.kill();
      this.runStepAnimation();
    }); */
  }

  runFinishAnimation(): void {
    if (!this.animator) return;

    if (this._onAnimationStart) this._onAnimationStart("FINISH");

    const part1duration = 0.4;
    const part2duration = 0.8;
    const kuraDuration = 0.4;

    let startTime = 0;
    this.animator.createTimeline();

    const pos1 = {
      x: this._tarelka_scene_pos.x + 800,
      y: this._tarelka_scene_pos.y - 400,
    };
    const pos2 = {
      x: this._tarelka_scene_pos.x,
      y: this._tarelka_scene_pos.y,
    };
    const pos3 = {
      x: this._tarelka_scene_pos.x - 135,
      y: this._tarelka_scene_pos.y + 20,
    };

    this._tarelka_static?.applyPosition(pos1);
    this._tarelka_static?.applyAlpha(1);
    this._kura_v_tare?.applyAlpha(0);

    // tarelka fast part

    this.animator.addAnimation(
      startTime,
      startTime + part1duration,
      "quad.out",
      (t, et) => {
        const lerpPosX = gsap.utils.interpolate(pos1.x, pos2.x, et);
        const lerpPosY = gsap.utils.interpolate(pos1.y, pos2.y, et);
        this._tarelka_static?.applyPosition({ x: lerpPosX, y: lerpPosY });
      },
    );

    // tarelka slow part

    startTime += part1duration;

    this.animator.addAnimation(
      startTime,
      startTime + part2duration,
      "linear",
      (t, et) => {
        const lerpPosX = gsap.utils.interpolate(pos2.x, pos3.x, et);
        const lerpPosY = gsap.utils.interpolate(pos2.y, pos3.y, et);
        this._tarelka_static?.applyPosition({ x: lerpPosX, y: lerpPosY });
      },
    );

    const kuraStartTime = startTime + part2duration - kuraDuration;

    // kura road animation - pos y
    this.animator.addAnimation(
      kuraStartTime,
      kuraStartTime + kuraDuration * 0.8,
      "quad.inOut",
      (t, et) => {
        const roadKuraPos1 = {
          x: this._hatch3_start_pos.x,
          y: this._kura_start_pos.y,
        };
        const roadKuraPos2 = {
          x: roadKuraPos1.x,
          y: roadKuraPos1.y - 40,
        };

        const lerpRoadKuraPosX = gsap.utils.interpolate(
          roadKuraPos1.x,
          roadKuraPos2.x,
          et,
        );
        const lerpRoadKuraPosY = gsap.utils.interpolate(
          roadKuraPos1.y,
          roadKuraPos2.y,
          et,
        );

        this._kura_static?.applyPosition({
          x: lerpRoadKuraPosX,
          y: lerpRoadKuraPosY,
        });
      },
    );

    // kura road animation - scale x

    this.animator.addAnimation(
      kuraStartTime + kuraDuration * 0.2,
      kuraStartTime + kuraDuration * 0.8,
      "linear",
      (t, et) => {
        const roadKuraScale1 = { x: this._kura_scale, y: this._kura_scale };
        const roadKuraScale2 = {
          x: this._kura_scale * 0.66 * 0.5,
          y: (this._kura_scale / 0.66) * 0.5,
        };

        this._kura_static!.view!.scale.set(
          gsap.utils.interpolate(roadKuraScale1.x, roadKuraScale2.x, et),
          gsap.utils.interpolate(roadKuraScale1.y, roadKuraScale2.y, et),
        );

        this._kura_static?.applyAlpha(1 - t);
      },
    );

    // kura tarelka animation -

    this.animator.addCallback(kuraStartTime + kuraDuration * 0.2, () => {
      SoundManager.playWithVolume("kura-or", 1);
    });

    this.animator.addAnimation(
      kuraStartTime + kuraDuration * 0.2,
      kuraStartTime + kuraDuration * 0.8,
      "quad.inOut",
      (t, et) => {
        const pos2 = this._kura_v_tare_pos;
        const pos1 = { x: pos2.x - 60, y: pos2.y - 35 };

        const lerpPosX = gsap.utils.interpolate(pos1.x, pos2.x, et);
        const lerpPosY = gsap.utils.interpolate(pos1.y, pos2.y, et);

        this._kura_v_tare?.applyPosition({
          x: lerpPosX,
          y: lerpPosY,
        });

        //

        const kuraTaraScale1 = { x: 0.2, y: 0.6 };
        const kuraTaraScale2 = { x: 2, y: 2 };

        const lerpScaleX = gsap.utils.interpolate(
          kuraTaraScale1.x,
          kuraTaraScale2.x,
          et,
        );

        const lerpScaleY = gsap.utils.interpolate(
          kuraTaraScale1.y,
          kuraTaraScale2.y,
          et,
        );

        this._kura_v_tare?.applyScale({
          x: lerpScaleX,
          y: lerpScaleY,
        });

        //
        const alpha = t * 5;

        this._kura_v_tare?.applyAlpha(alpha);
      },
    );

    // smooth fade

    startTime += part2duration;
    const smoothDuration = 0.25;
    const blurFilter = new BlurFilter({ strength: 0 });
    this._animatedContent!.filters = [blurFilter];

    this.animator.addAnimation(
      startTime,
      startTime + smoothDuration,
      "quad.in",
      (t, et) => {
        const pos1 = {
          x: this._animatedContent?.position.x,
          y: this._animatedContent?.position.y,
        };
        const pos2 = { x: pos1.x! - 150, y: pos1.y! };

        const lerpPosX = gsap.utils.interpolate(pos1.x, pos2.x, et);
        const lerpPosY = gsap.utils.interpolate(pos1.y, pos2.y, et);

        this._animatedContent?.position.set(lerpPosX, lerpPosY);

        //

        const blurStrength = et * 12;
        blurFilter.strength = blurStrength;
      },
    );

    // Временно в RoadGame.onResize, самая первая строка:
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const stageScaleX = this._game.app.stage.scale.x;
    const stageScaleY = this._game.app.stage.scale.y;
    console.log('RoadGame.onResize', {sw, sh, stageScaleX, stageScaleY });

    // finish callbacks

    this.animator.addCallback(startTime, () => {
      if (this._onAnimationEnd) this._onAnimationEnd("FINISH");
      if (this._onGameEnd) this._onGameEnd();
    });
  }
}
