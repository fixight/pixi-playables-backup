import * as fs from "node:fs";
import * as path from "node:path";

// =====================================================================================

export const ASSETS_DIR = 'public/assets';
export const ASSETS_COMPRESSED_DIR = 'public/assets_compressed';

// =====================================================================================

export const IMAGE_EXT = {
    'jpg': 'jpg',
    'jpeg': 'jpeg',
    'png': 'png',
    'gif': 'gif',
    'webp': 'webp',
    'tiff': 'tiff',
    'tif': 'tif',
    'bmp': 'bmp',
}

export const AUDIO_EXT = {
    'mp3': 'mp3',
    'wav': 'wav',
    'ogg': 'ogg',
    'm4a': 'm4a',
    'aac': 'aac',
    'flac': 'flac',
    'wma': 'wma',
}

export const FONT_EXT = {
    'woff': 'woff',
    'woff2': 'woff2',
    'ttf': 'ttf',
    'otf': 'otf',
}

export const DATA_EXT = {
    'json': 'json',
}

export const VIDEO_EXT = {
    'mp4': 'mp4',
}


export function getExtension(filePath: string) {
    return path.extname(filePath).slice(1).toLowerCase();
}

// =====================================================================================

export function getContent(filePath: string) {
    return fs.readFileSync(filePath).toString();
}

export function getBase64Content(filePath: string) {
    return fs.readFileSync(filePath).toString('base64');
}

// =====================================================================================

export function base64Type(filePath: string): string {
    return {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',

        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'otf': 'font/otf',

        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',

        'mp4': 'video/mp4',
    }[getExtension(filePath)] || 'application/octet-stream';
}

export function toBase64(filePath: string) {
    return `data:${base64Type(filePath)};base64,${getBase64Content(filePath)}`;
}

// =====================================================================================

export type category =
    | "texture" | "audio" | "video"
    | "data" | "font" /* | "gif" */;

export function getGroup(filePath: string): category | 'other' {
    const ext = getExtension(filePath);

    // if (ext == 'gif') return 'gif';
    if (Object.keys(IMAGE_EXT).includes(ext)) return 'texture';
    if (Object.keys(FONT_EXT).includes(ext)) return 'font';
    if (Object.keys(AUDIO_EXT).includes(ext)) return 'audio';
    if (Object.keys(VIDEO_EXT).includes(ext)) return 'video';
    if (Object.keys(DATA_EXT).includes(ext)) return 'data';

    return 'other';
}

// =====================================================================================