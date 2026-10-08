import { gsap } from "gsap";
import MotionPathPlugin from "gsap/MotionPathPlugin";
import { Container } from "pixi.js";

gsap.registerPlugin(MotionPathPlugin);

// Type for motion path - can be SVG path string or array of points
type MotionPath = string | Array<{ x: number; y: number }>;

export type GSAPEaseString =
  | "none"
  | "power1"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "power2"
  | "power2.in"
  | "power2.out"
  | "power2.inOut"
  | "power3"
  | "power3.in"
  | "power3.out"
  | "power3.inOut"
  | "power4"
  | "power4.in"
  | "power4.out"
  | "power4.inOut"
  | "back"
  | "back.in"
  | "back.out"
  | "back.inOut"
  | "bounce"
  | "bounce.in"
  | "bounce.out"
  | "bounce.inOut"
  | "circ"
  | "circ.in"
  | "circ.out"
  | "circ.inOut"
  | "elastic"
  | "elastic.in"
  | "elastic.out"
  | "elastic.inOut"
  | "expo"
  | "expo.in"
  | "expo.out"
  | "expo.inOut"
  | "sine"
  | "sine.in"
  | "sine.out"
  | "sine.inOut"
  | ({} & string);

interface CurveMovementOptions {
  curviness?: number;
  autoRotate?: boolean;
  ease?: GSAPEaseString;
}

// Interface for keyframe data points
export interface ObjectPoint {
  frame: number;
  pos: { x: number; y: number };
  size: number | { x: number; y: number };
  rotation?: number;
  alpha?: number;
}

export class ContainerAnimator {
  container: Container;
  timeline: gsap.core.Timeline | undefined;
  initialScale: { x: number; y: number };

  constructor(container: Container) {
    this.container = container;
    this.initialScale = container.scale;

    this.createTimeline();
  }

  setInitialScale(scale: { x: number; y: number }) {
    this.initialScale = scale;
  }

  // Метод для установки начальной позиции
  setStartPosition(x: number, y: number) {
    gsap.set(this.container, { x, y });
  }

  // Метод для добавления движения по кривой
  addMovement(
    path: MotionPath,
    startTime: number,
    duration: number,
    options: CurveMovementOptions = {},
  ) {
    if (!this.timeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    // Extract starting position from path
    let startX = 0;
    let startY = 0;
    if (Array.isArray(path) && path.length > 0) {
      startX = path[0].x;
      startY = path[0].y;
    }

    // Instantly set position to start point before movement (zero-duration tween)
    this.timeline.set(this.container, { x: startX, y: startY }, startTime);

    this.timeline.to(
      this.container,
      {
        duration,
        motionPath: {
          path,
          curviness: options.curviness || 1,
          autoRotate: options.autoRotate || false,
        },
        ease: options.ease || "linear",
        onComplete: () => {},
      },
      startTime,
    );
  }

  // Метод для добавления анимации клика с разделёнными колбеками
  addClickAnimation(
    startTime: number,
    onStart?: () => void,
    onComplete1?: () => void,
    onComplete2?: () => void,
  ) {
    if (!this.timeline) return;

    const duration1 = 0.25;
    const duration2 = 0.5;

    this.timeline.set(this.container.scale, this.initialScale, startTime);

    // Часть 1: уменьшение
    this.timeline.to(
      this.container.scale,
      {
        duration: duration1,
        x: this.initialScale.x * 0.85,
        y: this.initialScale.y * 0.85,
        ease: "quad.in",
        onStart: () => {
          onStart?.();
        },
        onComplete: () => {
          onComplete1?.();
        },
      },
      startTime,
    );

    // Часть 2: увеличение
    this.timeline.to(
      this.container.scale,
      {
        duration: duration2,
        x: this.initialScale.x * 1,
        y: this.initialScale.y * 1,
        ease: "elastic.out",
        onStart: () => {},
        onComplete: () => {
          onComplete2?.();
        },
      },
      startTime + duration1,
    );
  }

  // Метод для добавления fade in
  addFadeIn(
    startTime: number,
    duration: number = 0.3,
    onComplete?: () => void,
  ) {
    if (!this.timeline) return;
    this.timeline.to(
      this.container,
      {
        duration,
        alpha: 1,
        ease: "none",
        onComplete: () => {
          onComplete?.();
        },
      },
      startTime,
    );
  }

  // Метод для добавления fade out
  addFadeOut(
    startTime: number,
    duration: number = 0.5,
    onComplete?: () => void,
  ) {
    if (!this.timeline) return;
    this.timeline.to(
      this.container,
      {
        duration,
        alpha: 0,
        ease: "none",
        onComplete: () => {
          onComplete?.();
        },
      },
      startTime,
    );
  }
  addRotationTo(
    angle: number,
    startTime: number,
    duration: number = 0.5,
    ease: string = "cubic.inOut",
    onComplete?: () => void,
  ) {
    if (!this.timeline) return;
    this.timeline.to(
      this.container,
      {
        duration,
        rotation: (angle * Math.PI) / 180,
        ease: ease,
        onComplete: () => {
          onComplete?.();
        },
      },
      startTime,
    );
  }
  // Метод для добавления анимации scale
  addScaleTo(
    startTime: number,
    targetScaleX: number,
    targetScaleY: number,
    duration: number = 0.6,
    ease: string = "elastic.out(1.5, 0.1)",
    onComplete?: () => void,
  ) {
    if (!this.timeline) return;
    this.timeline.to(
      this.container.scale,
      {
        duration,
        x: targetScaleX,
        y: targetScaleY,
        ease,
        onComplete: () => {
          onComplete?.();
        },
      },
      startTime,
    );
  }

  // Метод для добавления scale
  setRotation(rotation: number, startTime: number = 0) {
    if (!this.timeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    this.timeline.call(
      () => {
        this.container.rotation = (rotation * Math.PI) / 180;
      },
      undefined,
      startTime,
    );
  }

  setScale(scale: { x: number; y: number }, startTime: number = 0) {
    if (!this.timeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    this.timeline.set(
      this.container.scale,
      { x: scale.x, y: scale.y },
      startTime,
    );
  }

  setAlpha(alpha: number, startTime: number = 0) {
    if (!this.timeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    this.timeline.set(this.container, { alpha }, startTime);
  }

  // Создание нового таймлайна (сбрасывает предыдущий)
  createTimeline() {
    if (this.timeline) {
      this.timeline.kill();
    }
    this.timeline = gsap.timeline();
    return this.timeline;
  }

  // Запуск анимации (можно просто вызвать, таймлайн запускается автоматически)
  play() {
    if (this.timeline) this.timeline.play();
  }

  restart() {
    if (this.timeline) this.timeline.restart();
  }

  // Остановка и очистка
  kill() {
    if (this.timeline) this.timeline.kill();
  }

  // Метод для добавления колбека в указанное время
  addCallback(startTime: number, callback: () => void) {
    if (!this.timeline) return;

    this.timeline.call(callback, undefined, startTime);
  }

  // Метод для добавления задержки с колбеком после её завершения
  addDelay(startTime: number, duration: number, onComplete?: () => void) {
    if (!this.timeline) return;

    this.timeline.call(
      () => {
        onComplete?.();
      },
      undefined,
      startTime + duration,
    );
  }

  // Метод для добавления кастомной анимации с прогрессом t от 0 до 1
  addAnimation(
    startTime: number,
    endTime: number,
    ease: GSAPEaseString = "none",
    callback?: (t: number, et: number) => void,
  ) {
    if (!this.timeline) return;

    const progress = { t: 0, et: 0 };

    // Get the ease function from GSAP
    const easeFn = gsap.parseEase(ease);

    // If timeline is already past startTime, start from current time
    const actualStartTime =
      this.timeline.time() > startTime ? this.timeline.time() : startTime;
    const actualDuration = Math.max(0, endTime - actualStartTime);

    if (actualDuration <= 0) {
      console.warn(
        `Duration is less than or equal to zero. startTime: ${startTime}, endTime: ${endTime}`,
      );
      return;
    }

    this.timeline.to(
      progress,
      {
        t: 1,
        duration: actualDuration,
        ease: "none", // We apply easing manually
        onUpdate: () => {
          // Apply easing manually to get the eased value
          const et = easeFn(progress.t);
          if (callback) callback(progress.t, et);
        },
      },
      actualStartTime,
    );
  }

  // Метод для добавления анимации по ключевым кадрам
  addKeyframeAnimation(
    framesData: ObjectPoint[],
    initialData: {
      startTime: number;
      positionOffset: { x: number; y: number };
      positionMultiplier: { x: number; y: number };
      rotationOffset: number;
      scaleMultiplier: { x: number; y: number };
      fps?: number;
    },
    container?: Container,
    timeline?: gsap.core.Timeline,
  ) {
    const targetContainer = container ?? this.container;
    const targetTimeline = timeline ?? this.timeline;

    if (!targetContainer) {
      throw new Error("Target container is not defined.");
    }

    if (!targetTimeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    if (!framesData || framesData.length === 0) {
      console.warn("addKeyframeAnimation: framesData is empty.");
      return;
    }

    const fps = initialData.fps ?? 30;
    if (fps <= 0) {
      throw new Error("addKeyframeAnimation: fps must be greater than 0.");
    }

    const frameDuration = 1 / fps;
    const {
      startTime,
      positionOffset,
      positionMultiplier,
      rotationOffset,
      scaleMultiplier,
    } = initialData;

    const sortedFrames = [...framesData].sort((a, b) => a.frame - b.frame);
    const firstFrame = sortedFrames[0];

    const getSizeXY = (size: ObjectPoint["size"]) => {
      if (typeof size === "number") {
        return { x: size, y: size };
      }
      return size;
    };

    const getFrameState = (
      frameData: ObjectPoint,
      firstFrameData: ObjectPoint,
    ) => {
      const frameSize = getSizeXY(frameData.size);
      const firstFrameSize = getSizeXY(firstFrameData.size);

      const baseSizeX = firstFrameSize.x === 0 ? 1 : firstFrameSize.x;
      const baseSizeY = firstFrameSize.y === 0 ? 1 : firstFrameSize.y;

      return {
        x: positionOffset.x + frameData.pos.x * positionMultiplier.x,
        y: positionOffset.y + frameData.pos.y * positionMultiplier.y,
        rotation:
          ((frameData.rotation ?? 0) + rotationOffset) * (Math.PI / 180),
        scaleX: scaleMultiplier.x * (frameSize.x / baseSizeX),
        scaleY: scaleMultiplier.y * (frameSize.y / baseSizeY),
        alpha: frameData.alpha ?? 1,
      };
    };

    const firstFrameTime = startTime;
    const firstState = getFrameState(firstFrame, firstFrame);

    // Hard-set initial state so animation does not depend on previous object state.
    targetTimeline.set(
      targetContainer,
      {
        x: firstState.x,
        y: firstState.y,
        rotation: firstState.rotation,
        alpha: firstState.alpha,
      },
      firstFrameTime,
    );
    targetTimeline.set(
      targetContainer.scale,
      {
        x: firstState.scaleX,
        y: firstState.scaleY,
      },
      firstFrameTime,
    );

    if (sortedFrames.length === 1) {
      return;
    }

    for (let i = 0; i < sortedFrames.length - 1; i++) {
      const currentFrame = sortedFrames[i];
      const nextFrame = sortedFrames[i + 1];

      const frameTime =
        startTime + (currentFrame.frame - firstFrame.frame) * frameDuration;
      const duration = (nextFrame.frame - currentFrame.frame) * frameDuration;

      if (duration <= 0) {
        const nextState = getFrameState(nextFrame, firstFrame);
        targetTimeline.set(
          targetContainer,
          {
            x: nextState.x,
            y: nextState.y,
            rotation: nextState.rotation,
            alpha: nextState.alpha,
          },
          frameTime,
        );
        targetTimeline.set(
          targetContainer.scale,
          {
            x: nextState.scaleX,
            y: nextState.scaleY,
          },
          frameTime,
        );
        continue;
      }

      const nextState = getFrameState(nextFrame, firstFrame);

      targetTimeline.to(
        targetContainer,
        {
          x: nextState.x,
          y: nextState.y,
          rotation: nextState.rotation,
          alpha: nextState.alpha,
          duration,
          ease: "none",
        },
        frameTime,
      );

      targetTimeline.to(
        targetContainer.scale,
        {
          x: nextState.scaleX,
          y: nextState.scaleY,
          duration,
          ease: "none",
        },
        frameTime,
      );
    }

    const lastFrame = sortedFrames[sortedFrames.length - 1];
    const lastFrameTime =
      startTime + (lastFrame.frame - firstFrame.frame) * frameDuration;
    const lastState = getFrameState(lastFrame, firstFrame);

    targetTimeline.set(
      targetContainer,
      {
        x: lastState.x,
        y: lastState.y,
        rotation: lastState.rotation,
        alpha: lastState.alpha,
      },
      lastFrameTime,
    );
    targetTimeline.set(
      targetContainer.scale,
      {
        x: lastState.scaleX,
        y: lastState.scaleY,
      },
      lastFrameTime,
    );
  }
}
