import { sound } from "@pixi/sound";

// Type for audio keys - using string to avoid errors when audio key doesn't exist in AssetsDB
type AudioKey = string;

class SoundManagerClass {
  private bgMusicPlaying: boolean = false;
  private effectsVolume: number = 1.0;
  private bgMusicVolume: number = 0.5;

  /**
   * Initialize volume settings directly
   */
  init(effectsVol: number = 1.0, bgMusicVol: number = 0.5): void {
    this.effectsVolume = effectsVol;
    this.bgMusicVolume = bgMusicVol;
  }

  /**
   * Play a sound effect with configured volume
   */
  play(key: AudioKey): void {
    if (sound.exists(key)) {
      sound.play(key, { volume: this.effectsVolume });
    } else {
      console.warn(`Sound '${key}' not found`);
    }
  }

  /**
   * Play a sound with custom volume (overrides effect volume)
   */
  playWithVolume(key: AudioKey, volume: number): void {
    if (sound.exists(key)) {
      sound.play(key, { volume });
    } else {
      console.warn(`Sound '${key}' not found`);
    }
  }

  /**
   * Play bg_music - loops continuously
   * If already playing, don't restart
   */
  playBgMusic(): void {
    // If already playing, don't restart
    if (this.bgMusicPlaying) {
      return;
    }

    if (sound.exists("main-bg-music")) {
      sound.play("main-bg-music", {
        loop: true,
        volume: this.bgMusicVolume ?? 0.5,
      });
      this.bgMusicPlaying = true;
    } else {
      console.warn("Sound 'main-bg-music' not found");
    }
  }

  /**
   * Restart bg_music (force restart even if already playing)
   */
  restartBgMusic(): void {
    // Stop if already playing
    if (this.bgMusicPlaying) {
      sound.stop("bg_music");
      this.bgMusicPlaying = false;
    }

    if (sound.exists("bg_music")) {
      sound.play("bg_music", {
        loop: true,
        volume: this.bgMusicVolume ?? 0.5,
      });
      this.bgMusicPlaying = true;
    } else {
      console.warn("Sound 'bg_music' not found");
    }
  }

  /**
   * Stop bg_music if playing
   */
  stopBgMusic(): void {
    if (this.bgMusicPlaying) {
      sound.stop("bg_music");
      this.bgMusicPlaying = false;
    }
  }

  /**
   * Check if a sound exists
   */
  exists(key: string): boolean {
    return sound.exists(key);
  }
}

export const SoundManager = new SoundManagerClass();
