import {promisify} from 'util';
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

import {ASSETS_COMPRESSED_DIR, ASSETS_DIR, getContent, getGroup, toBase64} from "./assets_utils.ts";

const gzip = promisify(zlib.gzip);


const DATA_PATH = path.join(import.meta.dirname, '_DATA_BASE');


(async () => {
    const targetDir = setupFolders();
    const data = getData(targetDir);

    const compressedDataStr = await writeDataFile(data);

    writeKeysFile(data);

    logResult(JSON.stringify(data), compressedDataStr);
})();


function getData(dir: string, result: any = {}) {
    try {
        const items: string[] = fs.readdirSync(dir);

        for (const item of items) {
            const filePath = path.join(dir, item);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                result = getData(filePath, result);
                continue;
            }

            const groupName = getGroup(filePath);
            const group = result[groupName] ?? (result[groupName] = {});
            const name = path.basename(item).split('.')[0];

            if (groupName == 'data') {
                group[name] = JSON.parse(getContent(filePath));
            } else {
                group[name] = toBase64(filePath);
            }

            console.log(`> ${path.basename(item)}`);
        }
    } catch (error: any) {
        console.error(`Ошибка обработки ${dir}:`, error.message);
    }

    return result;
}


function setupFolders(): string {
    const targetDir: string = fs.existsSync(ASSETS_COMPRESSED_DIR) ? ASSETS_COMPRESSED_DIR : ASSETS_DIR;

    if (!fs.existsSync(targetDir))
        throw new Error(`Папка "${targetDir}" не найдена!`);

    fs.mkdirSync(DATA_PATH, {recursive: true});

    return targetDir;
}

async function writeDataFile(data: string) {
    const dataStr = JSON.stringify(data);
    const compressedDataStr = (await gzip(dataStr)).toString('base64');

    fs.writeFileSync(
        path.join(DATA_PATH, 'AssetsDB_COMPRESSED.ts'),
        `export const COMPRESSED_ASSETS = "${compressedDataStr}";`
    );

    return compressedDataStr;
}

function generateKeymap(data: any) {
    const map: any = {};

    for (const [key, value] of Object.entries(data)) {
        map[key] = {};

        for (const v in value as object)
            map[key][v] = v;
    }

    return map;
}

function writeKeysFile(data: any) {
    fs.writeFileSync(
        path.join(DATA_PATH, 'AssetsDB.ts'),
        `export const AssetsDB = ${JSON.stringify(generateKeymap(data), null, 2)};`
    );
}


function logResult(dataStr: string, compressedDataStr: string) {
    const originalSize = Buffer.byteLength(dataStr);
    const compressedSize = Buffer.byteLength(compressedDataStr);
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    console.log(`
| Done!
| Size: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${ratio}%)
`);
}


