import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  runBuild,
  options,
  mergeOptions,
  makeWebpackBuildConfig,
} from "@smoud/playable-scripts";
import { fillTemplate } from "../Utils/utils.ts";

const buildJson = readFileSync("build.json", "utf-8")
  .replace(/\/\/.*$/gm, "") // Удалить "//" комментарии
  .replace(/\/\*[\s\S]*?\*\//g, ""); // Удалить "/* */" комментарии
const build_config = JSON.parse(buildJson);

const NETWORKS: string[] =
  build_config.NETWORKS.length > 0
    ? build_config.NETWORKS
    : [build_config.network];

const LANGUAGES: string[] =
  build_config.LOCALIZATION && Object.keys(build_config.LOCALIZATION).length > 0
    ? Object.keys(build_config.LOCALIZATION)
    : [build_config.language];

(async () => {
  await Promise.all(
    NETWORKS.map((network: string) =>
      Promise.all(
        LANGUAGES.map((language: string) =>
          build({
            network: network,
            language: language,
          }),
        ),
      ),
    ),
  );
  console.log("| -> ALL BUILDS ARE DONE !");
})();

async function build(data: { network: string; language: string }) {
  const bOptions = mergeOptions(options, build_config);
  const buildOptions = mergeOptions(bOptions, {
    outDir: `${bOptions.outDir}/${data.network.toUpperCase()}`,
    // @ts-expect-error API
    network: data.network,
    protocol: bOptions.protocol,
    // @ts-expect-error API
    language: data.language,
    defines: {
      __DEV__: JSON.stringify(false),
      GOOGLE_PLAY_URL: JSON.stringify("__GOOGLE__"),
      APP_STORE_URL: JSON.stringify("__APP_STORE__"),
      AD_NETWORK: JSON.stringify(data.network),
      AD_PROTOCOL: JSON.stringify(bOptions.protocol),
      LANGUAGE: JSON.stringify(data.language),
    },

    adNetworkNames: {
      preview: "preview",
      applovin: "applovin",
      unity: "unity",
      google: "google",
      ironsource: "ironsource",
      facebook: "facebook",
      moloco: "moloco",
      adcolony: "adcolony",
      mintegral: "mintegral",
      vungle: "vungle",
      tapjoy: "tapjoy",
      snapchat: "snapchat",
      tiktok: "tiktok",
      appreciate: "appreciate",
      chartboost: "chartboost",
      pangle: "pangle",
      mytarget: "mytarget",
      liftoff: "liftoff",
      smadex: "smadex",
      adikteev: "adikteev",
      bigabid: "bigabid",
      inmobi: "inmobi",
      bigo: "bigo",
    },
  });

  await runBuild(makeWebpackBuildConfig(buildOptions));

  // =====================================================================================

  try {
    const fileName = fillTemplate(buildOptions.filename, buildOptions);
    let filePath: string;
    let file: string;
    try {
      filePath = join(buildOptions.outDir, `${fileName}.html`);
      file = readFileSync(filePath, "utf-8");
    } catch (e: any) {
      filePath = join(buildOptions.outDir, data.network, `index.html`);
      file = readFileSync(filePath, "utf-8");
    }

    writeFileSync(
      filePath,
      file
        .replace('"__GOOGLE__"', "window.GOOGLE_PLAY_URL")
        .replace('"__APP_STORE__"', "window.APP_STORE_URL")
        .replace(
          "<head>",
          `<head>
<script>

    window.GOOGLE_PLAY_URL = "";
    window.APP_STORE_URL = "";
    window.LANGUAGE = "${buildOptions.language.toUpperCase()}";

</script>
`,
        ),
    );
  } catch (e: any) {
    console.error(e.message);
  }
}
