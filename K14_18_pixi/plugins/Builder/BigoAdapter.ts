import { sdk } from "@smoud/playable-sdk";

export async function InstallBigo() {
  // @ts-expect-error API
  if (AD_NETWORK !== "bigo") return;

  try {
    await loadBigoSDK();

    console.log("Bigo Loaded...");

    sdk.on("start", () => window.BGY_MRAID.gameReady());
    sdk.on("finish", () => window.BGY_MRAID.gameEnd());
    sdk.on("install", () => window.BGY_MRAID.open());
    return;
  } catch (error) {
    console.error("Bigo SDK не загружен");
    return;
  }
}

function loadBigoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).bigo !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://static-web.likeevideo.com/as/common-static/big-data/dsp-public/bgy-mraid-sdk.js";
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Bigo SDK"));

    document.head.appendChild(script);
  });
}

// =======================================================================

declare global {
  interface Window {
    BGY_MRAID: {
      /**
       * SDK версия
       */
      version: string;

      /**
       * Инициализация MRAID SDK
       */
      init(): void;

      /**
       * Запись логов
       * @param content - содержимое лога
       * @param logType - тип лога (по умолчанию 1)
       */
      log(content: string, logType?: number): void;

      /**
       * Отправка трекерных событий
       * @param params - параметры события
       */
      track(params: {
        act_id?: number;
        log_action: string | number;
        log_event: string;
        log_content: string;
        isCN?: boolean;
      }): Promise<void>;

      /**
       * Отчет по всем логам
       */
      reportAll(): Promise<
        Record<
          string,
          {
            msg: string;
            desc?: string;
          }
        >
      >;

      /**
       * Открытие рекламы (вызывается при клике на CTA)
       */
      open(): void;

      /**
       * Открытие через MRAID API
       */
      mraidOpen(): void;

      /**
       * Открытие через H5 (если MRAID недоступен)
       */
      h5Open(): void;

      /**
       * Добавление endcard слоя
       */
      addEndcard(): void;

      /**
       * Отображение endcard (прозрачного кликабельного слоя)
       */
      showEndcard(): void;

      /**
       * Уведомление о готовности игры
       */
      gameReady(): void;

      /**
       * Завершение игры и показ endcard
       */
      gameEnd(): void;

      /**
       * Уже отображен endcard
       */
      alreadyShowEndcard: boolean;

      /**
       * Время начала клика на CTA
       */
      ctaStart?: number;
    };

    /**
     * Конфигурация MRAID рекламы
     */
    ADS_MRAID_CONFIG?: {
      playable_track?: string;
      deeplink?: string;
      landUrl?: string;
      dspTrackerClicks?: string | string[];
      orientation?: number;
    };

    /**
     * Пользовательская конфигурация MRAID
     */
    CUS_MRAID_CONFIG?: {
      orientation?: number;
    };

    /**
     * Playable API для взаимодействия с нативным приложением
     */
    BGN_PLAYABLE?: {
      gameEnd(data: string): void;
    };

    /**
     * Флаг, указывающий что открытие было через MRAID
     */
    isOpenByMraid?: boolean;
  }
}
