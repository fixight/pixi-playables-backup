import { BlurFilter, Container } from "pixi.js";
import { Game } from "../../../plugins/Game/Game.ts";
import { WidgetRoot } from "../../../plugins/Game/UI.ts";
import { GameGlobalState } from "../runtime/GameGlobalState.ts";

export function createScene2(
  game: Game,
  globalState: GameGlobalState,
): Container {
  const scene2 = new Container();
  scene2.alpha = 0;
  game.ui.add(scene2, WidgetRoot.CENTER);
  game.ui.setChildIndex(scene2, 0);
  globalState.scene2 = scene2;

  const blurLayer = new Container();
  const blurFilter = new BlurFilter({ strength: 3 });
  blurFilter.padding = 64;
  blurLayer.filters = [blurFilter];
  scene2.addChild(blurLayer);

  return scene2;
}
