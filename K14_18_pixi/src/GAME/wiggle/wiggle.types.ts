export interface WiggleConfig {
  /** Амплитуда перемещения в пикселях */
  intensity?: number;
  /** Минимальная длительность перемещения (сек) */
  minDuration?: number;
  /** Максимальная длительность перемещения (сек) */
  maxDuration?: number;
  /** Тип easing для анимации */
  ease?: string;
  /** Количество одновременных твинов (больше = сложнее траектория) */
  complexity?: 1 | 2 | 3 | 4;
  /** Автоматический запуск */
  autoStart?: boolean;
}

export interface SmoothWiggleConfig {
  /** Амплитуда перемещения в пикселях */
  intensity?: number;
  /** Базовая скорость движения (чем выше, тем быстрее) */
  speed?: number;
  /** Коэффициент сглаживания (0-1, чем ближе к 1, тем более "пьяное" движение) */
  smoothness?: number;
  /** Автоматический запуск */
  autoStart?: boolean;
}

export interface WiggleInstance {
  /** Остановить все анимации */
  kill: () => void;
  /** Приостановить */
  pause: () => void;
  /** Возобновить */
  resume: () => void;
  /** Изменить интенсивность */
  setIntensity: (newIntensity: number) => void;
  /** Текущее состояние */
  isActive: boolean;
}
