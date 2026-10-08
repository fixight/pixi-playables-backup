import {COMPRESSED_ASSETS} from "./_DATA_BASE/AssetsDB_COMPRESSED.ts";


let cashedAssets: any = undefined;

export async function LoadAssetsDB() {
    return cashedAssets ??= await decompressAsync(COMPRESSED_ASSETS);
}


async function decompressAsync(compressedBase64: string): Promise<any> {
    const compressed = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));

    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(compressed);
    writer.close();

    const decompressed = await new Response(ds.readable).arrayBuffer();
    const text = new TextDecoder().decode(decompressed);

    return JSON.parse(text);
}