import * as PIXI from "pixi.js";
import {gsap} from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

// @ts-expect-error API
import Animation = gsap.core.Animation;
import {Container} from "pixi.js";
import EaseString = gsap.EaseString;

PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);

// =====================================================================================

export function Play(anim: Animation, awaitCompletion: boolean = true) {
    anim.pause();
    return (): Animation => {
        if (!awaitCompletion || !anim.isActive())
            anim.play(0);

        return anim;
    }
}

// =====================================================================================

export function AnimAlpha(
    target: Container,
    alpha: { from: number, to: number } = { from: 0, to: 1 },
    duration: number = .5,
    ease: EaseString = "power1",
    onComplete?: gsap.Callback | undefined
) {
    target.alpha = alpha.from;
    return gsap.timeline()
        .set(target, { pixi: { alpha: alpha.from } })
        .to(target, {
            duration: duration,
            ease: ease,
            onComplete: onComplete,
            pixi: { alpha: alpha.to },
        });
}

// =====================================================================================

export function AnimScale(
    target: Container,
    scale: { from: number, to: number } = { from: 0, to: 1 },
    duration: number = .5,
    ease: EaseString = "power1",
    onComplete?: gsap.Callback | undefined
) {
    target.scale = scale.from;
    return gsap.timeline()
        .set(target, { pixi: { scale: scale.from } })
        .to(target, {
            duration: duration,
            ease: ease,
            onComplete: onComplete,
            pixi: { scale: scale.to },
        });
}

// =====================================================================================

export function AnimAmplitude(
    target: Container,
    amplitude: { x: number, y: number },
    duration: number = .5
) {
    return gsap.to(target, {
        duration: duration,
        x: `+=${amplitude.x}`,
        y: `+=${amplitude.y}`,
        repeat: -1,
        yoyo: true,
    });
}

// =====================================================================================

export function AnimPulseIn(target: Container, inScale: number, duration: number, onComplete: gsap.Callback | undefined = undefined) {
    target.scale = 1;
    return gsap.to(target, {
        duration: duration / 2,
        pixi: { scale: inScale },
        ease: "back.in",
        yoyo: true,
        repeat: 1, // FOR YOYO
        onComplete: onComplete,
    });
}

// =====================================================================================