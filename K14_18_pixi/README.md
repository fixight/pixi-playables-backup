# Pixi Engine

# Index

- [Installation](#Installation);
- [Scripting](#Scripting);
- [Assets](#Assets);
- [Build project](#Build-project);
- [Built-in Utils](#Built-in-Utils);
  - [Utils](#Utils);
  - [Animations](#Animations);
  - [CreateVFX](#CreateVFX);
  - [UIEvents](#UIEvents);
  - [GameUIUtils](#GameUIUtils);
- [Built-in Components](#Built-in-Components);
  - [AnimatedText](#AnimatedText);
  - [Cover](#Cover);
  - [ScreenContainer](#ScreenContainer);
  - [Tutorial](#Tutorial);

---

# Installation

You can fork this repo or download as Archive

# Scripting

(It's not required, but it's good for consistency)

- Store your game scripts inside "[GAME](src/GAME)" folder
- Store your "Components" inside "[Components](src/Components)" folder (Components - independent and reusable pieces. Think about each piece in isolation. Example: Button, Packshot, Bonus-Screen, etc)
- Write your game inside "[main.ts](src/GAME/main.ts)" into "Main" function

# Assets

### 1. Generate

```npm
node run generate_assets
```

#### OR

```npm
node run ga
```

### 2. Load

```typescript
// LOAD ALL
await AssetsBase64.loadAll();

// LOAD SINGLE ASSET
await AssetsBase64.load(AssetsDB.texture.background, "texture");
```

### 3. Use

```typescript
// GET TEXTURE
Assets.get(AssetsDB.texture.YOUR_TEXTURE_NAME);
```

---

## Build project

### 1. Setup "[build.json](build.json)"

```json5
{
  "app": "pixi_empty", // <-- YOUR NAME
  "network": "ironsource", // <-- TEST PLATFOMR / DEFAULT BUILD PLATFORM
  "language": "EN", // <-- TEST LANGUAGE / DEFAULT BUILD LANGUAGE
  "filename": "{app}_{network}_{language}", // <-- BUILD FILES NAME FORMAT
  "zip": true, // <-- SET "TRUE" IF REQUIRED TO BUILD IN ZIP

  "NETWORKS": [ // LEAVE EMPTY FOR BASIC BUILD
    ...
    "ironsource",
    ...
  ],
  "LOCALIZATION": { // LEAVE EMPTY FOR BASIC BUILD
    ...
    "EN": {
      "localization_key": "localization_string"
    },
    ...
  }
}
```

### Example

```json5
"LOCALIZATION": {
    // LEAVE EMPTY FOR BASIC BUILD
    // "EN": {  },
    // "RS": {  },
    // "HR": {  },
    // "GR": {  },
    // "ES": {  },
    // "IT": {  },
    // "NL": {  },
    // "PT": {  },
    // "PL": {  },
    // "DE": {  },
    // "CZ": {  },
    // "RO": {  },
    // "HU": {  },
    // "MY": {  },
    // "FR": {  },
    // "FI": {  },
    // "TR": {  },
    // "NO": {  },
    // "SK": {  },
    // "SL": {  },
  }
```

### 2. Run "build"

```npm
node run build
```

#### OR

```npm
node run b
```

### 3. Add links

- Open build with any text editor and enter

```typescript
<!doctype html><html lang="en"><head>
<script>

    window.GOOGLE_PLAY_URL = "";
    window.APP_STORE_URL = "";

</script>
```

---

# Built-in Utils

### Utils

> [Utils.ts](plugins/Utils/Utils.ts)

- random
- randomInt
- randomFrom (get random array element)
- lerp - default lerp func
- clamp
- isNumber
- isString
- debounceFunc (returns a wrapped function that prevents multiple calls)

### Animations

> [Animations.ts](plugins/Utils/Animations.ts) - Collection of animation and packing (see on: [Animations.ts](plugins/Utils/Animations.ts))

```typescript
import { OnClick } from "./UIUtils";

const btn = game.ui.add(YOUR_PLAY_BTN);
OnClick(btn, Play(AnimPulseIn(btn), 0.5 /* InScale */, 0.5 /* Duration */));
```

### CreateVFX

> [CreateVFX.ts](plugins/Utils/CreateVFX.ts) - Util-function to auto-create VFX from imported .json and texture
> (From [TexturePacker GUI](https://www.codeandweb.com/texturepacker))

```typescript
YOUR_CONTAINER.addChild(
  CreateVFX(
    // import CreateVFX
    AssetsDB.anim.vfx_coins, // VFX key
    false, // Does VFX require to loop
    // optional "speedMod" (default = 1)
  ),
);
```

### UIEvents

> [UIEvents.ts](plugins/Utils/UIEvents.ts) - Collection of default Click / Hover / Unhover events

```typescript
OnClick(btn, () => {
  /* CLICK ACTION */
}); // ADD
OffClick(btn, () => {
  /* CLICK ACTION */
}); // REMOVE

OnHover(btn, () => {
  /* HOVER ACTION */
}); // ADD
OffHover(btn, () => {
  /* HOVER ACTION */
}); // REMOVE

OnUnhover(btn, () => {
  /* UNHOVER ACTION */
}); // ADD
OffUnhover(btn, () => {
  /* UNHOVER ACTION */
}); // REMOVE
```

### GameUIUtils

> [GameUIUtils.ts](plugins/Game/GameUIUtils.ts) - Collection of generic elements, witch require internal properties

```typescript
// FOR IRON-SOURCE
AddAutoIllustrativeText();

// ADDS FULL-SCREEN IMAGE
AddBackground(BACKGROUND_ASSET_KEY);

// ADDS FULL-SCREEN BLACK HALD-TRANSPARENT GRAPHICS
AddCover(); // see "Cover" section in README

// AUTO-STYLE TEXT FONT FAMILY
StyleText(GENERIC_TEXT);
```

---

# Built-in Components

### AnimatedText

> [AnimatedText.ts](plugins/Utils/Components/AnimatedText.ts) - Component for animating "Balance" text

```typescript
const newText = new AnimatedText(
  { TEXT_PARAMS },
  initValue, // <-- Value to set on start
  animDuration, // <-- Duration of change animation
  prefix,
  postfix, // <-- PREFIX - VALUE - POSTFIX
  roundTo, // <-- Round digits (0 - "5", 2 - "5.55")
);

newText.setValue(
  value, // <-- Current Text value
  targetValue, // <-- New Text value
);
```

### Cover

> [Cover.ts](plugins/Utils/Components/Cover.ts) - Component for full-screen UI-cover with Animations

```typescript
const cover = AddCover(
  // ! import GameUIUtils
  alpha, // <-- TargetAlpha (default = 0.5)
  animDuration, // <-- Show/Hide duration (default = 0.5)
);
// OR MANUAL
// const cover = YOUR_CONTAINER.addChild(new Cover(
//     game.resizer, // Or "Game.I.resizer"
//     alpha, // <-- TargetAlpha (default = 0.5)
//     animDuration // <-- Show/Hide duration (default = 0.5)
// ));

cover.show();
// OR
cover.show(() => {
  /* OPTIONAL FUNC */
});
// OR
await cover.show();

cover.hide();
// OR
cover.hide(() => {
  /* OPTIONAL FUNC */
});
// OR
await cover.hide();
```

### ScreenContainer

> [ScreenContainer.ts](plugins/Utils/Components/ScreenContainer.ts) - Component for "Screens", popup-like UI-elements, with Animations

```typescript
const screen = YOUR_CONTAINER.addChild(
  new ScreenContainer(
    animDuration, // <-- Show/Hide duration (default = 0.5)
    targetScale, // <-- Scale of container after show (default = 1)
  ),
);

screen.show();
// OR
screen.show(() => {
  /* OPTIONAL FUNC */
});
// OR
await screen.show();

screen.hide();
// OR
screen.hide(() => {
  /* OPTIONAL FUNC */
});
// OR
await screen.hide();
```

### Tutorial

> [Tutorial.ts](plugins/Utils/Components/Tutorial.ts) - Tutorial-hand Component with "Please click", show and hide animations

```typescript
const tutorial = YOUR_CONTAINER.addChild(
  new Tutorial(
    tutorialKey, // <-- Texture key (default = "tutorial")
    amplitude, // <-- Distance of "Please click" animation (default = 25)
    duration, // <-- Duration of ALL animtions (default = 0.5)
  ),
);

tutorial.show();
// OR
tutorial.show(() => {
  /* OPTIONAL FUNC */
});
// OR
await tutorial.show();

tutorial.hide();
// OR
tutorial.hide(() => {
  /* OPTIONAL FUNC */
});
// OR
await tutorial.hide();
```
