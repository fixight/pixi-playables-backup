import { BlurFilter, Container } from "pixi.js";
import { Game } from "../../../plugins/Game/Game.ts";
import { WidgetRoot } from "../../../plugins/Game/UI.ts";
import { GameGlobalState } from "../runtime/GameGlobalState.ts";
import { TopPanel } from "./containers/top_panel_cont.ts";
import { BottomPanel } from "./containers/bottom_panel.ts";
import { GetLocal } from "../../BUILD/Localization.ts";
import {
  LOCALIZATION_DATA,
  LocalKey,
} from "../../../plugins/Assets/_DATA_BASE/LocalizationGenerated.ts";
import { RoadGameAdaptive } from "./containers/road_game_adaptive.ts";
import { RoadGame } from "./containers/road_game.ts";
import { SpaceStage } from "./containers/space_stage.ts";
import { WinStage } from "./containers/win_stage.ts";
import { Stage4 } from "./containers/stage4.ts";
import { Stage5 } from "./containers/stage5.ts";

export function createScene1(
  game: Game,
  globalState: GameGlobalState,
): Container {
  const scene1 = new Container();
  scene1.sortableChildren = true;
  scene1.alpha = 0;

  game.ui.add(scene1, WidgetRoot.CENTER);
  game.ui.setChildIndex(scene1, 1);
  globalState.scene1 = scene1;

  const blurLayer = new Container();
  const blurFilter = new BlurFilter({ strength: 3 });
  blurFilter.padding = 64;
  blurLayer.filters = [blurFilter];
  scene1.addChild(blurLayer);

  /* const street = new Street(game, globalState.config, scene1);
  street.initialize(); */

  const topPanel = new TopPanel(game, globalState.config, scene1);

  const bottomPanel = new BottomPanel(
    game,
    globalState.config,
    scene1,
    onGoClick,
  );

  const roadGame = new RoadGame(
    game,
    globalState.config,
    scene1,
    () => {},
    (animName: string) => onAnimationStart(animName),
    (animName: string) => onAnimationEnd(animName),
    () => {
      bottomPanel.disableGoButton();
      globalState.timerController?.reset();

      roadGame.setVisibility(false);
      spaceStage.setVisibility(true);

      spaceStage.graphicsInit();
      spaceStage.runMainAnimation();
    },
  );

  const spaceStage = new SpaceStage(
    game,
    globalState.config,
    scene1,
    () => {
      // OnStageInit
    },
    () => {
      // OnRewardStart
      onRewardStart();
    },
    () => {
      // OnStageEnd

      spaceStage.setVisibility(false);
      winStage.setVisibility(true);

      winStage.graphicsInit();
      winStage.runMainAnimation();

      /* spaceStage.graphicsInit();
      spaceStage.runMainAnimation(); */
    },
  );

  const winStage = new WinStage(
    game,
    globalState.config,
    scene1,
    () => {
      // OnStageInit
    },
    () => {
      // OnRewardStart
    },
    () => {
      // OnStageEnd
      topPanel.setVisibility(false);
      bottomPanel.setVisibility(false);
      winStage.setVisibility(false);
      stage4.setVisibility(true);

      stage4.graphicsInit();
      stage4.runMainAnimation();
    },
  );

  const stage4 = new Stage4(
    game,
    globalState.config,
    scene1,
    () => {
      // OnStageInit
    },
    () => {
      // OnRewardStart
    },
    () => {
      // OnStageEnd
      //stage4.setVisibility(false);
      stage5.setVisibility(true);

      stage5.graphicsInit();
      stage5.runMainAnimation();
    },
  );

  const stage5 = new Stage5(
    game,
    globalState.config,
    scene1,
    () => {
      // OnStageInit
    },
    () => {
      // OnRewardStart
    },
    () => {
      // OnStageEnd
      //stage5.setVisibility(false);
    },
  );

  // INIT  SCENE

  const test = 0;

  initAndHideAll();

  if (test === 0) {
    topPanel.setVisibility(true);
    bottomPanel.setVisibility(true);
    roadGame.setVisibility(true);
    roadGame.graphicsInit();
  } else if (test === 1) {
    //spaceStage.initialize();
    topPanel.setVisibility(true);
    bottomPanel.setVisibility(true);
    spaceStage.setVisibility(true);
    spaceStage.graphicsInit();
    spaceStage.runMainAnimation();
  } else if (test === 2) {
    //winStage.initialize();
    topPanel.setVisibility(true);
    bottomPanel.setVisibility(true);
    winStage.setVisibility(true);
    winStage.graphicsInit();
    winStage.runMainAnimation();
  } else if (test === 3) {
    //stage4.initialize();
    stage4.setVisibility(true);
    stage4.graphicsInit();
    stage4.runMainAnimation();
  } else if (test === 4) {
    stage5.setVisibility(true);
    //stage5.initialize();

    stage5.graphicsInit();
    stage5.runMainAnimation();
  }

  function initAndHideAll() {
    topPanel.initialize();
    topPanel.setVisibility(false);
    //topPanel.view!.zIndex = 1000;

    bottomPanel.initialize();
    bottomPanel.setVisibility(false);
    //bottomPanel.view!.zIndex = 1000;

    roadGame.initialize();
    roadGame.setVisibility(false);

    spaceStage.initialize();
    spaceStage.setVisibility(false);
    spaceStage.view!.zIndex = -1;

    winStage.initialize();
    winStage.setVisibility(false);

    stage4.initialize();
    stage4.setVisibility(false);

    stage5.initialize();
    stage5.setVisibility(false);
  }

  //=================================

  if (globalState.timerController) {
    globalState.timerController.onTimerComplete = () => {
      bottomPanel.startGoButtonAnimation();
    };
  } else {
    console.error("TimerController is not initialized");
  }

  function onAnimationStart(animName: string) {
    bottomPanel.disableGoButton();
  }

  function onAnimationEnd(animName: string) {
    bottomPanel.enableGoButton();

    if (animName === "STEP1") {
      bottomPanel.runTextAmountAnimation(animName);
      topPanel.runTextAmountAnimation(animName);
      globalState.timerController?.start();
    }

    if (animName === "STEP2") {
      bottomPanel.runTextAmountAnimation(animName);
      topPanel.runTextAmountAnimation(animName);
      globalState.timerController?.start();
    }
  }

  function onRewardStart() {
    bottomPanel.enableGoButton();

    bottomPanel.runTextAmountAnimation("REWARD");
    topPanel.runTextAmountAnimation("REWARD");
  }

  function onGoClick() {
    bottomPanel.stopGoButtonAnimation();
    roadGame.runStepAnimation();
    globalState.timerController?.reset();
  }


  // ==========================================
  // ЛОГИКА ЗУМА И СДВИГА (Защита от перекрытия UI)
  // ==========================================
// ==========================================
  // ЛОГИКА ЗУМА КАМЕРЫ ДЛЯ УДАЛЕНИЯ ПОЛОС
  // ==========================================
// ==========================================
  // ЛОГИКА ЗУМА И ПОЗИЦИОНИРОВАНИЯ ИГРЫ (Cover + Offset)
  // ==========================================
// ==========================================
  // УМНЫЙ ЗУМ КАМЕРЫ (С учетом UI и игрока)
  // ==========================================
// ==========================================
  // ЛОГИКА ЗУМА КАМЕРЫ ДЛЯ УДАЛЕНИЯ ПОЛОС (Без перезаписи game)
  // ==========================================


  // ==========================================
  // ЛОГИКА ЗУМА КАМЕРЫ ДЛЯ УДАЛЕНИЯ ПОЛОС
  // ==========================================
// ==========================================
  // ЛОГИКА ЗУМА КАМЕРЫ ДЛЯ УДАЛЕНИЯ ПОЛОС (Без перезаписи game)
  // ==========================================


  /* spawnUIAtlasElement({
    game,
    parent: scene1,
    atlasKey: AssetsDB.data.atlas_game1,
    frameName: "street_x066.png",
    align: WidgetRoot.CENTER,
    offset: { x: 0, y: 300 },
    blur: 0,
    scale: 0.5,
    alpha: 1,
    rotation: 0,
    anchor: { x: 0.5, y: 0.5 },
  }); */

  /* spawnUISpriteElement({
    game,
    parent: scene1,
    textureKey: AssetsDB.texture.packshot_bg_x066,
    align: WidgetRoot.CENTER,
    offset: { x: 0, y: 0 },
    blur: 0,
    scale: 1,
    alpha: 0.5,
    rotation: 0,
    anchor: { x: 0.5, y: 0.5 },
  }); */

  return scene1;
}
