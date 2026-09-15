export interface AssetEntry {
    url: string;
    revision: string | null;
    integrity?: string;
    byteSize?: number;
}

export interface DownloadProgress {
    completed: number;
    total: number;
    bytes: number;
    totalBytes: number;
    file?: string;
}

export const emptyProgress = (): DownloadProgress => ({ completed: 0, total: 0, bytes: 0, totalBytes: 0 });

// Keep the app executable before offering the optional media download.
export function isCoreAsset(entry: AssetEntry): boolean {
    return /\.(?:js|css|html|woff2?|ico)$/.test(entry.url) || /(?:^|\/)Logo\.png$/.test(entry.url);
}

interface DownloadOptions {
    entries: AssetEntry[];
    cache: Pick<Cache, 'match' | 'put'>;
    cacheKey: (entry: AssetEntry) => string;
    baseURL: string;
    signal?: AbortSignal;
    onProgress: (progress: DownloadProgress) => void;
    fetcher?: typeof fetch;
}

export async function inspectDownload({ entries, cache, cacheKey }: Pick<DownloadOptions, 'entries' | 'cache' | 'cacheKey'>) {
    const missing: AssetEntry[] = [];
    const progress = emptyProgress();
    progress.total = entries.length;
    for (const entry of entries) {
        progress.totalBytes += entry.byteSize || 0;
        if (await cache.match(cacheKey(entry))) {
            progress.completed++;
            progress.bytes += entry.byteSize || 0;
        } else missing.push(entry);
    }
    return { missing, progress };
}

// Progress counts completed cache writes, never an elapsed-time estimate.
// Cache keys include the revision: retries reuse complete files only.
export async function downloadAssets(options: DownloadOptions): Promise<DownloadProgress> {
    const { cache, cacheKey, baseURL, signal, onProgress, fetcher = fetch } = options;
    const { missing, progress } = await inspectDownload(options);
    onProgress({ ...progress });
    let next = 0;
    let failure: unknown;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    try {
        await Promise.all(Array.from({ length: Math.min(4, missing.length) }, async () => {
            while (next < missing.length && !controller.signal.aborted) {
                const entry = missing[next++];
                const timeout = setTimeout(() => {
                    failure ??= new Error('Kết nối quá chậm. Hãy thử tải tiếp.');
                    controller.abort();
                }, 60_000);
                try {
                    const response = await fetcher(new URL(entry.url, baseURL).href, {
                        cache: 'reload', credentials: 'same-origin',
                        integrity: entry.integrity, signal: controller.signal,
                    });
                    if (!response.ok || response.type === 'opaque') {
                        throw new Error(`Không tải được ${entry.url} (HTTP ${response.status}).`);
                    }
                    // An HTML fallback for a missing asset must not become an offline success.
                    if (!/\.html$/.test(entry.url) && response.headers.get('content-type')?.includes('text/html')) {
                        throw new Error(`Máy chủ trả sai nội dung cho ${entry.url}. Hãy kiểm tra bản cập nhật mới.`);
                    }
                    await cache.put(cacheKey(entry), response);
                    progress.completed++;
                    progress.bytes += entry.byteSize || 0;
                    progress.file = entry.url;
                    onProgress({ ...progress });
                } catch (error) {
                    if (!signal?.aborted) failure ??= error instanceof TypeError
                        ? new Error(`Không tải được ${entry.url}. Hãy kiểm tra mạng hoặc kiểm tra phiên bản mới.`, { cause: error })
                        : error;
                    controller.abort();
                } finally {
                    clearTimeout(timeout);
                }
            }
        }));
        if (failure) throw failure;
        if (signal?.aborted) throw new DOMException('Đã tạm dừng tải.', 'AbortError');
        return progress;
    } finally {
        signal?.removeEventListener('abort', abort);
    }
}
