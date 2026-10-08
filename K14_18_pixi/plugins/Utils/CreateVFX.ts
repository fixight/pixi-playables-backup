import {AnimatedSprite, Assets} from "pixi.js";

// =====================================================================================

export function CreateVFX(key: string, loop: boolean = true, speedMod: number  = 1, onComplete: (() => void) | null = null): AnimatedSprite {
    const vfx = AnimatedSprite.fromFrames(Assets.get(key).animations[key]);
    vfx.anchor.set(.5);
    vfx.animationSpeed = 1 / vfx.totalFrames * 10 * speedMod;
    vfx.loop = loop;
    vfx.play();

    if (onComplete)
        vfx.onComplete = onComplete;
    else if (!loop)
        vfx.onComplete = () => {
            vfx.stop();
            vfx.destroy();
        };

    return vfx;
}

// =====================================================================================