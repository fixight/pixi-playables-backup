import { Container } from "pixi.js";

const POINTER_MOVE_HANDLERS = new WeakMap<
  Container,
  Map<(event: PointerMoveEvent) => void, (event: globalThis.PointerEvent) => void>
>();

// =====================================================================================

export function OnClick(el: Container, onClick: () => void) {
  el.eventMode = "static";
  el.cursor = "pointer";
  el.addEventListener("pointerdown", onClick);
}

export function OffClick(el: Container, onClick: () => void) {
  el.eventMode = "none";
  el.cursor = "none";
  el.removeEventListener("pointerdown", onClick);
}

// =====================================================================================

export function OnHover(el: Container, onHover: () => void) {
  el.addEventListener("pointerenter", onHover);
}

export function OffHover(el: Container, onHover: () => void) {
  el.removeEventListener("pointerenter", onHover);
}

// =====================================================================================

export function OnUnhover(el: Container, onUnhover: () => void) {
  el.addEventListener("pointerleave", onUnhover);
}

export function OffUnhover(el: Container, onUnhover: () => void) {
  el.addEventListener("pointerleave", onUnhover);
}

// =====================================================================================

export type PointerMoveEvent = {
  globalX: number;
  globalY: number;
};

export function OnPointerMove(
  el: Container,
  onPointerMove: (event: PointerMoveEvent) => void,
) {
  let handlersByCallback = POINTER_MOVE_HANDLERS.get(el);
  if (!handlersByCallback) {
    handlersByCallback = new Map();
    POINTER_MOVE_HANDLERS.set(el, handlersByCallback);
  }

  if (handlersByCallback.has(onPointerMove)) return;

  const wrappedHandler = (event: globalThis.PointerEvent) => {
    onPointerMove({
      globalX: event.clientX,
      globalY: event.clientY,
    });
  };

  handlersByCallback.set(onPointerMove, wrappedHandler);
  window.addEventListener("pointermove", wrappedHandler);
}

export function OffPointerMove(
  el: Container,
  onPointerMove: (event: PointerMoveEvent) => void,
) {
  const handlersByCallback = POINTER_MOVE_HANDLERS.get(el);
  const wrappedHandler = handlersByCallback?.get(onPointerMove);
  if (!wrappedHandler) return;

  window.removeEventListener("pointermove", wrappedHandler);
  handlersByCallback?.delete(onPointerMove);

  if (handlersByCallback && handlersByCallback.size === 0) {
    POINTER_MOVE_HANDLERS.delete(el);
  }
}

// =====================================================================================
