import { gsap } from "gsap";
import { TimerController } from "../TimerController.ts";
import { Game } from "../../../plugins/Game/Game.ts";
import { GameGlobalState } from "./GameGlobalState.ts";
import { SoundManager } from "../SoundManager.ts";
import { GameConfig } from "../../config.ts";

export function setupRuntimeAndStart(
  _game: Game,
  globalState: GameGlobalState,
  deps: {
    onAwake: () => void;
    onStart: () => void;
    onTimerComplete?: () => void;
    onTimerTick?: () => void;
  },
) {
  createGlobalTimerControleller(globalState, deps);
  createGlobalTimeline(globalState, deps);
  initSounds(globalState.config);

  deps.onAwake();

  setTimeout(() => {}, 3000);


  //console.log("LOCALIZATION: ", LOCALIZATION);
}

function initSounds(globalConfig: GameConfig) {
  // Initialize SoundManager with config volumes
  const effectsVol = globalConfig?.effectsVolume ?? 1.0;
  const bgMusicVol = globalConfig?.bgMusicVolume ?? 0.5;
  SoundManager.init(effectsVol, bgMusicVol);
  console.log("Sounds initialized");
}
function createGlobalTimerControleller(
  globalState: GameGlobalState,
  deps: {
    onAwake: () => void;
    onStart: () => void;
    onTimerComplete?: () => void;
    onTimerTick?: () => void;
  },
) {
  globalState.timerController = new TimerController(
    globalState.config.idleTimeout,
    false,
  );

  globalState.timerController.onTimerTick = () => {};

  globalState.timerController.onTimerComplete = () => {
    console.log("[Timer] Time is up!");
    if (deps.onTimerComplete) deps.onTimerComplete();
  };

  globalState.timerController.onTimerStart = () => {
    console.log("[Timer] Timer started");
  };

  globalState.timerController.onTimerStop = () => {
    console.log("[Timer] Timer stopped");
  };
}
function createGlobalTimeline(
  globalState: GameGlobalState,
  deps: {
    onAwake: () => void;
    onStart: () => void;
    onTimerComplete?: () => void;
    onTimerTick?: () => void;
  },
) {
  globalState.timeline = gsap.timeline();
  globalState.timeline.call(deps.onStart, [], 0.25);
}
