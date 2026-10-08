import {Assets, Sprite, Text} from "pixi.js";
import {WidgetRoot} from "./UI.ts";
import {Game} from "./Game.ts";
import {AssetsBase64} from "../Assets/AssetsBase64.ts";
import {Cover} from "../Utils/Components/Cover.ts";

// =====================================================================================

export function AddAutoIllustrativeText() {
    if (AD_NETWORK === 'ironsource')
        Game.I.ui.add(StyleText(new Text({
            text: "For illustrative purposes only",
            style: {
                fontSize: Game.I.config.REM,
                fill: "#fff",
                align: "center",
                stroke: { width: 2, color: '#000' },
            },
            anchor: { x: .5, y: .65 },
            zIndex: 9999
        })), WidgetRoot.BOTTOM);
}

// =====================================================================================

export function StyleText<T extends Text>(ins: T): T {
    ins.style.fontFamily = Game.I.config.fontFamily;
    return ins;
}

// =====================================================================================

export async function AddBackground(backgroundKey: string, pos: WidgetRoot = WidgetRoot.CENTER) {
    await AssetsBase64.load(backgroundKey, "texture");

    return Game.I.ui.add(
        new Sprite({
            texture: Assets.get(backgroundKey),
            anchor: .5
        }),
        pos,
        { x: 0, y: 0 },
        (ins, w, h) => {
            ins.scale.set(
                Math.max(
                    w / ins.texture.width,
                    h / ins.texture.height
                )
            );
        }
    );
}

// =====================================================================================

export function AddCover(alpha: number = .5, animDuration: number = .5) {
    return Game.I.ui.add(new Cover(
        Game.I.resizer,
        alpha,
        animDuration
    ), WidgetRoot.CENTER);
}

// =====================================================================================