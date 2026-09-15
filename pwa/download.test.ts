import { describe, expect, it, vi } from 'vitest';
import { downloadAssets, inspectDownload, isCoreAsset, type AssetEntry, type DownloadProgress } from './download';

const entry = (url: string, revision = 'v1'): AssetEntry => ({ url, revision, byteSize: 10, integrity: 'sha256-test' });
const cacheKey = (asset: AssetEntry) => `${asset.url}?revision=${asset.revision}`;
function setup(entries: AssetEntry[]) {
    const stored = new Map<string, Response>();
    const cache = {
        match: vi.fn(async (key: string) => stored.get(key)?.clone()),
        put: vi.fn(async (key: string, response: Response) => { await response.text(); stored.set(key, new Response('saved')); }),
    };
    const progress: DownloadProgress[] = [];
    const fetcher = vi.fn(async () => new Response('content'));
    return { entries, stored, cache, cacheKey, baseURL: 'https://example.test/Genius-kids/', fetcher, progress,
        onProgress: (value: DownloadProgress) => progress.push(value) };
}

describe('offline downloads', () => {
    it('keeps media out of installation but includes executable code and styles', () => {
        expect(['assets/game.js', 'assets/style.css', 'index.html', 'Logo.png'].every(url => isCoreAsset(entry(url)))).toBe(true);
        expect(['Album/art.webp', 'audio/vi/hello.mp3', 'dragon/model.glb'].some(url => isCoreAsset(entry(url)))).toBe(false);
    });
    it('reuses matching revisions, downloads changed files and counts completed writes', async () => {
        const options = setup([entry('keep.js'), entry('change.js', 'v2')]);
        options.stored.set(cacheKey(entry('keep.js')), new Response('old'));
        options.stored.set(cacheKey(entry('change.js')), new Response('old'));
        await downloadAssets(options);
        expect(options.fetcher).toHaveBeenCalledTimes(1);
        expect(options.fetcher).toHaveBeenCalledWith('https://example.test/Genius-kids/change.js', expect.objectContaining({ cache: 'reload', integrity: 'sha256-test' }));
        expect(options.progress.map(value => value.completed)).toEqual([1, 2]);
        expect(options.progress.at(-1)).toMatchObject({ bytes: 20, totalBytes: 20 });
    });
    it('retains complete files across pause and resumes only missing files', async () => {
        const options = setup(Array.from({ length: 12 }, (_, i) => entry(`${i}.mp3`)));
        const controller = new AbortController();
        await expect(downloadAssets({ ...options, signal: controller.signal, onProgress: progress => {
            if (progress.completed === 1) controller.abort();
        } })).rejects.toMatchObject({ name: 'AbortError' });
        const completed = options.stored.size;
        expect(completed).toBeGreaterThan(0);
        expect(completed).toBeLessThan(12);
        options.fetcher.mockClear();
        await downloadAssets(options);
        expect(options.fetcher).toHaveBeenCalledTimes(12 - completed);
        expect(options.progress.at(-1)?.completed).toBe(12);
    });
    it.each([404, 503])('never caches HTTP %i failures or reports completion', async status => {
        const options = setup([entry('missing.js')]);
        options.fetcher.mockResolvedValue(new Response('error', { status }));
        await expect(downloadAssets(options)).rejects.toThrow(`HTTP ${status}`);
        expect(options.stored.size).toBe(0);
        expect(options.progress.at(-1)?.completed).toBe(0);
    });
    it('rejects an HTML fallback returned as 200 for an asset', async () => {
        const options = setup([entry('missing.mp3')]);
        options.fetcher.mockResolvedValue(new Response('<html/>', { headers: { 'content-type': 'text/html' } }));
        await expect(downloadAssets(options)).rejects.toThrow('sai nội dung');
        expect(options.stored.size).toBe(0);
    });
    it('does not count a quota failure as a saved file', async () => {
        const options = setup([entry('huge.glb')]);
        options.cache.put.mockRejectedValue(new DOMException('Full', 'QuotaExceededError'));
        await expect(downloadAssets(options)).rejects.toMatchObject({ name: 'QuotaExceededError' });
        expect(options.progress.at(-1)?.completed).toBe(0);
    });
    it('rechecks cache contents instead of trusting a persisted completion flag', async () => {
        const options = setup([entry('one.js'), entry('two.js')]);
        await downloadAssets(options);
        options.stored.delete(cacheKey(entry('two.js')));
        expect((await inspectDownload(options)).missing.map(value => value.url)).toEqual(['two.js']);
    });
    it('bounds concurrent transfers to four', async () => {
        const options = setup(Array.from({ length: 11 }, (_, i) => entry(`${i}.js`)));
        let running = 0, maximum = 0;
        await downloadAssets({ ...options, fetcher: async () => {
            maximum = Math.max(maximum, ++running);
            await new Promise(resolve => setTimeout(resolve, 2));
            running--;
            return new Response('content');
        } });
        expect(maximum).toBe(4);
    });
});
