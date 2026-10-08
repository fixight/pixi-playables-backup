import {
  Assets,
  Container,
  Sprite,
  BlurFilter,
  Texture,
  Rectangle,
  AnimatedSprite,
  Ticker,
  Filter,
  Text,
  TextString,
  TextStyle,
  RenderTexture,
  ColorMatrixFilter,
} from "pixi.js";
import { Game } from "../../plugins/Game/Game.ts";
import { WidgetRoot } from "../../plugins/Game/UI.ts";
import { ContainerAnimator } from "./ContainerAnimator.ts";
import { TextAnimator } from "./TextAnimator.ts";
import { DropShadowFilter, DropShadowFilterOptions } from "pixi-filters";

export type GraphicType = Sprite | AnimatedSprite | Text;
// =====================================================
// Options Types (without callbacks)
// =====================================================
export type CustomBlurOptions = {
  strength: number;
};

/* export type CustomDropShadowOptions = {
  color?: number;
  alpha?: number;
  distance?: number;
  angle?: number;
  size?: number;
  blur?: number;
  quality?: number;
}; */

export interface BaseContainerOptions {
  align?: WidgetRoot;
  position?: { x: number; y: number };
  offset?: { x: number; y: number };
  blur?: CustomBlurOptions;
  dropShadow?: DropShadowFilterOptions;
  alpha?: number;
  rotation?: number;
  scale?: number | { x: number; y: number };
  anchor?: number | { x: number; y: number };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StaticSpriteOptions extends BaseContainerOptions {}

export interface AnimatedSpriteOptions extends BaseContainerOptions {
  animationSpeed?: number;
  loop?: boolean;
  autoStart?: boolean;
  yoyo?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AtlasSpriteOptions extends BaseContainerOptions {
  showMainTexWhenKeyNotFound?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TextOptions extends BaseContainerOptions {
  text: TextString;
  style?: Partial<TextStyle>;
}

// =====================================================
// Base Object Class
// =====================================================

export class ContainerObject {
  protected _view?: Container;
  protected _parent?: Container;
  protected _animator?: ContainerAnimator;
  protected _game: Game;
  protected _initialOptions: BaseContainerOptions;

  private _filters: Filter[];
  private _blurFilter?: BlurFilter;
  private _dropShadowFilter?: DropShadowFilter;

  constructor(
    game: Game,
    initialOptions: BaseContainerOptions,
    parent?: Container,
  ) {
    this._game = game;
    this._initialOptions = initialOptions;
    this._parent = parent;

    this._filters = [];
  }

  initialize(): void {
    this._view = new Container();
    this._animator = new ContainerAnimator(this._view);

    if (!this._view) return;

    this.applyInitialOptions(this._view);
    this.addToUILayer(this._view, this._parent);
  }

  get view(): Container | undefined {
    return this._view;
  }

  get animator(): ContainerAnimator | undefined {
    return this._animator;
  }

  /**
   * Returns debug info: class name + view constructor name.
   * Useful for identifying which ContainerObject subclass triggered a warning.
   */
  protected getDebugTypeInfo(): string {
    const className = this.constructor.name;
    const viewCtorName = this._view?.constructor?.name ?? "unknown";
    return `${className}(${viewCtorName})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTick(ticker: Ticker): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(w: number, h: number): void {}

  protected applyInitialOptions(obj: Container): void {
    this.applyPositionInternal(
      obj,
      this._initialOptions.position,
      this._initialOptions.offset,
    );
    this.applyAlphaInternal(obj, this._initialOptions.alpha);
    this.applyRotationInternal(obj, this._initialOptions.rotation);
    this.applyScaleInternal(obj, this._initialOptions.scale);
    this.applyBlurInternal(obj, this._initialOptions.blur);
    this.applyDropShadowInternal(obj, this._initialOptions.dropShadow);
  }

  public setVisibility(visible: boolean): void {
    if (this._view === undefined) {
      //console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this._view.visible = visible;
  }

  public applyAlpha(alpha?: number): void {
    if (this._view === undefined) {
      //console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this.applyAlphaInternal(this._view, alpha);
  }
  private applyAlphaInternal(sprite: Container, alpha?: number): void {
    if (alpha === undefined) {
      /* console.warn(
        `[${this.getDebugTypeInfo()}] initial alpha not not found in options`,
      ); */
      return;
    }

    sprite.alpha = alpha;
  }

  public applyPosition(
    pos?: { x: number; y: number },
    offset?: { x: number; y: number },
  ): void {
    if (this._view === undefined) return;
    this.applyPositionInternal(this._view, pos, offset);
  }
  private applyPositionInternal(
    sprite: Container,
    pos?: { x: number; y: number },
    offset?: { x: number; y: number },
  ): void {
    let resultPos = pos !== undefined ? { x: pos.x, y: pos.y } : { x: 0, y: 0 };

    if (offset !== undefined)
      resultPos = {
        x: resultPos.x + offset.x,
        y: resultPos.y + offset.y,
      };

    sprite.position.set(resultPos.x, resultPos.y);
  }

  public applyOffset(offset?: { x: number; y: number }): void {
    if (this._view === undefined) {
      //console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this.applyOffsetInternal(this._view, offset);
  }
  private applyOffsetInternal(
    sprite: Container,
    offset?: { x: number; y: number },
  ): void {
    if (offset === undefined) {
      console.warn(
        `[${this.getDebugTypeInfo()}] initial offset not not found in options`,
      );
      return;
    }

    sprite.position.set(
      this.view!.position.x + offset.x,
      this.view!.position.y + offset.y,
    );
  }

  public applyRotation(rotation?: number): void {
    if (this._view === undefined) {
      console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this.applyRotationInternal(this._view, rotation);
  }
  private applyRotationInternal(sprite: Container, rotation?: number): void {
    if (rotation === undefined) {
      /* console.warn(
        `[${this.getDebugTypeInfo()}] initial rotation not not found in options`,
      ); */
      return;
    }

    sprite.rotation = (rotation * Math.PI) / 180;
  }

  public applyScale(scale?: number | { x: number; y: number }): void {
    if (this._view === undefined) {
      console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this.applyScaleInternal(this._view, scale);
  }
  private applyScaleInternal(
    sprite: Container,
    scale?: number | { x: number; y: number },
  ): void {
    if (scale === undefined) {
      /* console.warn(
        `[${this.getDebugTypeInfo()}] initial scale not not found in options`,
      ); */
      return;
    }

    if (typeof scale === "number") {
      sprite.scale.set(scale);
    } else {
      sprite.scale.set(scale.x, scale.y);
    }
  }

  public applyBlur(blurOptions?: CustomBlurOptions): void {
    if (this._view === undefined) {
      console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this.applyBlurInternal(this._view, blurOptions);
  }
  private applyBlurInternal(
    sprite: Container,
    blurOptions?: CustomBlurOptions,
  ): void {
    if (blurOptions && blurOptions.strength > 0) {
      if (!this._blurFilter) {
        this._blurFilter = new BlurFilter();
        this._filters.push(this._blurFilter);
        sprite.filters = this._filters;
      }

      this._blurFilter.strength = blurOptions.strength;
      this._blurFilter.padding = blurOptions.strength * 2;
    } else {
      if (this._blurFilter) {
        this._filters.splice(this._filters.indexOf(this._blurFilter), 1);
        sprite.filters = this._filters;
      }
    }
  }

  public applyDropShadow(dropShadowOptions?: DropShadowFilterOptions): void {
    if (this._view === undefined) {
      //console.warn(`[${this.getDebugTypeInfo()}] Container not initialized`);
      return;
    }
    this.applyDropShadowInternal(this._view, dropShadowOptions);
  }
  private applyDropShadowInternal(
    sprite: Container,
    dropShadowOptions?: DropShadowFilterOptions,
  ): void {
    if (dropShadowOptions) {
      // если есть опции
      if (!this._dropShadowFilter) {
        this._dropShadowFilter = new DropShadowFilter(dropShadowOptions);
        this._filters.push(this._dropShadowFilter);
        sprite.filters = this._filters;
      } else {
        // Обновляем параметры существующего фильтра
        if (dropShadowOptions.color !== undefined) {
          this._dropShadowFilter.color = dropShadowOptions.color;
        }
        if (dropShadowOptions.alpha !== undefined) {
          this._dropShadowFilter.alpha = dropShadowOptions.alpha;
        }
        if (dropShadowOptions.offset !== undefined) {
          this._dropShadowFilter.offset = dropShadowOptions.offset;
        }
        if (dropShadowOptions.blur !== undefined) {
          this._dropShadowFilter.blur = dropShadowOptions.blur;
        }
        if (dropShadowOptions.quality !== undefined) {
          this._dropShadowFilter.quality = dropShadowOptions.quality;
        }
        if (dropShadowOptions.pixelSize !== undefined) {
          this._dropShadowFilter.pixelSize = dropShadowOptions.pixelSize;
        }
      }
    } else {
      // если нет опций но фильтр установлоен, удаляем его
      if (this._dropShadowFilter) {
        this._filters.splice(this._filters.indexOf(this._dropShadowFilter), 1);
        sprite.filters = this._filters;
        this._dropShadowFilter = undefined;
      }
    }
  }

  protected addToUILayer(obj: Container, parent?: Container): void {
    const offset = this._initialOptions.offset ?? { x: 0, y: 0 };

    if (!parent) {
      this._game.ui.add(
        obj,
        this._initialOptions.align,
        offset,
        () => {},
        true,
      );
      return;
    }

    parent.addChild(obj);

    if (this._initialOptions.align !== undefined) {
      this._game.resizer.addResizeAction(obj.uid, (w, h) => {
        //console.log("onResize: ", w, h, );

        const uiScaleX = this._game.ui.container.scale.x || 1;
        const uiScaleY = this._game.ui.container.scale.y || 1;
        const halfW = w / uiScaleX / 2;
        const halfH = h / uiScaleY / 2;

        switch (this._initialOptions.align) {
          case WidgetRoot.TOP:
            obj.position.set(0, -halfH);
            break;
          case WidgetRoot.BOTTOM:
            obj.position.set(0, halfH);
            break;
          case WidgetRoot.LEFT:
            obj.position.set(-halfW, 0);
            break;
          case WidgetRoot.RIGHT:
            obj.position.set(halfW, 0);
            break;
          case WidgetRoot.TOP_LEFT:
            obj.position.set(-halfW, -halfH);
            break;
          case WidgetRoot.TOP_RIGHT:
            obj.position.set(halfW, -halfH);
            break;
          case WidgetRoot.BOTTOM_LEFT:
            obj.position.set(-halfW, halfH);
            break;
          case WidgetRoot.BOTTOM_RIGHT:
            obj.position.set(halfW, halfH);
            break;
          case WidgetRoot.CENTER:
          default:
            obj.position.set(0, 0);
            break;
        }

        obj.x += offset.x;
        obj.y += offset.y;

        this.onResize(w, h);
      });
    }
  }
}

export abstract class GraphicObject extends ContainerObject {
  constructor(
    game: Game,
    initialOptions: BaseContainerOptions,
    parent?: Container,
  ) {
    super(game, initialOptions, parent);
  }

  protected override applyInitialOptions(obj: GraphicType): void {
    this.applyAnchorInternal(obj, this._initialOptions.anchor);
    super.applyInitialOptions(obj);
  }

  public applyAnchor(anchor?: number | { x: number; y: number }): void {
    if (this._view === null) return;
    this.applyAnchorInternal(this._view as GraphicType, anchor);
  }
  private applyAnchorInternal(
    obj: GraphicType,
    anchor?: number | { x: number; y: number },
  ): void {
    if (typeof anchor === "number") {
      obj.anchor.set(anchor);
    } else if (anchor) {
      obj.anchor.set(anchor.x, anchor.y);
    } else {
      obj.anchor.set(0.5, 0.5);
    }
  }
}

// =====================================================
// Static Sprite Object (from texture)
// =====================================================

export class StaticSpriteObject extends GraphicObject {
  private _textureKey: string;

  constructor(
    game: Game,
    textureKey: string,
    options: StaticSpriteOptions,
    parent?: Container,
  ) {
    super(game, options, parent);
    this._textureKey = textureKey;
  }

  override initialize(): void {
    this._view = new Sprite(Assets.get(this._textureKey));
    this._animator = new ContainerAnimator(this._view);

    if (!this._view) return;

    this.applyInitialOptions(this._view as Sprite);
    this.addToUILayer(this._view, this._parent);
  }
}

// =====================================================
// Animated Sprite Object (from atlas)
// =====================================================

export class AnimatedSpriteObject extends GraphicObject {
  private _animKey: string;

  _direction: number;
  private _onYoYoComplete: () => void;

  constructor(
    game: Game,
    animKey: string,
    options: AnimatedSpriteOptions,
    parent?: Container,
  ) {
    super(game, options, parent);
    this._animKey = animKey;
    this._direction = 1;
  }

  get direction(): number {
    return this._direction;
  }

  override initialize(): void {
    const sheet = Assets.get(this._animKey) as {
      animations: Record<string, string[]>;
    };

    if (!sheet || !sheet.animations) {
      console.error(
        "[AnimatedSpriteObject] Sheet or animations not found:",
        this._animKey,
      );
      return;
    }

    const animationName = Object.keys(sheet.animations)[0];

    this._view = AnimatedSprite.fromFrames(sheet.animations[animationName]);
    this._animator = new ContainerAnimator(this._view);

    if (!this._view) return;

    (this._view as AnimatedSprite).animationSpeed =
      (this._initialOptions as AnimatedSpriteOptions).animationSpeed ?? 0.5;

    (this._view as AnimatedSprite).loop =
      (this._initialOptions as AnimatedSpriteOptions).loop ?? true;

    if ((this._initialOptions as AnimatedSpriteOptions).autoStart) this.play();
    if ((this._initialOptions as AnimatedSpriteOptions).yoyo) {
      this._onYoYoComplete = () => {
        this.swapDirection();
      };
    }

    (this._view as AnimatedSprite).onComplete = this.onComplete.bind(this);

    this.applyInitialOptions(this._view as AnimatedSprite);
    this.addToUILayer(this._view, this._parent);

    console.log(
      "[AnimatedSpriteObject] Initialized:",
      this._animKey,
      "width:",
      (this._view as AnimatedSprite).width,
      "height:",
      (this._view as AnimatedSprite).height,
      "alpha:",
      (this._view as AnimatedSprite).alpha,
    );
  }

  public play(): void {
    (this._view as AnimatedSprite).play();
  }

  public stop(): void {
    (this._view as AnimatedSprite).stop();
  }

  public gotoAndPlay(frame: number): void {
    (this._view as AnimatedSprite).gotoAndPlay(frame);
  }

  public gotoAndStop(frame: number): void {
    (this._view as AnimatedSprite).gotoAndStop(frame);
  }

  private swapDirection(): void {
    console.log("[AnimatedSpriteObject] Swapping direction");
    const anSprite = this._view as AnimatedSprite;
    anSprite.animationSpeed = -1 * anSprite.animationSpeed;
    anSprite.play();
  }

  private onComplete(): void {
    console.log("[AnimatedSpriteObject] OnComplete");
    if (this._onYoYoComplete) this._onYoYoComplete();
  }
}

// =====================================================
// Static Atlas Object (static sprite from atlas)
// =====================================================

export class StaticAtlasObject extends GraphicObject {
  private _atlasKey: string;
  private _frameName: string;

  constructor(
    game: Game,
    atlasKey: string,
    frameName: string,
    options: AtlasSpriteOptions,
    parent?: Container,
  ) {
    super(game, options, parent);
    this._atlasKey = atlasKey;
    this._frameName = frameName;
  }

  override initialize(): void {
    const atlas = Assets.get(this._atlasKey);
    const baseTexture = Assets.get(`${this._atlasKey}_tex`) as Texture;

    const frameData = atlas.frames?.[this._frameName];
    let texture: Texture;

    if (frameData) {
      const frame = frameData.frame;
      const rect = new Rectangle(frame.x, frame.y, frame.w, frame.h);
      texture = new Texture({ source: baseTexture.source, frame: rect });
    } else {
      console.warn(
        `Frame ${this._frameName} not found in atlas ${this._atlasKey}, using base texture`,
      );
      texture = baseTexture;
      const canShowFullTex = (this._initialOptions as AtlasSpriteOptions)
        .showMainTexWhenKeyNotFound;

      if (canShowFullTex === undefined || canShowFullTex === false) return;
    }

    this._view = new Sprite(texture);
    this._animator = new ContainerAnimator(this._view);

    if (!this._view) return;

    this.applyInitialOptions(this._view as Sprite);
    this.addToUILayer(this._view, this._parent);
  }
}

// =====================================================
// Text Object
// =====================================================

export class TextObject extends GraphicObject {
  private _textAnimator?: TextAnimator;

  constructor(game: Game, options: TextOptions, parent?: Container) {
    super(game, options, parent);
  }

  get textAnimator(): TextAnimator {
    if (!this._textAnimator) {
      throw new Error("TextAnimator not initialized. Call initialize() first.");
    }
    return this._textAnimator;
  }

  override initialize(): void {
    const options = this._initialOptions as TextOptions;

    this._view = new Text({ text: options.text, style: options.style });
    this._animator = new ContainerAnimator(this._view);

    if (!this._view) return;

    this._textAnimator = new TextAnimator(this._view as Text);

    this.applyInitialOptions(this._view as Text);
    this.addToUILayer(this._view, this._parent);
  }

  protected override applyInitialOptions(obj: GraphicType): void {
    super.applyInitialOptions(obj);

    const options = this._initialOptions as TextOptions;
    (obj as Text).style = { ...options.style };
    (obj as Text).text = options.text;
  }

  setText(text: string): void {
    (this._view as Text).text = text;
  }
}
