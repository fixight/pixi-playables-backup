// =====================================================================================

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max));
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// =====================================================================================

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, a: number, b: number) {
  return Math.min(Math.max(v, a), b);
}

// =====================================================================================

export function v2lerp(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const xl = lerp(a.x, b.x, t);
  const yl = lerp(a.y, b.y, t);
  return { x: xl, y: yl };
}

export function v2sum(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  const xl = a.x + b.x;
  const yl = a.y + b.y;
  return { x: xl, y: yl };
}

export function v2sub(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  const xl = a.x - b.x;
  const yl = a.y - b.y;
  return { x: xl, y: yl };
}

export function v2scalar(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const r = a.x * b.x + a.y * b.y;
  return r;
}

// =====================================================================================

export function isNumber(val: any): boolean {
  return typeof val === "number";
}

export function isString(val: any): boolean {
  return typeof val === "string";
}

// =====================================================================================

export function delay(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration * 1000));
}

// =====================================================================================

/* eslint-disable */
export function debounceFunc(func: (...args: any) => void, ...args: any) {
  const delay = 100;
  let timeoutId: number;
  return () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      func(args);
    }, delay);
  };
}

// =====================================================================================

export function fillTemplate(template: string, jsonData: any) {
  return Object.keys(jsonData).reduce((result, key) => {
    const placeholder = new RegExp(`{${key}}`, "g");
    return result.replace(placeholder, jsonData[key]);
  }, template);
}

// =====================================================================================

export function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((a) => [Math.random(), a] as [number, T])
    .sort((a, b) => a[0] - b[0])
    .map((a) => a[1]);
}

// =====================================================================================

export function getDateLog() {
  const now = new Date();

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
}
