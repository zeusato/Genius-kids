// Shared text/JSON client. Discover available models, newest version first.
// Cache the catalog, never the last fallback that happened to succeed.
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_TTL = 60 * 60 * 1000;

// Used only when ListModels cannot provide a usable catalog.
// Verified 2026-09-09: https://ai.google.dev/gemini-api/docs/models
const DISCOVERY_FALLBACKS = [
    'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash',
    'gemini-3.5-flash', 'gemini-flash-latest',
];
type Catalog = { apiKey: string; models: string[]; expiresAt: number };
// Intentionally ignore the old unscoped localStorage "winning model" cache.
// Changing keys or reloading the app now causes fresh discovery.
let catalog: Catalog | null = null;

const stripPrefix = (name: string) => name.replace(/^models\//, '');
const aliases = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest'];
const modelPattern = /^gemini-(\d+)(?:\.(\d+))?-(flash-lite|flash|pro)(?:-((?:preview|exp|latest|\d{3})(?:-\d{2,4})*))?$/;

/** Handles both gemini-3-flash-preview and gemini-3.8-flash. */
export const versionScore = (name: string): number => {
    const match = stripPrefix(name).match(/^gemini-(\d+)(?:\.(\d+))?-/);
    return match ? Number(match[1]) * 100 + Number(match[2] || 0) : 0;
};
const stage = (suffix = '') => suffix.startsWith('exp') ? 2 : suffix.startsWith('preview') ? 1 : 0;
const family = (name: string) => name === 'flash' ? 0 : name === 'pro' ? 1 : 2;
const compareModels = (a: string, b: string): number => {
    const av = a.match(modelPattern), bv = b.match(modelPattern);
    // Unversioned aliases are a last resort: their target is not observable here.
    if (!av || !bv) return av ? -1 : bv ? 1 : aliases.indexOf(a) - aliases.indexOf(b);
    return versionScore(b) - versionScore(a)
        || stage(av[4]) - stage(bv[4])
        || family(av[3]) - family(bv[3])
        || (bv[4] || '').localeCompare(av[4] || '', undefined, {numeric: true})
        || a.localeCompare(b);
};

/** Only general text models with generateContent; exclude image/audio/live/tools. */
export const rankModels = (models: unknown): string[] => {
    if (!Array.isArray(models)) return [];
    const names: string[] = [];
    for (const model of models) {
        if (!model || typeof model.name !== 'string'
            || !Array.isArray(model.supportedGenerationMethods)
            || !model.supportedGenerationMethods.includes('generateContent')) continue;
        const name = stripPrefix(model.name);
        if (modelPattern.test(name) || aliases.includes(name)) names.push(name);
    }
    return [...new Set(names)].sort(compareModels);
};
export const pickBest = (models: unknown): string | null => rankModels(models)[0] || null;

export const resolveGeminiModels = async (apiKey: string, force = false, signal?: AbortSignal): Promise<string[]> => {
    signal?.throwIfAborted();
    if (!apiKey) throw new Error('Vui lòng cung cấp API Key để sử dụng AI.');
    const cached = catalog?.apiKey === apiKey ? catalog : null;
    if (!force && cached && cached.expiresAt > Date.now()) return [...cached.models];
    try {
        const models: unknown[] = [], seenTokens = new Set<string>();
        let pageToken = '';
        do {
            signal?.throwIfAborted();
            const url = BASE + '/models?pageSize=1000' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
            const response = await fetch(url, {headers: {'x-goog-api-key': apiKey}, signal});
            if (!response.ok) throw new Error('Model discovery failed');
            const data = await response.json();
            if (!Array.isArray(data?.models)) throw new Error('Invalid model catalog');
            models.push(...data.models);
            pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
            if (pageToken && seenTokens.has(pageToken)) throw new Error('Repeated model page');
            seenTokens.add(pageToken);
        } while (pageToken);
        signal?.throwIfAborted();
        const ranked = rankModels(models);
        if (ranked.length) {
            catalog = {apiKey, models: ranked, expiresAt: Date.now() + CACHE_TTL};
            return [...ranked];
        }
    } catch {
        signal?.throwIfAborted();
    }
    // Discovery failure does not refresh the TTL or borrow another key's catalog.
    return [...new Set([...DISCOVERY_FALLBACKS, ...(cached?.models || [])])].sort(compareModels);
};
export const resolveGeminiModel = async (apiKey: string, force = false, signal?: AbortSignal): Promise<string> =>
    (await resolveGeminiModels(apiKey, force, signal))[0];

const waitForRetry = (ms: number, signal?: AbortSignal) => {
    signal?.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
        const clean = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };
        const abort = () => { clean(); reject(signal?.reason); };
        const timer = setTimeout(() => { clean(); resolve(); }, ms);
        signal?.addEventListener('abort', abort, {once: true});
    });
};
const retryDelay = (response: Response, attempt: number): number => {
    const header = response.headers.get('Retry-After');
    const serverDelay = header === null ? 0 : /^\d+(?:\.\d+)?$/.test(header)
        ? Number(header) * 1000 : Math.max(0, Date.parse(header) - Date.now()) || 0;
    return Math.max(serverDelay, Math.min(4000, 1000 * 2 ** (attempt - 1)) + Math.random() * 200);
};

/** Try compatible versions in descending order; stop on key/payload errors. */
export const geminiGenerateContent = async (
    apiKey: string, body: unknown, options: {signal?: AbortSignal; maxAttempts?: number} = {},
): Promise<Response> => {
    const {signal} = options;
    let candidates = await resolveGeminiModels(apiKey, false, signal);
    const tried = new Set<string>();
    const attemptLimit = Number.isFinite(options.maxAttempts) ? Math.max(1, Math.min(4, Math.floor(options.maxAttempts!))) : 4;
    const payload = JSON.stringify(body);
    let lastResponse: Response | undefined, refreshed = false;
    while (candidates.length && tried.size < attemptLimit) {
        signal?.throwIfAborted();
        const model = candidates.shift()!;
        if (tried.has(model)) continue;
        tried.add(model);
        const response = await fetch(BASE + '/models/' + model + ':generateContent', {
            method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
            body: payload, signal,
        });
        signal?.throwIfAborted();
        // Model/status only: never log a key, prompt or answer.
        if (import.meta.env.DEV) console.info('[Gemini]', {model, attempt: tried.size, status: response.status});
        if (response.ok || ![404, 410, 408, 429, 500, 502, 503, 504].includes(response.status)) return response;
        lastResponse = response;
        if (tried.size >= attemptLimit) break;
        if ((response.status === 404 || response.status === 410) && !refreshed) {
            refreshed = true;
            const fresh = await resolveGeminiModels(apiKey, true, signal);
            candidates = [...new Set([...fresh, ...candidates])].filter(name => !tried.has(name)).sort(compareModels);
        } else if (response.status !== 404 && response.status !== 410 && candidates.length) {
            await waitForRetry(retryDelay(response, tried.size), signal);
        }
    }
    return lastResponse!;
};
