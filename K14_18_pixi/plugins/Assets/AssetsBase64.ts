import { Assets, Texture, Rectangle } from "pixi.js";

import { LoadAssetsDB } from "./LoadAssetsDB";
import { sound, Sound } from "@pixi/sound";
import { category } from "./assets_utils.ts";

let ASSETS: any;

export class AssetsBase64 {
  public static async loadAll() {
    ASSETS = await LoadAssetsDB();

    await Promise.all([
      this.loadCategory("font", ASSETS.font),
      this.loadCategory("texture", ASSETS.texture),
      this.loadCategory("audio", ASSETS.audio),
      this.loadCategory("video", ASSETS.video),
      this.loadCategory("data", ASSETS.data),
      // this.loadCategory('gif', ASSETS.gif),
    ]);
  }

  private static async loadCategory(
    type: category,
    assets: Record<string, any> | undefined,
  ) {
    if (!assets) return;

    const promises = Object.entries(assets).map(([key, value]) => {
      switch (type) {
        case "font":
          return this.loadFont(key, value);
        case "texture":
          return this.loadTexture(key, value);
        case "audio":
          return this.loadSound(key, value);
        case "video":
          return this.loadVideo(key, value);
        case "data":
          return this.loadAnim(key, value);
        // case "gif": return this.loadGif(key, value);
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  public static async load(key: string, type: category) {
    ASSETS = await LoadAssetsDB();

    switch (type) {
      case "texture":
        await this.loadTexture(key, ASSETS.texture[key]);
        break;
      case "audio":
        await this.loadSound(key, ASSETS.texture[key]);
        break;
      case "video":
        await this.loadVideo(key, ASSETS.texture[key]);
        break;
      case "data":
        await this.loadAnim(key, ASSETS.texture[key]);
        break;
      case "font":
        await this.loadFont(key, ASSETS.texture[key]);
        break;
      // case "gif": await this.loadGif(key, ASSETS.texture[key]); break;
    }
  }

  public static async loadFont(key: string, value: string) {
    if (Assets.cache.has(key) || !value) return;

    const font = await new FontFace(key, `url(${value})`).load();
    document.fonts.add(font);
    Assets.cache.set(key, font);
  }

  public static async loadTexture(key: string, value: string) {
    if (Assets.cache.has(key)) return;

    Assets.cache.set(key, await this.Base64ToTexture(value, key));
  }

  public static async loadSound(key: string, value: string) {
    if (sound.exists(key)) return;

    sound.add(key, await this.Base64ToAudio(value));
  }

  public static async loadVideo(key: string, value: string) {
    if (Assets.cache.has(key)) return;

    Assets.cache.set(key, await this.Base64ToVideo(value, key));
  }

  public static async loadAnim(
    key: string,
    anim: {
      frames: Object;
      meta: { image: string; useTrimming?: boolean; useAnchor?: boolean };
    },
  ) {
    if (Assets.cache.has(key)) return;

    //console.log(`> ${key} : ${JSON.stringify(anim.meta)}`);

    const useAsTrimmed =
      (anim.meta as any).usetrimming || (anim.meta as any).useTrimming || false;
    const useAnchor =
      (anim.meta as any).useanchor || (anim.meta as any).useAnchor || false;

    const tex = await this.Base64ToTexture(
      ASSETS.texture[`${key}_tex`],
      `Anim ${key}`,
    );

    Assets.cache.set(key, anim);
    Assets.cache.set(anim.meta.image, tex);

    const frames = Object.entries(anim.frames);

    // Берем spriteSourceSize первого кадра для расчета смещения
    const firstFrameData = frames[0]?.[1];
    const firstSS = firstFrameData?.spriteSourceSize as
      | { x: number; y: number; w: number; h: number }
      | undefined;

    for (const [fKey, f] of frames) {
      // По умолчанию используем только frame, как в StaticAtlasObject
      // Не используем trim - он вызывает смещение позиции при anchor
      const textureOptions: ConstructorParameters<typeof Texture>[0] = {
        source: tex.source,
        label: fKey,
        frame: new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h),
        orig: new Rectangle(0, 0, f.frame.w, f.frame.h),
      };

      // Если useAsTrimmed=true и есть данные trim (spriteSourceSize в формате TexturePacker)
      const hasTrim = f.trimmed === true && f.spriteSourceSize;
      if (useAsTrimmed && hasTrim) {
        const ss = f.spriteSourceSize; // {x, y, w, h}
        const ss_orig = f.sourceSize; // {w, h}
        //console.log(`Текстура ${fKey} будет иметь trim:`, ss);

        // frame - обрезанная область в атласе
        textureOptions.frame = new Rectangle(
          f.frame.x,
          f.frame.y,
          f.frame.w,
          f.frame.h,
        );

        // Если useAnchor - компенсируем смещение
        if (useAnchor && firstSS) {
          //console.log(`Текстура ${fKey} будет иметь anchored offset:`, ss);
          // orig равен размеру frame - позиция как без trim
          textureOptions.orig = new Rectangle(0, 0, f.frame.w, f.frame.h);
          // trim - смещение = spriteSourceSize текущего кадра минус spriteSourceSize первого кадра
          textureOptions.trim = new Rectangle(
            ss.x - firstSS.x,
            ss.y - firstSS.y,
            ss.w,
            ss.h,
          );
        } else {
          // orig - оригинальный размер спрайта (sourceSize)
          textureOptions.orig = new Rectangle(0, 0, ss_orig.w, ss_orig.h);
          // trim - смещение обрезанной области относительно оригинального спрайта
          textureOptions.trim = new Rectangle(ss.x, ss.y, ss.w, ss.h);
        }
      }

      Assets.cache.set(fKey, new Texture(textureOptions));
    }
  }

  // public static async loadGif(key: string, value: string) {
  //     if (Assets.cache.has(key)) return;
  //
  //     Assets.cache.set(key, await this.Base64ToGif(value, key));
  // }

  private static Base64ToTexture(
    base64Data: string,
    debugTitle: string,
  ): Promise<Texture> {
    return new Promise((resolve) => {
      try {
        const cleanBase64 = base64Data.replace(/\s/g, "");

        const img = new Image();
        img.src = cleanBase64;

        img.onload = () => {
          resolve(Texture.from(img));
        };

        img.onerror = () => {
          console.log("Image error", debugTitle);
          resolve(Texture.EMPTY);
        };
      } catch (error) {
        resolve(Texture.EMPTY);
      }
    });
  }

  private static async Base64ToVideo(
    base64Data: string,
    debugTitle: string,
  ): Promise<Texture> {
    const video = document.createElement("video");
    video.src = base64Data;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    await new Promise<void>((resolve) => {
      video.oncanplaythrough = () => resolve();
      video.load();
    });

    try {
      await video.play();
      return Texture.from(video);
    } catch {
      console.log("Video error", debugTitle);
      return Texture.EMPTY;
    }
  }

  private static async Base64ToAudio(base64Data: string): Promise<Sound> {
    const snd = Sound.from(base64Data);
    await snd.isLoaded; // 50 ms
    return snd;
  }

  // private static Base64ToGif(base64Data: string, debugTitle: string): Promise<GifSource | null> {
  //     return new Promise(async (resolve) => {
  //         try {
  //             const cleanBase64 = base64Data.replace(/\s/g, '');
  //
  //             const r = await fetch(cleanBase64);
  //             const arrayBuffer = await r.arrayBuffer();
  //
  //             resolve(GifSource.from(arrayBuffer));
  //         } catch (error) {
  //             console.log("Gif error", debugTitle);
  //             resolve(null);
  //         }
  //     });
  // }
}
