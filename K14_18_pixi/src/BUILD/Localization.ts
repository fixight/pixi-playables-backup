/* export enum LocalKey {
  // "YOUR_KEY" = "YOUR_KEY_AGAIN",
} */

import {
  LocalKey,
  LOCALIZATION_DATA,
} from "../../plugins/Assets/_DATA_BASE/LocalizationGenerated";
import { getLanguage } from "../GAME/cta/cta";

export function GetLocal(phraseKey: LocalKey): string {
  //return LOCALIZATION[key][LANGUAGE];
  //return LOCALIZATION[LANGUAGE][key];

  const lang: string = getLanguage() || "EN";

  //const value = LOCALIZATION_DATA["EN"][phraseKey];
  const value = LOCALIZATION_DATA[lang][phraseKey];
  if (value === undefined) {
    console.warn(`Localization missing for key: ${phraseKey}`);
    return "";
  }
  return value;
}
