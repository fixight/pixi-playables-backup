import { Container } from "pixi.js";
import { TimerController } from "../TimerController.ts";
import { GameConfig } from "../../../plugins/Game/GameConfig.ts";

export interface GameGlobalState {
  config: GameConfig;
  timeline?: gsap.core.Timeline;
  scene1?: Container;
  scene2?: Container;
  timerController?: TimerController;
}

export function createGlobalState(config: GameConfig): GameGlobalState {
  return {
    config,
  };
}
