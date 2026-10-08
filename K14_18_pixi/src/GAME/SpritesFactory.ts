import {
  AnimatedSprite,
  Assets,
  BlurFilter,
  ColorMatrixFilter,
  Container,
  Rectangle,
  Sprite,
  Texture,
  Ticker,
} from "pixi.js";
import { Game } from "../../plugins/Game/Game.ts";
import { WidgetRoot } from "../../plugins/Game/UI.ts";

type ContainerAlign =
  | "center"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

export function spawnContainerElement({
  game,
  animKey,
  align,
  desaturate = false,
}: {
  game: Game;
  animKey: string;
  align: ContainerAlign;
  desaturate?: boolean;
}) {
  const sheet = Assets.get(animKey) as { animations: Record<string, string[]> };
  const animationName = Object.keys(sheet.animations)[0];

  const puck = AnimatedSprite.fromFrames(sheet.animations[animationName]);
  puck.anchor.set(0.5);
  puck.animationSpeed = 0.5;
  puck.play();
  puck.scale.set(1);

  if (desaturate) {
    const colorMatrix = new ColorMatrixFilter();
    colorMatrix.desaturate();
    puck.filters = [colorMatrix];
  }

  game.container.addChild(puck);

  game.resizer.addResizeAction(puck.uid, () => {
    switch (align) {
      case "topLeft":
        puck.position.set(-game.visibleHalfWidth, -game.visibleHalfHeight);
        break;
      case "topRight":
        puck.position.set(game.visibleHalfWidth, -game.visibleHalfHeight);
        break;
      case "bottomLeft":
        puck.position.set(-game.visibleHalfWidth, game.visibleHalfHeight);
        break;
      case "bottomRight":
        puck.position.set(game.visibleHalfWidth, game.visibleHalfHeight);
        break;
      case "center":
      default:
        puck.position.set(0, 0);
        break;
    }
  });
}

export function spawnUIAnimElement({
  game,
  parent,
  animKey,
  animationSpeed = 0.5,
  loop = true,
  align,
  offset,
  blur = 0,
  scale = { x: 1, y: 1 },
  alpha = 1,
  rotation = 0,
  onTick,
  onResize,
}: {
  game: Game;
  parent?: Container;
  animKey: string;
  animationSpeed?: number;
  loop?: boolean;
  align: WidgetRoot;
  offset?: { x: number; y: number };
  blur?: number;
  scale?: number | { x: number; y: number };
  alpha?: number;
  rotation?: number;
  onTick?: (ticker: Ticker) => void;
  onResize?: (this: AnimatedSprite, w: number, h: number) => void;
}): AnimatedSprite {
  const sheet = Assets.get(animKey) as { animations: Record<string, string[]> };
  const animationName = Object.keys(sheet.animations)[0];

  const anSprite = AnimatedSprite.fromFrames(sheet.animations[animationName]);
  anSprite.anchor.set(0.5);
  anSprite.alpha = alpha;
  anSprite.animationSpeed = animationSpeed;
  anSprite.loop = loop;
  anSprite.play();
  anSprite.rotation = (rotation * Math.PI) / 180;

  if (typeof scale === "number") {
    anSprite.scale.set(scale);
  } else {
    anSprite.scale.set(scale.x, scale.y);
  }

  if (blur > 0) {
    const blurFilter = new BlurFilter({ strength: blur });
    blurFilter.padding = blur * 16;
    anSprite.filters = [blurFilter];
  }

  /* if (onTick !== undefined) {
    game.app.ticker.add(onTick);
  } */

  if (onTick) {
    game.app.ticker.add(function (this: AnimatedSprite) {
      onTick.call(this, game.app.ticker);
    }, anSprite);
  }

  addToUILayer({
    game,
    parent,
    ins: anSprite,
    align,
    offset,
    onResize,
  });

  /* if (onResize) {
    game.resizer.addResizeAction(
      anSprite.uid,
      function (this: AnimatedSprite, w: number, h: number) {
        onResize.call(this, w, h);
      },
    );
  } */

  return anSprite;
}

export function spawnUIAtlasElement({
  game,
  parent,
  atlasKey,
  frameName,
  align,
  offset,
  blur = 0,
  rotation = 0,
  scale = 1,
  alpha = 1,
  anchor = { x: 0.5, y: 0.5 },
  onTick,
  onResize,
}: {
  game: Game;
  parent?: Container;
  atlasKey: string;
  frameName: string;
  align: WidgetRoot;
  offset?: { x: number; y: number };
  blur?: number;
  rotation?: number;
  scale?: number | { x: number; y: number };
  alpha?: number;
  anchor?: number | { x: number; y: number };
  onTick?: (ticker: Ticker) => void;
  onResize?: (this: Sprite, w: number, h: number) => void;
}): Sprite {
  const atlas = Assets.get(atlasKey);
  const baseTexture = Assets.get(`${atlasKey}_tex`);

  // Get specific frame from atlas
  const frameData = atlas.frames?.[frameName];
  let texture;

  console.log({ atlasKey, frameName, baseTexture, frameData, atlas });

  if (frameData) {
    const frame = frameData.frame;
    const rect = new Rectangle(frame.x, frame.y, frame.w, frame.h);
    texture = new Texture({ source: baseTexture.source, frame: rect });
  } else {
    console.warn(
      `Frame ${frameName} not found in atlas ${atlasKey}, using base texture`,
    );
    texture = baseTexture;
  }

  const sprite = new Sprite(texture);
  sprite.alpha = alpha;
  sprite.rotation = (rotation * Math.PI) / 180;

  if (typeof scale === "number") {
    sprite.scale.set(scale);
  } else {
    sprite.scale.set(scale.x, scale.y);
  }

  if (typeof anchor === "number") {
    sprite.anchor.set(anchor);
  } else {
    sprite.anchor.set(anchor.x, anchor.y);
  }

  if (blur > 0) {
    const blurFilter = new BlurFilter({ strength: blur });
    blurFilter.padding = blur * 2;
    sprite.filters = [blurFilter];
  }

  if (onTick) {
    game.app.ticker.add(function (this: Sprite) {
      onTick.call(this, game.app.ticker);
    }, sprite);
  }

  addToUILayer({
    game,
    parent,
    ins: sprite,
    align,
    offset,
    onResize,
  });

  return sprite;
}

export function spawnUISpriteElement({
  game,
  parent,
  textureKey,
  align,
  offset,
  blur = 0,
  rotation = 0,
  scale = 1,
  alpha = 1,
  anchor = { x: 0.5, y: 0.5 },
  onTick,
  onResize,
}: {
  game: Game;
  parent?: Container;
  textureKey: string;
  align: WidgetRoot;
  offset?: { x: number; y: number };
  blur?: number;
  rotation?: number;
  scale?: number | { x: number; y: number };
  alpha?: number;
  anchor?: number | { x: number; y: number };
  onTick?: (ticker: Ticker) => void;
  onResize?: (this: Sprite, w: number, h: number) => void;
}): Sprite {
  const sprite = new Sprite(Assets.get(textureKey));
  sprite.alpha = alpha;
  sprite.rotation = (rotation * Math.PI) / 180;

  if (typeof scale === "number") {
    sprite.scale.set(scale);
  } else {
    sprite.scale.set(scale.x, scale.y);
  }

  if (typeof anchor === "number") {
    sprite.anchor.set(anchor);
  } else {
    sprite.anchor.set(anchor.x, anchor.y);
  }

  if (blur > 0) {
    const blurFilter = new BlurFilter({ strength: blur });
    blurFilter.padding = blur * 2;
    sprite.filters = [blurFilter];
  }

  /* if (onTick !== undefined) {
    game.app.ticker.add(onTick);
  } */

  if (onTick) {
    game.app.ticker.add(function (this: Sprite) {
      onTick.call(this, game.app.ticker);
    }, sprite);
  }

  addToUILayer({
    game,
    parent,
    ins: sprite,
    align,
    offset,
    onResize,
  });

  /* if (onResize) {
    game.resizer.addResizeAction(
      sprite.uid,
      function (this: Sprite, w: number, h: number) {
        onResize.call(this, w, h);
      },
    );
  } */

  return sprite;
}

function addToUILayer<T extends Container>({
  game,
  parent,
  ins,
  align,
  offset = { x: 0, y: 0 },
  onResize,
}: {
  game: Game;
  parent?: Container;
  ins: T;
  align: WidgetRoot;
  offset?: { x: number; y: number };
  onResize?: (this: T, w: number, h: number) => void;
}) {
  if (!parent) {
    game.ui.add(
      ins,
      align,
      offset,
      onResize
        ? (instance, w, h) => onResize.call(instance as T, w, h)
        : () => {},
      true,
    );
    return;
  }

  parent.addChild(ins);

  game.resizer.addResizeAction(ins.uid, (w, h) => {
    console.log("FUNC resize:", w, h, align);
    onResize?.call(ins, w, h);

    const uiScaleX = game.ui.container.scale.x || 1;
    const uiScaleY = game.ui.container.scale.y || 1;

    const halfW = w / uiScaleX / 2;
    const halfH = h / uiScaleY / 2;

    switch (align) {
      case WidgetRoot.TOP:
        ins.position.set(0, -halfH);
        break;
      case WidgetRoot.BOTTOM:
        ins.position.set(0, halfH);
        break;
      case WidgetRoot.LEFT:
        ins.position.set(-halfW, 0);
        break;
      case WidgetRoot.RIGHT:
        ins.position.set(halfW, 0);
        break;
      case WidgetRoot.TOP_LEFT:
        ins.position.set(-halfW, -halfH);
        break;
      case WidgetRoot.TOP_RIGHT:
        ins.position.set(halfW, -halfH);
        break;
      case WidgetRoot.BOTTOM_LEFT:
        ins.position.set(-halfW, halfH);
        break;
      case WidgetRoot.BOTTOM_RIGHT:
        ins.position.set(halfW, halfH);
        break;
      case WidgetRoot.CENTER:
      default:
        ins.position.set(0, 0);
        break;
    }

    ins.x += offset.x;
    ins.y += offset.y;
  });
}
