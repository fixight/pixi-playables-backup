import type { LayoutType } from "./GAME/Layouts.ts";

export interface GameConfig {
  readonly designSize: { x: number; y: number };
  readonly background: string;
  readonly padding: { x: number; y: number };
  readonly REM: number;
  readonly fontFamily: string;
  readonly uiScale?: { min: number; max: number };
  readonly useCompressedAssets?: boolean;

  readonly effectsVolume?: number;
  readonly bgMusicVolume?: number;
  readonly idleTimeout?: number;

  readonly contentHeight: number;
  readonly contentWidth: number;
  readonly topHeight1: number;
  readonly topHeight2: number;
  readonly rectVMinHeight: number;
  readonly rectHMinWidth: number;

  readonly eurAmountOptions: {
    amountDuration1: number;
    topAmountValue1: number;
    topAmountValue2: number;
    topAmountValue3: number;

    amountDuration2: number;
    topAmountValue4: number;
  };
}

export const GAME_CONFIG: GameConfig = new (class implements GameConfig {
  readonly designSize = { x: 720, y: 1280 };
  readonly background = "#131318";
  readonly REM = 32;
  readonly padding = { x: 32, y: 32 };
  readonly fontFamily = "DynaPuff, Arial, sans-serif";
  readonly uiScale = { min: 1, max: 1 };
  readonly useCompressedAssets = false;

  readonly effectsVolume = 1.0;
  readonly bgMusicVolume = 0.25;
  readonly idleTimeout = 1.5;

  readonly contentHeight = 612;
  readonly contentWidth = 720;

  readonly topHeight1 = 107;
  readonly topHeight2 = 116;

  readonly rectVMinHeight = 526;
  readonly rectHMinWidth = 526;

  readonly eurAmountOptions = {
    amountDuration1: 0.5,
    topAmountValue1: 30,
    topAmountValue2: 150,
    topAmountValue3: 300,

    amountDuration2: 4.5,
    topAmountValue4: 38000,
  };

  readonly #fxInitialScales = {
    energyBlast: { vertical: 2, horizontal: 2.5 },
    cross: { vertical: 0.33, horizontal: 0.33 },
    //fishka3000: { vertical: 2.5, horizontal: 2.5 },
    fishka3000: { vertical: 0.66, horizontal: 0.66 },
    yourFreebet3000: { vertical: 2, horizontal: 2 },
    //yourWin3000: { vertical: 2, horizontal: 2 },
    yourWin3000: { vertical: 1, horizontal: 1.25 },
    your3000Freebet_s: { vertical: 0.66, horizontal: 1 },
    takeWithText: { vertical: 0.84, horizontal: 0.84 * 1.6 },
  } as const;

  readonly #ballInitialScales = {
    basketBall: { vertical: 2.94, horizontal: 2.94 * 1.3 }, // 200/68
    tennisBall: { vertical: 3.81, horizontal: 3.81 * 1.3 }, // 160/42
    puck: { vertical: 2.62, horizontal: 2.62 * 1.3 }, // 160/61
    footBall: { vertical: 3.17, horizontal: 3.17 * 1.3 }, // 200/63
  } as const;

  getEnergyBlastInitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.energyBlast[layout];
  }

  getCrossInitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.cross[layout];
  }

  getFishka3000InitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.fishka3000[layout];
  }

  getYourFreebet3000InitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.yourFreebet3000[layout];
  }

  getYourWin3000InitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.yourWin3000[layout];
  }

  getYour3000FreebetStaticInitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.your3000Freebet_s[layout];
  }

  getTakeWithTextInitialScale(layout: LayoutType): number {
    return this.#fxInitialScales.takeWithText[layout];
  }

  getBasketBallInitialScale(layout: LayoutType): number {
    return this.#ballInitialScales.basketBall[layout];
  }

  getTennisBallInitialScale(layout: LayoutType): number {
    return this.#ballInitialScales.tennisBall[layout];
  }

  getPuckInitialScale(layout: LayoutType): number {
    return this.#ballInitialScales.puck[layout];
  }

  getFootBallInitialScale(layout: LayoutType): number {
    return this.#ballInitialScales.footBall[layout];
  }
})();
