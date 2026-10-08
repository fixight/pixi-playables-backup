import * as PIXI from "pixi.js";
import { Text } from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);

export class TextAnimator {
  text: Text;
  timeline: gsap.core.Timeline | null;
  private _value: number;
  private _prefix: string;
  private _postfix: string;
  private _roundTo: number;

  constructor(
    text: Text,
    initValue: number = 0,
    prefix: string = "",
    postfix: string = "",
    roundTo: number = 0,
    private _animDuration: number = 0.5,
  ) {
    this.text = text;
    this.timeline = null;
    this._value = initValue;
    this._prefix = prefix;
    this._postfix = postfix;
    this._roundTo = roundTo;

    this.applyDefaultFormat();
  }

  private applyDefaultFormat(): void {
    this.text.text = `${this._prefix}${this._value.toFixed(this._roundTo)}${this._postfix}`;
  }

  // Метод для запуска анимации значения
  runValueAnimation(
    from: number,
    to: number,
    startTime: number,
    duration: number,
    options: { ease?: string; format?: (value: number) => string } = {},
  ) {
    if (!this.timeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    // Сохраняем текущее значение для анимации
    this._value = from;
    this.applyDefaultFormat();

    this.timeline.to(
      this,
      {
        _value: to,
        duration: duration,
        ease: options.ease || "power2.inOut",
        onUpdate: () => {
          const formattedText = options.format
            ? options.format(this._value)
            : `${this._prefix}${this._value.toFixed(this._roundTo)}${this._postfix}`;
          this.text.text = formattedText;
        },
        onComplete: () => {
          // Если предоставлена функция форматирования, используем её для финального значения
          const formattedText = options.format
            ? options.format(to)
            : `${this._prefix}${to.toFixed(this._roundTo)}${this._postfix}`;
          this.text.text = formattedText;
        },
      },
      startTime,
    );
  }

  // Метод для мгновенного установления значения
  setValue(
    value: number,
    startTime: number = 0,
    options: { format?: (value: number) => string } = {},
  ) {
    if (!this.timeline) {
      throw new Error("Timeline not created. Call createTimeline() first.");
    }

    this._value = value;
    const formattedText = options.format
      ? options.format(value)
      : `${this._prefix}${value.toFixed(this._roundTo)}${this._postfix}`;
    this.text.text = formattedText;

    // Используем set для мгновенного изменения (без анимации)
    this.timeline.set(this, { _value: value }, startTime);
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

  // Остановка и очистка
  kill() {
    if (this.timeline) this.timeline.kill();
  }
}
