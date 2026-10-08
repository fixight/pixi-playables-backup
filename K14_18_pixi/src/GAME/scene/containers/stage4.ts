import { BlendModeFilter, Container, Graphics } from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { GameConfig } from "../../../../plugins/Game/GameConfig";
import { getLayoutType } from "../../Layouts";
import {
  AnimatedSpriteObject,
  ContainerObject,
  StaticAtlasObject,
  StaticSpriteObject,
  TextObject,
} from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { lerp, v2lerp, v2sum } from "../../../../plugins/Utils/utils";
import { Street as StreetBG } from "../objects/street_bg";
import { AssetsDB } from "../../../../plugins/Assets/_DATA_BASE/AssetsDB";
import { GetLocal } from "../../../BUILD/Localization";
import { LocalKey } from "../../../../plugins/Assets/_DATA_BASE/LocalizationGenerated";
import { TopPanel } from "./top_panel_cont";

export class Stage4 extends ContainerObject {
  private _config: GameConfig;

  private readonly _contentWidth = this._game._config.designSize.x;
  private readonly _contentHeight = this._game._config.designSize.y;
  private readonly _initialAnimatedContentX = 0;
  private readonly _initialAnimatedContentY = -1280;

  private _topContent: Container | null = null;
  private _bottomContent: Container | null = null;
  //private _centeredContent: Container | null = null;
  private _animatedContent: Container | null = null;

  private _mainBg: StaticSpriteObject | null = null;
  private _loading: AnimatedSpriteObject | null = null;
  private _eurValueText: TextObject | null = null;

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

    if (!this._view) return;

    // ======================================

    this._mainBg = new StaticSpriteObject(
      this._game,
      AssetsDB.texture.sc4_bg,
      {
        offset: { x: 0, y: 0 },
        scale: 0.667,
        anchor: { x: 0.5, y: 0 },
        alpha: 1,
      },
      this._view,
    );
    this._mainBg.initialize();

    // ======================================
    // mainContent - container with anchor (0, 0), fixed size
    // ======================================
    this._topContent = new Container();
    this._topContent.width = this._contentWidth;
    this._topContent.height = this._contentHeight;
    this._topContent.y = 0;
    this._view.addChild(this._topContent);

    this._bottomContent = new Container();
    this._bottomContent.width = this._contentWidth;
    this._bottomContent.height = this._contentHeight;
    this._bottomContent.y = this._contentHeight;
    this._view.addChild(this._bottomContent);

    //----------------------------------

    this._animatedContent = new Container();
    //this._mainContent.width = this._contentWidth;
    //this._mainContent.height = this._contentHeight;
    this._bottomContent.addChild(this._animatedContent);
    this._animatedContent.position.set(
      this._initialAnimatedContentX,
      this._initialAnimatedContentY,
    );

    //=====================================

    const topPanel = new StaticSpriteObject(
      this._game,
      AssetsDB.texture.sc4_top_bar,
      {
        offset: { x: 0, y: 0 },
        scale: 0.667,
        anchor: { x: 0.5, y: 0 },
        alpha: 1,
      },
      this._topContent,
    );
    topPanel.initialize();

    const topPanelSearchText = new TextObject(
      this._game,
      {
        position: { x: -240, y: 94 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0.5 },
        text: GetLocal(LocalKey.b_search),
        style: {
          fontFamily: "Arial",
          fontSize: 52,
          fill: 0xffffff,
          align: "left",
        },
      },
      topPanel.view,
    );
    topPanelSearchText.initialize();

    this._loading = new AnimatedSpriteObject(
      this._game,
      AssetsDB.data.loading,
      {
        offset: { x: 0, y: 30 },
        scale: 1.5,
        anchor: { x: 0.5, y: 0 },
        alpha: 0,
        animationSpeed: 0.25,
        autoStart: true,
        loop: true,
      },
      topPanel.view,
    );
    this._loading.initialize();

    //=====================================

    const sc4_comp = new StaticSpriteObject(
      this._game,
      AssetsDB.texture.sc4_comp1_066,
      {
        offset: { x: 0, y: 0 },
        scale: 1,
        anchor: { x: 0.5, y: 0 },
        alpha: 1,
      },
      this._animatedContent,
    );
    sc4_comp.initialize();

    //=====================================

    const personalEurText = new TextObject(
      this._game,
      {
        position: { x: 0, y: 220 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: GetLocal(LocalKey.b_personal_eur),
        style: {
          fontFamily: "Arial",
          fontSize: 38,
          fill: 0xffffff,
          align: "center",
        },
      },
      this._animatedContent,
    );
    personalEurText.initialize();

    this._eurValueText = new TextObject(
      this._game,
      {
        position: { x: 0, y: 300 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: this.formatAmount(22883),
        style: {
          fontFamily: "Arial",
          fontSize: 72,
          fill: 0xffffff,
          align: "center",
        },
      },
      this._animatedContent,
    );
    this._eurValueText.initialize();

    const accText = new TextObject(
      this._game,
      {
        position: { x: 5, y: 390 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        text: GetLocal(LocalKey.b_accounts),
        style: {
          fontFamily: "Arial",
          fontSize: 35,
          fill: 0xffffff,
          align: "center",
        },
      },
      this._animatedContent,
    );
    accText.initialize();

    const inviteFriendText = new TextObject(
      this._game,
      {
        position: { x: -320, y: 850 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0.5 },
        text: GetLocal(LocalKey.invite_friends),
        style: {
          fontFamily: "Arial",
          fontSize: 30,
          fill: 0x111111,
          align: "left",
        },
      },
      this._animatedContent,
    );
    inviteFriendText.initialize();

    const earnText = new TextObject(
      this._game,
      {
        position: { x: -320, y: 890 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
        text: GetLocal(LocalKey.earn),
        style: {
          fontFamily: "Arial",
          fontSize: 30,
          fill: 0x444444,
          align: "left",
          wordWrap: true,
          wordWrapWidth: 400,
        },
      },
      this._animatedContent,
    );
    earnText.initialize();

    const transactionText = new TextObject(
      this._game,
      {
        position: { x: -300, y: 1070 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
        text: GetLocal(LocalKey.t_transaction),
        style: {
          fontFamily: "Arial",
          fontSize: 24,
          fill: 0x444444,
          align: "left",
        },
      },
      this._animatedContent,
    );
    transactionText.initialize();

    const amountText = new TextObject(
      this._game,
      {
        position: { x: +300, y: 1070 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 1, y: 0 },
        text: GetLocal(LocalKey.t_amount),
        style: {
          fontFamily: "Arial",
          fontSize: 24,
          fill: 0x444444,
          align: "right",
        },
      },
      this._animatedContent,
    );
    amountText.initialize();

    const adresText = new TextObject(
      this._game,
      {
        position: { x: -200, y: 1110 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
        text: GetLocal(LocalKey.t_adres),
        style: {
          fontFamily: "Arial",
          fontSize: 35,
          fill: 0x111111,
          align: "left",
        },
      },
      this._animatedContent,
    );
    adresText.initialize();

    const amountValText = new TextObject(
      this._game,
      {
        position: { x: 300, y: 1110 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 1, y: 0 },
        text: "+€ 38 000.00",
        style: {
          fontFamily: "Arial",
          fontSize: 35,
          fill: 0x111111,
          align: "right",
        },
      },
      this._animatedContent,
    );
    amountValText.initialize();

    const nowText = new TextObject(
      this._game,
      {
        position: { x: -200, y: 1155 },
        scale: 1,
        alpha: 1,
        rotation: 0,
        anchor: { x: 0, y: 0 },
        text: GetLocal(LocalKey.t_date),
        style: {
          fontFamily: "Arial",
          fontSize: 30,
          fill: 0x111111,
          align: "left",
        },
      },
      this._animatedContent,
    );
    nowText.initialize();

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

    if (this._topContent) {
      this._topContent!.x = 0;
      this._topContent!.y = 0;
    }

    if (this._bottomContent) {
      this._bottomContent!.x = 0;
      this._bottomContent!.y = h;
    }

    /* if (this._streetMain) {
      this._streetMain.applyOffset({ x: -200, y: 0 });
    } */

    //===============================
  }

  graphicsInit(): void {
    //-----------------------------

    this._animatedContent!.position.set(
      this._initialAnimatedContentX,
      this._initialAnimatedContentY,
    );

    this._loading!.applyAlpha(0);

    if (this._onStageInit) this._onStageInit();
  }

  // Custom animation method
  public runMainAnimation(): void {
    if (!this.animator) return;

    this.animator.createTimeline();

    let startTime = 0;

    const amountStart = 83;
    const amountEnd = 38083;
    const viewInitScale = 1;

    this.animator.addAnimation(
      startTime,
      startTime + 0.33,
      "power3.out",
      (et) => {
        const s = lerp(3 * viewInitScale, viewInitScale, et);
        this.view!.scale.set(s, s);
      },
    );

    startTime += 0.7;
    const slideOffset = 150;

    this.animator.addAnimation(
      startTime,
      startTime + 0.5,
      "power3.inOut",
      (et) => {
        const y = lerp(
          this._initialAnimatedContentY,
          this._initialAnimatedContentY + slideOffset,
          et,
        );
        const x = this._initialAnimatedContentX;
        this._animatedContent!.position.set(x, y);
      },
    );

    this.animator.addCallback(startTime + 0.5, () => {
      this._loading!.applyAlpha(1);
    });

    this.animator.addAnimation(
      startTime + 0.3,
      startTime + 1.5,
      "linear",
      (et) => {
        const v = lerp(amountStart, amountEnd, et);
        this._eurValueText!.setText(this.formatAmount(v));
      },
    );

    this.animator.addCallback(startTime + 1.5, () => {
      this._loading!.applyAlpha(0);
    });

    this.animator.addAnimation(
      startTime + 1.5,
      startTime + 2,
      "power3.inOut",
      (et) => {
        const y = lerp(
          this._initialAnimatedContentY + slideOffset,
          this._initialAnimatedContentY,
          et,
        );
        const x = this._initialAnimatedContentX;
        this._animatedContent!.position.set(x, y);
      },
    );

    startTime += 2.5;

    this.animator.addAnimation(
      startTime,
      startTime + 0.33,
      "power3.in",
      (et) => {
        const s = lerp(viewInitScale, 3 * viewInitScale, et);
        this.view!.scale.set(s, s);
        this.view!.alpha = 1 - et;
      },
    );

    this.animator.addCallback(startTime, () => {
      if (this._onStageEnd) this._onStageEnd();
    });

    startTime += 0.33;

    //===============================

    /* this.animator.addCallback(startTime, () => {
      if (this._onStageEnd) this._onStageEnd();
    }); */
  }
}
