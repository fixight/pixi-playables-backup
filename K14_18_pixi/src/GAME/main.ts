import { gsap } from "gsap";
import { Game } from "../../plugins/Game/Game.ts";
import { GameConfig } from "../../plugins/Game/GameConfig.ts";
import { setupRuntimeAndStart } from "./runtime/bootstrap.ts";
import { startWithMraidOrDirect } from "./cta/cta.ts";
import { createScene1 } from "./scene/Scene1.ts";
import { createScene2 } from "./scene/Scene2.ts";
import { SoundManager } from "./SoundManager.ts";
import { createGlobalState } from "./runtime/GameGlobalState.ts";
import { game } from "../index.ts";

let globalConfig: GameConfig;
const globalState = createGlobalState({} as GameConfig);

// Global pointer sprite reference for console access

//let globalPointerController: PointerController;

export async function Main(game: Game) {
  globalConfig = game.config;
  globalState.config = game.config;

  startWithMraidOrDirect(game, runApp);
}

function runApp(game: Game): void {
  setupRuntimeAndStart(game, globalState, {
    onAwake: () => {
      createScene2(game, globalState);
      createScene1(game, globalState);
    },
    onStart: start,
  });
}

function start() {
  const sc1 = globalState.scene1!;
  sc1.visible = true;
  sc1.alpha = 1;
  sc1.rotation = 0;
  sc1.scale.set(1);

  const sc2 = globalState.scene2!;
  sc2.visible = false;

  const timerController = globalState.timerController!;
  timerController.start();

  // Play background music
  SoundManager.playBgMusic();
}

export function gotoScene2() {
  // Set initial state for scene2
  const sc1 = globalState.scene1!;
  const sc2 = globalState.scene2!;
  sc2.alpha = 0;
  sc2.scale.set(0.6666666666666666);
  sc2.rotation = (60 * Math.PI) / 180;
  sc2.visible = true;

  game.resize();

  //globalYour3000Freebet.alpha = 1;
  //globalYour3000Freebet.gotoAndPlay(0);

  const tl = gsap.timeline();
  const sc1OutDuration = 0.55;
  const sc2InDuration = 1.5;

  tl.to(
    sc1,
    {
      alpha: 0,
      duration: 0.25,
      ease: "linear",
    },
    sc1OutDuration - 0.25,
  );

  tl.to(
    sc1,
    {
      rotation: (-60 * Math.PI) / 180,
      ease: "cubic.in",
      duration: sc1OutDuration,
      onUpdate: function () {
        const progress = this.progress();
        const eased = gsap.parseEase("cubic.in")(progress);
        sc1.scale.set(1 + eased * 3.5);
      },
      onComplete: () => {
        sc1.visible = false;
      },
    },
    0,
  );

  tl.to(
    sc2,
    {
      alpha: 1,
      duration: 0.25,
      ease: "linear",
    },
    sc1OutDuration,
  );

  tl.to(
    sc2,
    {
      rotation: 0,
      ease: "cubic.out",
      duration: sc2InDuration,
      onUpdate: function () {
        const progress = this.progress();
        const eased = gsap.parseEase("cubic.out")(progress);
        sc2.scale.set(0.15 + eased * 0.85);
      },
      onComplete: () => {
        /* for (let i = 0; i < globalCoinsExplosion_arr.length; i++) {
          const coinsExplosion = globalCoinsExplosion_arr[i];
          coinsExplosion.alpha = 1;
          coinsExplosion.gotoAndPlay(0);
        } */
      },
    },
    sc1OutDuration,
  );
}

// Expose to global window for browser console access
declare global {
  interface Window {
    start: typeof start;
    gotoScene2: typeof gotoScene2;
  }
}

if (typeof window !== "undefined") {
  window.start = start;
  window.gotoScene2 = gotoScene2;
}
