import {
    ASSETS_COMPRESSED_DIR,
    ASSETS_DIR,
    AUDIO_EXT,
    DATA_EXT,
    FONT_EXT,
    getExtension,
    IMAGE_EXT, VIDEO_EXT
} from "./assets_utils.ts";

import * as fs from "node:fs";
import * as path from "node:path";
import {spawn} from "child_process";
import sharp from "sharp";
import ffmpeg from 'ffmpeg-static';


const quality = Math.min(100, Math.max(1, parseInt(process.argv[2], 10) || 80));
const audioBitrate = Math.min(320, Math.max(32, parseInt(process.argv[3], 10) || 128));


(async () => {
    if (!fs.existsSync(ASSETS_DIR))
        throw new Error(`Папка "${ASSETS_DIR}" не найдена!`);

    const imageFiles = findImages(ASSETS_DIR);
    const audioFiles = findAudio(ASSETS_DIR);
    const otherFiles = findOther(ASSETS_DIR);

    if (imageFiles.length === 0
        && audioFiles.length === 0)
        console.error("Compressible files not found!")

    const allDirs = new Set([
        ...imageFiles.map(f => f.relativeDir),
        ...audioFiles.map(f => f.relativeDir),
        ...otherFiles.map(f => f.relativeDir),
    ].filter(d => d !== '.'));


    if (fs.existsSync(ASSETS_COMPRESSED_DIR))
        fs.rmSync(ASSETS_COMPRESSED_DIR, { recursive: true });

    fs.mkdirSync(
        ASSETS_COMPRESSED_DIR,
        { recursive: true }
    );

    allDirs.forEach(d => {
        fs.mkdirSync(
            path.join(ASSETS_COMPRESSED_DIR, d),
            { recursive: true }
        );
    });


    try {
        await Promise.all([
            compressImages(imageFiles),
            compressAudio(audioFiles),
            compressOther(otherFiles)
        ]);
    } catch (e: any) {
        console.log(e.message);
    }

    console.log('');
    console.log('DONE!');
    console.log(`LOOK AT: ${ASSETS_COMPRESSED_DIR}`);
})();



function findFiles(dir: string, baseDir: string, extensions: string[]): any[] {
    const results: any[] = [];

    try {
        const items: string[] = fs.readdirSync(dir);

        for (const item of items) {
            const filePath = path.join(dir, item);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                results.push(...findFiles(filePath, baseDir, extensions));
                continue;
            }

            if (extensions.includes(getExtension(filePath))) {
                const rel = path.relative(baseDir, filePath);
                results.push({
                    name: path.basename(filePath, path.extname(filePath)),
                    nameWithExt: item,
                    path: filePath,
                    relativePath: rel,
                    relativeDir: path.dirname(rel),
                    size: stat.size
                });
            }
        }
    } catch (e: any) {
        console.log(`Ошибка: ${e.message}`);
    }

    return results;
}

function findImages(dir: string) {
    return findFiles(dir, ASSETS_DIR, Object.keys(IMAGE_EXT));
}

function findAudio(dir: string) {
    return findFiles(dir, ASSETS_DIR, Object.keys(AUDIO_EXT));
}

function findOther(dir: string) {
  return findFiles(dir, ASSETS_DIR, [
      ...Object.keys(FONT_EXT),
      ...Object.keys(DATA_EXT),
      ...Object.keys(VIDEO_EXT),
  ]);
}


async function compressImages(files: any[]) {
    if (files.length <= 0) return;

    console.log(`Images: ${files.length}, Quality: ${quality}`);

    const settings = { quality, effort: 4 };

    for (const file of files) {
        const outPath = path.join(ASSETS_COMPRESSED_DIR, file.relativeDir);
        const compressedFilePath = path.join(outPath, `${file.name}.${IMAGE_EXT.webp}`);

        await sharp(file.path).webp(settings).toFile(compressedFilePath);

        validateFile(file, outPath, compressedFilePath);

        console.log(`> ${file.name}`);
    }
}

async function compressAudio(files: any[]) {
    if (files.length <= 0) return;

    console.log(`Audio: ${files.length}, Bitrate: ${audioBitrate} kbps`);

    for (const file of files) {
        const outPath = path.join(ASSETS_COMPRESSED_DIR, file.relativeDir);
        const compressedFilePath = path.join(outPath, `${file.name}.${AUDIO_EXT.mp3}`);

        await runFfmpeg(['-y', '-i', file.path, '-b:a', audioBitrate + 'k', compressedFilePath]);

        validateFile(file, outPath, compressedFilePath);

        console.log(`> ${file.name}`);
    }
}

async function compressOther(files: any[]) {
    if (files.length <= 0) return;

    console.log(`Other: ${files.length}`);

    for (const file of files) {
        fs.copyFileSync(
            file.path,
            path.join(ASSETS_COMPRESSED_DIR, file.relativeDir, file.nameWithExt)
        );

        console.log(`> ${file.name}`);
    }
}


function runFfmpeg(args: string[]) {
    return new Promise<void>((resolve, reject) => {
        if (!ffmpeg) return;

        const proc = spawn(ffmpeg, args, {stdio: ['ignore', 'pipe', 'pipe']});
        let err = '';

        proc.stderr.on('data', d => { err += d; });
        proc.on('close', code => (code === 0 ? resolve() : reject(new Error(err.slice(-500) || 'ffmpeg error'))));
    });
}


function validateFile(file: any, outPath: string, compressedFilePath: string) {
    const compressedSizePercent = fs.statSync(compressedFilePath).size / file.size;

    if (compressedSizePercent > 1) {
        fs.rmSync(compressedFilePath, { recursive: true });
        fs.copyFileSync(file.path, path.join(outPath, file.nameWithExt));
    }
}