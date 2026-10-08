import { Game } from "../../../plugins/Game/Game.ts";

export function startWithMraidOrDirect(
  game: Game,
  runApp: (game: Game) => void,
): void {
  const mraid = (
    window as unknown as {
      mraid?: {
        getState(): string;
        addEventListener(e: string, h: () => void): void;
      };
    }
  ).mraid;

  if (mraid) {
    if (mraid.getState() === "loading") {
      mraid.addEventListener("ready", () => runApp(game));
    } else {
      runApp(game);
    }
  } else {
    runApp(game);
  }
}

export function getLanguage(): string | null {
  const playableWindow = window as Window & {
    LANGUAGE?: string;
  };

  console.log("LANG:", playableWindow.LANGUAGE);
  if (!playableWindow.LANGUAGE) {
    console.warn("Language is not defined");
    return null;
  }

  const lang = (playableWindow.LANGUAGE ?? "").trim();
  return lang;
}

export function getCTALink(): string | null {
  const playableWindow = window as Window & {
    GOOGLE_PLAY_URL?: string;
    APP_STORE_URL?: string;
  };

  const gp = (playableWindow.GOOGLE_PLAY_URL ?? "").trim();
  const as = (playableWindow.APP_STORE_URL ?? "").trim();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS && as) return as;
  if (!isIOS && gp) return gp;
  return as || gp || "";
}

export function getCTALink2(): string {
  const cfg =
    typeof window !== "undefined"
      ? (
          window as Window & {
            BUILD_CONFIG?: { googlePlayUrl?: string; appStoreUrl?: string };
          }
        ).BUILD_CONFIG
      : undefined;

  if (!cfg) return "";

  const gp = (cfg.googlePlayUrl ?? "").trim();
  const as = (cfg.appStoreUrl ?? "").trim();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS && as) return as;
  if (!isIOS && gp) return gp;
  return as || gp;
}

export function isUrlValid(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function triggerCtaClick(): void {
  const link = getCTALink();
  const win = window as Window & {
    mraid?: { open?: (url: string) => void };
    FbPlayableAd?: { onCTAClick(): void };
  };

  if (win.mraid?.open && link && isUrlValid(link)) {
    try {
      win.mraid.open(link);
      return;
    } catch (e) {
      console.error("mraid.open failed:", e);
    }
  }

  if (
    typeof AD_NETWORK !== "undefined" &&
    AD_NETWORK === "facebook" &&
    typeof FbPlayableAd !== "undefined" &&
    FbPlayableAd?.onCTAClick
  ) {
    FbPlayableAd.onCTAClick();
    return;
  }

  if (
    typeof AD_NETWORK !== "undefined" &&
    AD_NETWORK === "facebook" &&
    typeof ScPlayableAd !== "undefined" &&
    ScPlayableAd?.onCTAClick
  ) {
    ScPlayableAd.onCTAClick();
    return;
  }

  if (link && isUrlValid(link)) {
    try {
      window.open(link, "_blank");
    } catch (e) {
      console.error("window.open failed:", e);
    }
  }
}
