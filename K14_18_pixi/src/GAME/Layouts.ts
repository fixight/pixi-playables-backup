import { Game } from "../../plugins/Game/Game.ts";

export type LayoutType = "vertical" | "horizontal";

export function getLayoutType(game: Game): LayoutType {
  const { realWidth, realHeight } = game.resizer;
  return realHeight > realWidth ? "vertical" : "horizontal";
}
