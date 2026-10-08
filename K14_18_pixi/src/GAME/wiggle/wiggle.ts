// wiggle.ts
import gsap from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import type { SmoothWiggleConfig } from "./wiggle.types";

// Регистрируем PixiPlugin для работы с PIXI объектами
gsap.registerPlugin(PixiPlugin);

/**
 * Создает плавное случайное перемещение для PIXI объекта
 * @param target - PIXI.Container или любой объект с x/y координатами
 * @param config - конфигурация wiggle
 * @returns WiggleInstance с методами управления
 */
export function createSmoothWiggle<T extends { x: number; y: number }>(
  target: T,
  config: SmoothWiggleConfig = {},
) {
  const {
    intensity = 50,
    speed = 0.02,
    smoothness = 0.7, // по умолчанию средне-плавное
    autoStart = true,
  } = config;

  // Инвертируем smoothness для веса высоких частот
  const highFreqWeight = Math.max(0, 1 - smoothness); // 0 при smoothness=1, 1 при smoothness=0
  const lowFreqWeight = smoothness;

  let time = 0;
  let isActive = autoStart;

  // Набор частот: низкие и высокие
  const lowFreqs = [0.8, 1.2]; // медленные волны
  const highFreqs = [2.5, 4.0, 5.5]; // быстрые волны

  // Запоминаем начальную позицию
  const startX = target.x;
  const startY = target.y;

  const updatePosition = () => {
    if (!isActive) return;

    let offsetX = 0;
    let offsetY = 0;

    // Низкочастотная составляющая (плавная)
    for (let i = 0; i < lowFreqs.length; i++) {
      const freq = lowFreqs[i];
      const phase = (i * Math.PI) / 2;
      offsetX +=
        Math.sin(time * freq + phase) * intensity * lowFreqWeight * 0.5;
      offsetY +=
        Math.cos(time * freq + phase) * intensity * lowFreqWeight * 0.5;
    }

    // Высокочастотная составляющая (менее плавная)
    for (let i = 0; i < highFreqs.length; i++) {
      const freq = highFreqs[i];
      const phase = (i * Math.PI) / 3;
      offsetX +=
        Math.sin(time * freq + phase) * intensity * highFreqWeight * 0.2;
      offsetY +=
        Math.cos(time * freq + phase) * intensity * highFreqWeight * 0.2;
    }

    target.x = startX + offsetX;
    target.y = startY + offsetY;

    time += speed;
    requestAnimationFrame(updatePosition);
  };

  if (autoStart) {
    updatePosition();
  }

  return {
    start: () => {
      if (!isActive) {
        isActive = true;
        updatePosition();
      }
    },
    stop: () => {
      isActive = false;
    },
    setIntensity: (newIntensity: number) => {
      // Можно менять интенсивность на лету
      Object.assign(config, { intensity: newIntensity });
    },
    setSmoothness: (newSmoothness: number) => {
      Object.assign(config, { smoothness: newSmoothness });
    },
  };
}
