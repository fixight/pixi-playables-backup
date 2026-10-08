import { BlurFilter, Container, Graphics } from "pixi.js";
import { Game } from "../../../../plugins/Game/Game";
import { GameConfig } from "../../../../plugins/Game/GameConfig";
import { getLayoutType } from "../../Layouts";
import { ContainerObject } from "../../SpriteObjectTypes";
import { WidgetRoot } from "../../../../plugins/Game/UI";
import { Street } from "../objects/street_bg";

export class RoadGameAdaptive extends ContainerObject {
  private _config: GameConfig;

  private readonly _contentHeight = 612;
  private readonly _contentWidth = 720;

  private _masked: Container | null = null;
  private _maskedGraphics: Graphics | null = null;
  private _mask: Graphics | null = null;
  private _bluredContent: Container | null = null;
  private _mainContent: Container | null = null;
  private _mainContentMask: Graphics | null = null;
  private _streetBlurred: Street | null = null;
  private _streetMain: Street | null = null;

  constructor(game: Game, config: GameConfig, parent?: Container) {
    const initialOptions = {
      align: WidgetRoot.TOP,
      offset: { x: 0, y: 120 },
      anchor: { x: 0.5, y: 0 },
    };
    super(game, initialOptions, parent);
    this._config = config;
  }

  override initialize(): void {
    super.initialize();

    if (!this._view) return;

    // TODO
    // - на контейнере this._view создать контейнер masked с привязкой TOP, заливка #6e6966, alpha 1,
    // высота _contentHeight. Адаптивность - тянется по ширине, высота фикс.

    // - на контейнере this._view создать маску с привязкой TOP, маска маскирует объект masked, адаптивность
    // и высота такая же как и у masked

    // - на контейнере this._view создать контейнер bluredContent с привязкой TOP, , адаптивность и высота
    // такая же как и у masked, на слой bluredContent накладываем blur

    // - на контейнере this._view создать контейнер mainContent с привязкой TOP, фикс размеры высота
    // _contentHeight * _contentWidth, anchor в левом верхнем углу (0, 0), на слой mainContent накладываем
    // размытую картинку bluredContent.
    // пока без анимации, но планируем, что будем анимировать mainContent (при статично расположенной маске)

    // - на контейнере this._view создать контейнер mainContentMask с привязкой TOP, фикс размеры высота
    // _contentHeight * _contentWidth,
    // маска маскирует объект mainContent

    // - на контейнере bluredContent создаем объект Street, scale 4, alpha .5 (статичный разблюренный фон, пока не анимируем)
    // - на mainContent создаем объект Street, scale 1, alpha 1

    // ======================================
    // masked - container with fill color #6e6966, alpha 1, height _contentHeight
    // Adaptive - stretches in width, fixed height
    // ======================================
    this._masked = new Container();
    this._maskedGraphics = new Graphics();
    this._maskedGraphics.rect(
      -0.5 * this._contentWidth,
      0,
      this._contentWidth,
      this._contentHeight,
    );
    this._maskedGraphics.fill({ color: 0x6e6966, alpha: 1 });
    this._masked.addChild(this._maskedGraphics);
    this._view.addChild(this._masked);

    // ======================================
    // mask - masks the masked container
    // ======================================
    this._mask = new Graphics();
    this._mask.rect(0, 0, this._contentWidth, this._contentHeight);
    this._mask.fill({ color: 0xffffff, alpha: 1 });
    this._masked.mask = this._mask;
    this._view.addChild(this._mask);

    // ======================================
    // bluredContent - container with blur filter
    // ======================================
    this._bluredContent = new Container();
    const blurFilter = new BlurFilter();
    blurFilter.strength = 8;
    blurFilter.padding = 16;
    this._bluredContent.filters = [blurFilter];
    this._bluredContent.addChild(this._bluredContentGraphics ?? new Graphics());
    this._view.addChild(this._bluredContent);

    // ======================================
    // Street on bluredContent
    // ======================================
    this._streetBlurred = new Street(
      this._game,
      this._config,
      this._bluredContent,
    );
    this._streetBlurred.applyScale(4);
    this._streetBlurred.applyAlpha(0.5);
    this._streetBlurred.initialize();

    // ======================================
    // mainContent - container with anchor (0, 0), fixed size
    // ======================================
    this._mainContent = new Container();
    this._mainContent.width = this._contentWidth;
    this._mainContent.height = this._contentHeight;
    this._view.addChild(this._mainContent);

    // ======================================
    // mainContentMask - masks mainContent
    // ======================================
    this._mainContentMask = new Graphics();
    this._mainContentMask.rect(0, 0, this._contentWidth, this._contentHeight);
    this._mainContentMask.fill({ color: 0xffffff, alpha: 1 });
    this._mainContent.mask = this._mainContentMask;
    this._view.addChild(this._mainContentMask);

    // ======================================
    // Street on mainContent - scale 1, alpha 1
    // ======================================
    this._streetMain = new Street(this._game, this._config, this._mainContent);
    this._streetMain.applyScale(1);
    this._streetMain.applyAlpha(1);
    this._streetMain.initialize();

    this._updatePositions();
  }

  private _updatePositions(): void {
    if (!this._view) return;

    // Position containers at top of the screen
    // The alignment is handled by WidgetRoot.TOP in the constructor
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onResize(w: number, h: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layout = getLayoutType(this._game);

    // Update masked container width (adaptive)
    if (this._maskedGraphics) {
      this._maskedGraphics.clear();
      this._maskedGraphics.rect(-w / 2, 0, w, this._contentHeight);
      this._maskedGraphics.fill({ color: 0x6e6966, alpha: 1 });
    }

    // Update mask
    if (this._mask) {
      this._mask.clear();
      this._mask.rect(-w / 2, 0, w, this._contentHeight);
      this._mask.fill({ color: 0xffffff, alpha: 1 });
    }

    // Update bluredContent dimensions
    if (this._bluredContent) {
      this._bluredContent.position.set(w / 2, 0);
    }
  }

  // Custom animation method
  runAnimation(): void {
    if (!this.animator) return;
  }
}
