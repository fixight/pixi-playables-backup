import { Container, Sprite } from "pixi.js";
import {
  OnPointerMove,
  OffPointerMove,
  PointerMoveEvent,
} from "../../plugins/Utils/UIEvents.ts";

/**
 * PointerController - Controls pointer positioning and idle detection
 *
 * Features:
 * - Tracks mouse movement and positions the pointer sprite to follow cursor
 * - Detects idle state after configurable timeout
 * - Runs tutorial animation when idle, enables positioning on movement
 */
export class PointerController {
  private _stage: Container;
  private _pointerSprite: Sprite;
  private _idleTimeout: number; // in seconds
  private _isPositioningEnabled: boolean = false;
  private _idleTimer: number | null = null;
  private _lastMousePosition: { x: number; y: number } | null = null;
  private _hasHadFirstMovement: boolean = false;
  private _onPointerMoveCallback: ((event: PointerMoveEvent) => void) | null =
    null;
  // Container for local positioning (optional)
  private _positioningContainer: Container | null = null;

  // Callbacks for external control
  public onRunTutorialAnimation: (() => void) | null = null;
  public onStopTutorialAnimation: (() => void) | null = null;
  canShowPonterWhenPointerMove: boolean;

  constructor(
    stage: Container,
    pointerSprite: Sprite,
    idleTimeout: number = 3,
    canShowPonterWhenPointerMove: boolean = true,
  ) {
    this._stage = stage;
    this._pointerSprite = pointerSprite;
    this._idleTimeout = idleTimeout;
    this.canShowPonterWhenPointerMove = canShowPonterWhenPointerMove;

    //this._stage.eventMode = "static";

    this._onPointerMoveCallback = this._handlePointerMove.bind(this);
  }

  public activate() {
    OnPointerMove(this._stage, this._onPointerMoveCallback!);
    this._resetIdleTimer();
  }

  public deactivate() {
    OffPointerMove(this._stage, this._onPointerMoveCallback!);
    this._clearIdleTimer();
  }

  /**
   * Enable pointer positioning - pointer follows mouse cursor
   */
  public enablePositioning(): void {
    if (this._isPositioningEnabled) return;

    this._isPositioningEnabled = true;
    this._pointerSprite.visible = true;
    // IMPORTANT: Set to passive so this sprite doesn't block pointer events
    // from reaching clickable objects below it
    this._pointerSprite.eventMode = "passive";
    this._pointerSprite.cursor = "none";

    // Clear any existing idle timer (but don't start a new one yet)
    this._clearIdleTimer();
    // Reset first movement flag - timer will start after first movement
    this._hasHadFirstMovement = false;

    // If we have a last position, move pointer there immediately
    if (this._lastMousePosition) {
      this._updatePointerPosition(
        this._lastMousePosition.x,
        this._lastMousePosition.y,
      );
    }

    console.log("[PointerController] Positioning enabled");
  }

  /**
   * Disable pointer positioning - stops following mouse
   * Note: Still keeps the move listener to detect resumed movement
   */
  public disablePositioning(): void {
    if (!this._isPositioningEnabled) return;

    this._isPositioningEnabled = false;

    // Unsubscribe from pointer move events
    //OffPointerMove(this._stage, this._onPointerMoveCallback!);

    // Clear idle timer
    this._clearIdleTimer();

    console.log("[PointerController] Positioning disabled");
  }

  /**
   * Handle pointer move event
   */
  private _handlePointerMove(event: PointerMoveEvent): void {
    // Store last mouse position
    this._lastMousePosition = { x: event.globalX, y: event.globalY };

    // If positioning is disabled (tutorial animation is playing), detect resumed movement
    if (!this._isPositioningEnabled) {
      // User started moving after idle - resume positioning and stop tutorial
      this.onMovementResumed();
      return;
    }

    // Update pointer position to follow cursor
    this._updatePointerPosition(event.globalX, event.globalY);

    // Start/reset idle timer after first movement
    if (!this._hasHadFirstMovement) {
      this._hasHadFirstMovement = true;
    }
    this._resetIdleTimer();
  }

  /**
   * Set container for local positioning
   * When set, pointer position will be calculated in local coordinates of this container
   * @param container - Container to position pointer in, or null for global positioning
   */
  public setPositioningContainer(container: Container | null): void {
    this._positioningContainer = container;

    if (container !== null) {
      // Reparent pointer sprite to the positioning container if not already there
      if (this._pointerSprite.parent !== container) {
        container.addChild(this._pointerSprite);
      }
      console.log("[PointerController] Positioning container set");
    } else {
      // Return to stage if no container specified
      if (this._pointerSprite.parent !== this._stage) {
        this._stage.addChild(this._pointerSprite);
      }
      console.log(
        "[PointerController] Positioning container cleared (using global coordinates)",
      );
    }

    // Update position immediately if we have last position
    if (this._lastMousePosition && this._isPositioningEnabled) {
      this._updatePointerPosition(
        this._lastMousePosition.x,
        this._lastMousePosition.y,
      );
    }
  }

  /**
   * Get current positioning container
   */
  public get positioningContainer(): Container | null {
    return this._positioningContainer;
  }

  /**
   * Update pointer sprite position
   */
  private _updatePointerPosition(globalX: number, globalY: number): void {
    if (this._positioningContainer !== null) {
      // Convert global coordinates to local coordinates of the positioning container
      const localPoint = this._positioningContainer.toLocal({
        x: globalX,
        y: globalY,
      });
      this._pointerSprite.x = localPoint.x;
      this._pointerSprite.y = localPoint.y;
    } else {
      // Global positioning (original behavior)
      this._pointerSprite.x = globalX;
      this._pointerSprite.y = globalY;
    }
  }

  /**
   * Reset idle timer - called on mouse movement
   */
  private _resetIdleTimer(): void {
    // Clear existing timer
    this._clearIdleTimer();

    // Start new timer
    this._idleTimer = window.setTimeout(() => {
      this._onIdleTimeout();
    }, this._idleTimeout * 1000);
  }

  /**
   * Clear idle timer
   */
  private _clearIdleTimer(): void {
    if (this._idleTimer !== null) {
      window.clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  /**
   * Called when idle timeout is reached
   */
  private _onIdleTimeout(): void {
    console.log("[PointerController] Idle timeout reached");

    // Disable positioning
    this.disablePositioning();

    // Run tutorial animation
    if (this.onRunTutorialAnimation) {
      this.onRunTutorialAnimation();
    }
  }

  /**
   * Handle resumed movement - called externally when mouse starts moving
   */
  public onMovementResumed(): void {
    if (!this._isPositioningEnabled) {
      console.log("[PointerController] Movement resumed");

      // Stop tutorial animation
      if (this.onStopTutorialAnimation) {
        this.onStopTutorialAnimation();
      }

      // Enable positioning
      this.enablePositioning();
    }
  }

  /**
   * Update idle timeout duration
   */
  public setIdleTimeout(seconds: number): void {
    this._idleTimeout = seconds;
  }

  /**
   * Check if positioning is currently enabled
   */
  public get isPositioningEnabled(): boolean {
    return this._isPositioningEnabled;
  }

  /**
   * Destroy the controller and clean up
   */
  public destroy(): void {
    this._clearIdleTimer();
    OffPointerMove(this._stage, this._onPointerMoveCallback!);
    this._onPointerMoveCallback = null;
    this.onRunTutorialAnimation = null;
    this.onStopTutorialAnimation = null;
    this._positioningContainer = null;
  }
}
