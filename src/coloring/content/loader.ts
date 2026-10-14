import type { Catalog, Page } from '../model';
import { decodeMap } from '../engine/geometry.mjs';
export const asset = (file: string) => `${import.meta.env.BASE_URL}coloring/${file}`;
async function json<T>(file: string, signal?: AbortSignal): Promise<T> { const res = await fetch(asset(file), { signal }); if (!res.ok)
    throw Error('Chưa tải được tranh. Hãy kết nối mạng và thử lại.'); return res.json(); }
export const loadCatalog = (signal?: AbortSignal) => json<Catalog>('catalog.json', signal);
async function unpack(file: string, signal?: AbortSignal) { const res = await fetch(asset(file), { signal }); if (!res.ok)
    throw Error('Chưa tải được tranh. Hãy kết nối mạng và thử lại.'); return new Uint8Array(await new Response(res.body!.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()); }
export async function loadPage(id: string, signal?: AbortSignal) { if (!/^[a-z0-9-]+$/.test(id))
    throw Error('Mã tranh không hợp lệ'); const [data, map] = await Promise.all([unpack(id + '.page.bin', signal), unpack(id + '.bin', signal)]), page: Page = JSON.parse(new TextDecoder().decode(data)), labels = decodeMap(map); if (labels.length !== page.size ** 2 || page.regions.some(r => r.id < 1 || !r.d.endsWith('Z')))
    throw Error('Tranh bị hỏng'); return { page, labels }; }
