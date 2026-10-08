/**
 * TimerController - Controls game timer functionality
 *
 * Features:
 * - Countdown timer with configurable duration
 * - Start, stop, pause, resume, and reset functionality
 * - Callback events for timer tick (every second) and completion
 * - Auto-start option on construction
 */
export class TimerController {
  private _duration: number; // in seconds
  private _remainingTime: number; // in seconds
  private _isRunning: boolean = false;
  private _timerId: number | null = null;
  private _lastTickTime: number = 0;

  // Callbacks for external control
  public onTimerTick: ((remainingTime: number) => void) | null = null;
  public onTimerComplete: (() => void) | null = null;
  public onTimerStart: (() => void) | null = null;
  public onTimerStop: (() => void) | null = null;

  constructor(duration: number = 60, autoStart: boolean = false) {
    this._duration = duration;
    this._remainingTime = duration;

    if (autoStart) {
      this.start();
    }
  }

  /**
   * Start or resume the timer
   */
  public start(): void {
    if (this._isRunning) return;

    this._isRunning = true;
    console.log("[TimerController] Timer started");

    if (this.onTimerStart) {
      this.onTimerStart();
    }

    // Start the timer loop
    this._startTimerLoop();
  }

  /**
   * Stop the timer (stops completely, resets to initial duration)
   */
  public stop(): void {
    if (!this._isRunning) return;

    this._isRunning = false;
    this._clearTimer();

    // Reset to initial duration
    this._remainingTime = this._duration;

    console.log("[TimerController] Timer stopped");

    if (this.onTimerStop) {
      this.onTimerStop();
    }
  }

  /**
   * Pause the timer (keeps current remaining time)
   */
  public pause(): void {
    if (!this._isRunning) return;

    this._isRunning = false;
    this._clearTimer();

    console.log(`[TimerController] Timer paused at ${this._remainingTime}s`);
  }

  /**
   * Resume the timer from where it was paused
   */
  public resume(): void {
    if (this._isRunning) return;

    this._isRunning = true;
    console.log("[TimerController] Timer resumed");

    this._startTimerLoop();
  }

  /**
   * Reset the timer to initial duration
   */
  public reset(): void {
    this._clearTimer();
    this._remainingTime = this._duration;
    this._isRunning = false;

    console.log("[TimerController] Timer reset");
  }

  /**
   * Set a new duration and reset timer
   */
  public setDuration(seconds: number): void {
    this._duration = seconds;
    this._remainingTime = seconds;

    if (this._isRunning) {
      this._clearTimer();
      this._startTimerLoop();
    }

    console.log(`[TimerController] Duration set to ${seconds}s`);
  }

  /**
   * Get current remaining time
   */
  public get remainingTime(): number {
    return this._remainingTime;
  }

  /**
   * Get total duration
   */
  public get duration(): number {
    return this._duration;
  }

  /**
   * Check if timer is running
   */
  public get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Get progress as percentage (0-1)
   */
  public get progress(): number {
    if (this._duration === 0) return 0;
    return 1 - this._remainingTime / this._duration;
  }

  /**
   * Internal timer loop
   */
  private _startTimerLoop(): void {
    this._lastTickTime = Date.now();

    // Use setInterval for accurate ticking
    this._timerId = window.setInterval(() => {
      this._tick();
    }, 1000);
  }

  /**
   * Handle timer tick
   */
  private _tick(): void {
    if (!this._isRunning) return;

    this._remainingTime = Math.max(0, this._remainingTime - 1);

    // Fire tick callback
    if (this.onTimerTick) {
      this.onTimerTick(this._remainingTime);
    }

    // Check if timer completed
    if (this._remainingTime <= 0) {
      this._onTimerComplete();
    }
  }

  /**
   * Called when timer reaches zero
   */
  private _onTimerComplete(): void {
    this._isRunning = false;
    this._clearTimer();

    console.log("[TimerController] Timer completed");

    if (this.onTimerComplete) {
      this.onTimerComplete();
    }
  }

  /**
   * Clear internal timer
   */
  private _clearTimer(): void {
    if (this._timerId !== null) {
      window.clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  /**
   * Destroy the controller and clean up
   */
  public destroy(): void {
    this._clearTimer();
    this._isRunning = false;
    this.onTimerTick = null;
    this.onTimerComplete = null;
    this.onTimerStart = null;
    this.onTimerStop = null;
  }
}
