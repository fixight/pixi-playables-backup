import {
  Graphics,
  BlurFilter,
  Container,
  Graphics,
  FillGradient,
} from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { getLayoutType } from "../../Layouts";
import {
  AnimatedSpriteObject,
  ContainerObject,
  StaticAtlasObject,
  StaticSpriteObject,
  TextObject,
} from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import {
  getDateLog,
  lerp,
  v2lerp,
  v2sum,
} from "../../../../plugins/Utils/utils";
import { Street as StreetBG } from "../objects/street_bg";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { GetLocal } from "../../../BUILD/Localization";
import { LocalKey } from "../../../../plugins/Assets/_DATA_BASE/LocalizationGenerated";
import { TopPanel } from "./top_panel_cont";
import { OnClick } from "../../../../plugins/Utils/UIEvents";
import { triggerCtaClick } from "../../cta/cta";
import { GameConfig } from "../../../config";

export class Stage5 extends ContainerObject {
  private _config: GameConfig;

  private readonly _contentWidth = this._game._config.designSize.x;
  private readonly _contentHeight = this._game._config.designSize.y;
  private readonly _initialAnimatedContentX = 0;
  private readonly _initialAnimatedContentY = this._contentHeight / 2;

  private _mainContent: Container | null = null;
  private _bluredContent: Container | null = null;
  private _noTintContent: Container | null = null;
  private _tint: Graphics | null = null;

  private _mainBg: StaticSpriteObject | null = null;
  private _mainBlurBg: StaticSpriteObject | null = null;
  private _logo: StaticAtlasObject | null = null;
  private _button_take_bonus: StaticAtlasObject | null = null;
  private _packshot_tara: AnimatedSpriteObject | null = null;
  private _kura_v_tare: AnimatedSpriteObject | null = null;
  private _welcome_bonus_text: TextObject | null = null;

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
      offset: { x: 0, y: 0 },
      anchor: { x: 0.5, y: 0 },
    };
    super(game, initialOptions, parent);
    this._config = config;

    this._onStageInit = onStageInit ? onStageInit : () => {};
    this._onRewardStart = onRewardStart ? onRewardStart : () => {};
    this._onStageEnd = onStageEnd ? onStageEnd : () => {};
  }

  formatAmount(amount: number): string {
    return `€ ${amount.toFixed(2)}`;
  }

  override initialize(): void {
    super.initialize();

    console.log("stage5 init");

    if (!this._view) return;

    // ======================================
    // mainContent - container with anchor (0, 0), fixed size
    // ======================================
    this._bluredContent = new Container();
    this._bluredContent.width = this._contentWidth;
    this._bluredContent.height = this._contentHeight;
    this._bluredContent.y = this._contentHeight / 2;
    this._view.addChild(this._bluredContent);

    const blurFilter = new BlurFilter({ strength: 20 });
    this._bluredContent.filters = [blurFilter];
    this._bluredContent.alpha = 0.4;

    this._mainContent = new Container();
    this._mainContent.width = this._contentWidth;
    this._mainContent.height = this._contentHeight;
    this._mainContent.y = this._contentHeight / 2;
    this._view.addChild(this._mainContent);

    this._tint = new Graphics();
    this._tint.rect(0, 0, this._contentWidth, this._contentHeight);
    this._tint.fill({ color: 0x0000ff, alpha: 0.5 });
    this._view.addChild(this._tint);

    //----------------------------------

    this._noTintContent = new Container();
    //this._mainContent.width = this._contentWidth;
    //this._mainContent.height = this._contentHeight;
    this._view.addChild(this._noTintContent);
    this._noTintContent.position.set(
      this._initialAnimatedContentX,
      this._initialAnimatedContentY,
    );

    //=====================================

    // ======================================

    this._mainBg = new StaticSpriteObject(
      this._game,
      AssetsDB.texture.packshot_bg_x066,
      {
        offset: { x: 0, y: 0 },
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
      },
      this._mainContent,
    );

    this._mainBg.initialize();

    this._mainBlurBg = new StaticSpriteObject(
      this._game,
      AssetsDB.texture.packshot_bg_x066,
      {
        offset: { x: 0, y: 0 },
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
      },
      this._bluredContent,
    );

    this._mainBlurBg.initialize();

    // =====================================
    this._packshot_tara = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.packshot_tarelka,
      {
        offset: { x: 0, y: 60 },
        scale: 1.5,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
        animationSpeed: 0.2,
        autoStart: false,
        loop: false,
        yoyo: true,
      },
      this._mainContent,
    );
    this._packshot_tara.initialize();

    this._kura_v_tare = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.kura_v_tarelke,
      {
        offset: { x: -20, y: -110 },
        scale: 1.5,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
        animationSpeed: 0.35,
        autoStart: false,
        loop: false,
        yoyo: true,
      },
      this._mainContent,
    );
    this._kura_v_tare.initialize();

    // =====================================
    this._logo = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "logo_big.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: -400 },
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 1,
      },
      this._noTintContent,
    );
    this._logo.initialize();

    const gradient = new FillGradient(0, 0, 0, 1);
    gradient.addColorStop(0, 0xffe601);
    gradient.addColorStop(1, 0xff9e03);

    this._welcome_bonus_text = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 40 },
        text: GetLocal(LocalKey.p_welcome_bonus),
        alpha: 0,
        style: {
          fontSize: 70,
          fill: gradient,
          fontFamily: "CeraProBlack",
          align: "center",
          fontWeight: "bold",
          wordWrap: true,
          wordWrapWidth: 700,
          dropShadow: {
            color: 0x000000,
            alpha: 0.7,
            blur: 2,
            distance: 12,
            angle: Math.PI / 6,
          },
        },
      },
      this._noTintContent,
    );
    this._welcome_bonus_text.initialize();

    this._button_take_bonus = new StaticAtlasObject(
      this._game,
      AssetsDB.data.atlas_ui,
      "button_take_bonus_bg.png",
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: 380 },
        scale: 0.66,
        anchor: { x: 0.5, y: 0.5 },
        alpha: 0,
      },
      this._noTintContent,
    );
    this._button_take_bonus.initialize();

    const take_bonus_text = new TextObject(
      this._game,
      {
        align: WidgetRoot.CENTER,
        offset: { x: 0, y: -10 },
        text: GetLocal(LocalKey.p_take_bonus),
        style: {
          fontSize: 100,
          fill: 0xffffff,
          fontFamily: "CeraProBlack",
          align: "center",
          fontWeight: "bold",
          stroke: 0x000000,
          strokeThickness: 2,
          dropShadow: {
            color: 0x000000,
            alpha: 0.7,
            blur: 4,
            distance: 0,
            angle: Math.PI / 6,
          },
        },
      },
      this._button_take_bonus.view,
    );
    take_bonus_text.initialize();
    //=====================================

    this._updatePositions();

    //this.graphicsInit();
    //this.runMainAnimation();

    //=====================================

    OnClick(this._button_take_bonus.view!, triggerCtaClick);
  }

  private _updatePositions(): void {
    if (!this._view) return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onResize(w: number, h: number): void {
    console.log("RoadGame.onResize");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layout = getLayoutType(this._game);

    if (this._mainContent) {
      this._mainContent!.x = 0;
      this._mainContent!.y = h / 2;

      const scale = Math.max(1, h / this._config.designSize.y);
      this._mainContent!.scale.set(scale);
    }

    if (this._bluredContent) {
      this._bluredContent!.x = 0;
      this._bluredContent!.y = h / 2;
      const ratio = w / this._contentWidth;
      this._bluredContent!.scale.set(ratio);
    }

    if (this._tint) {
      this._tint.x = -w / 2 - 2;
      this._tint.y = -2;
      this._tint.width = w + 4;
      this._tint.height = h + 4;
    }

    //===============================
  }

  graphicsInit(): void {
    //-----------------------------

    this._noTintContent!.position.set(
      this._initialAnimatedContentX,
      this._initialAnimatedContentY,
    );

    this._packshot_tara?.applyAlpha(0);
    this._kura_v_tare?.applyAlpha(0);

    if (this._onStageInit) this._onStageInit();
  }

  // Custom animation method
  public runMainAnimation(): void {
    if (!this.animator) return;

    this.animator.createTimeline();

    let startTime = 0;

    this.animator.addAnimation(
      startTime,
      startTime + 0.3,
      "power3.out",
      (et) => {
        this.view!.scale.set(et);
      },
    );
    //===============================

    this.animator.addCallback(startTime + 0.1, () => {
      this._packshot_tara?.applyAlpha(1);
      this._kura_v_tare?.applyAlpha(1);
    });

    this.animator.addCallback(startTime + 0.5, () => {
      this._packshot_tara?.gotoAndPlay(0);
      this._kura_v_tare?.gotoAndPlay(0);
    });

    const welcomeInitS = 1;
    const buttonInitS = 0.66;

    this.animator.addCallback(startTime + 0.5, () => {
      this._welcome_bonus_text!.applyAlpha(1);
      this._button_take_bonus!.applyAlpha(1);
    });

    this.animator.addAnimation(
      startTime + 0.5,
      startTime + 1,
      "power3.out",
      (et) => {
        const welcomeS1 = lerp(welcomeInitS * 0.1, welcomeInitS, et);
        const buttonS1 = lerp(buttonInitS * 0.1, buttonInitS, et);

        this._welcome_bonus_text!.view!.scale.set(welcomeS1, welcomeS1);
        this._button_take_bonus!.view!.scale.set(buttonS1, buttonS1);
      },
    );

    this.animator.addCallback(startTime + 1, () => {
      const btAn = this._button_take_bonus!.animator!;
      btAn.createTimeline();
      btAn.addAnimation(0, 20, "linear", (t, et) => {
        //const s = lerp(buttonInitS * 0.9, buttonInitS, et);
        const s = buttonInitS * (1 - 0.1 * Math.sin((et * 180 * 1) / Math.PI));
        this._button_take_bonus!.view!.scale.set(s, s);

        //console.log(`${getDateLog()}: t=${t}, et=${et}, value=${s}`);
      });
      btAn.play();
    });

    startTime += 5;
    this.animator.addCallback(startTime, () => {
      if (this._onStageEnd) this._onStageEnd();
    });
  }
}
