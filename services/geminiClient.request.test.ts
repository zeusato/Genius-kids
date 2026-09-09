import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const names = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
const catalog = (ids = names, nextPageToken?: string) => new Response(JSON.stringify({
    models: ids.map(name => ({name: 'models/' + name, supportedGenerationMethods: ['generateContent']})),
    nextPageToken,
}), {status: 200});
const modelIn = (url: string) => new URL(url).pathname.split('/').at(-1)!.split(':')[0];
beforeEach(() => { vi.resetModules(); vi.spyOn(console, 'info').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('Gemini discovery and ordered fallback requests', () => {
    it('finds the newest model on a later page and keeps the key out of URLs', async () => {
        const fetch = vi.fn(async (url: string, options: RequestInit) => {
            expect(options.headers).toMatchObject({'x-goog-api-key': 'fixture-key'});
            expect(url).not.toContain('fixture-key');
            return url.includes('pageToken=') ? catalog(['gemini-3.8-flash']) : catalog(['gemini-2.5-flash'], 'page/2');
        });
        vi.stubGlobal('fetch', fetch);
        const {resolveGeminiModels} = await import('./geminiClient');
        expect(await resolveGeminiModels('fixture-key')).toEqual(['gemini-3.8-flash', 'gemini-2.5-flash']);
        expect(fetch.mock.calls[1][0]).toContain('pageToken=page%2F2');
    });
    it('ignores the old persistent winning-model cache', async () => {
        const getItem = vi.fn(() => JSON.stringify({model: 'gemini-2.5-flash', ts: Date.now()}));
        vi.stubGlobal('localStorage', {getItem});
        vi.stubGlobal('fetch', vi.fn(async () => catalog()));
        const {resolveGeminiModel} = await import('./geminiClient');
        expect(await resolveGeminiModel('fixture-key')).toBe(names[0]);
        expect(getItem).not.toHaveBeenCalled();
    });
    it('expires its in-memory catalog and discovers again when the key changes', async () => {
        vi.useFakeTimers();
        const fetch = vi.fn(async () => catalog());
        vi.stubGlobal('fetch', fetch);
        const {resolveGeminiModel} = await import('./geminiClient');
        await resolveGeminiModel('first-key');
        await resolveGeminiModel('first-key');
        expect(fetch).toHaveBeenCalledTimes(1);
        await resolveGeminiModel('second-key');
        expect(fetch).toHaveBeenCalledTimes(2);
        vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1);
        fetch.mockImplementation(async () => catalog(['gemini-4-flash-preview']));
        expect(await resolveGeminiModel('second-key')).toBe('gemini-4-flash-preview');
        expect(fetch).toHaveBeenCalledTimes(3);
    });
    it('starts with the current fallback versions when discovery is unavailable', async () => {
        const posts: string[] = [];
        vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
            if (options.method !== 'POST') return new Response('', {status: 503});
            posts.push(modelIn(url));
            return new Response('{}', {status: 200});
        }));
        const {geminiGenerateContent} = await import('./geminiClient');
        await geminiGenerateContent('fixture-key', {});
        expect(posts).toEqual(['gemini-3.8-flash']);
    });
    it('tries newer to older across missing, overloaded and rate-limited models without pinning the winner', async () => {
        vi.useFakeTimers();
        const posts: string[] = [], payload = {contents: [{parts: [{text: 'fixture question'}]}]};
        const statuses = [404, 503, 429, 200, 200];
        vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
            if (options.method !== 'POST') return catalog();
            expect(options.body).toBe(JSON.stringify(payload));
            posts.push(modelIn(url));
            return new Response('{}', {status: statuses[posts.length - 1]});
        }));
        const {geminiGenerateContent} = await import('./geminiClient');
        const request = geminiGenerateContent('fixture-key', payload);
        await vi.runAllTimersAsync();
        expect((await request).ok).toBe(true);
        expect(posts).toEqual(names);
        await geminiGenerateContent('fixture-key', payload);
        expect(posts.at(-1)).toBe(names[0]);
    });
    it.each([400, 401, 403])('stops on %s instead of retrying key or request errors', async status => {
        const fetch = vi.fn(async (_url: string, options: RequestInit) =>
            options.method === 'POST' ? new Response('{}', {status}) : catalog());
        vi.stubGlobal('fetch', fetch);
        const {geminiGenerateContent} = await import('./geminiClient');
        expect((await geminiGenerateContent('fixture-key', {})).status).toBe(status);
        expect(fetch.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1);
    });
    it('does not repeat unavailable models or exceed the requested attempt limit', async () => {
        const posts: string[] = [];
        vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
            if (options.method !== 'POST') return catalog();
            posts.push(modelIn(url));
            return new Response('{}', {status: 404});
        }));
        const {geminiGenerateContent} = await import('./geminiClient');
        expect((await geminiGenerateContent('fixture-key', {}, {maxAttempts: 2})).status).toBe(404);
        expect(posts).toEqual(names.slice(0, 2));
    });
    it('honors Retry-After and cancellation during the retry delay', async () => {
        vi.useFakeTimers();
        const fetch = vi.fn(async (_url: string, options: RequestInit) => options.method === 'POST'
            ? new Response('{}', {status: 429, headers: {'Retry-After': '10'}}) : catalog());
        vi.stubGlobal('fetch', fetch);
        const {geminiGenerateContent} = await import('./geminiClient');
        const controller = new AbortController();
        const request = geminiGenerateContent('fixture-key', {}, {signal: controller.signal});
        const rejected = expect(request).rejects.toMatchObject({name: 'AbortError'});
        await vi.advanceTimersByTimeAsync(9999);
        expect(fetch.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1);
        controller.abort();
        await rejected;
        expect(vi.getTimerCount()).toBe(0);
    });
    it('lets the Dragon game reach the fourth model and ignores reasoning parts', async () => {
        const posts: string[] = [];
        vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
            if (options.method !== 'POST') return catalog();
            posts.push(modelIn(url));
            return posts.length < 4 ? new Response('{}', {status: 404}) : new Response(JSON.stringify({
                candidates: [{content: {parts: [{thought: true, text: 'private reasoning'}, {text: '{"schemaVersion":1,"questions":[]}'}]}}],
            }), {status: 200});
        }));
        const {apiGenerator, buildRequest} = await import('../games/DragonQuest/adventure/ai');
        const body = buildRequest({missionId: 'forest-1', grade: 2, difficulty: 'easy', topic: 'mixed', mode: 'story', ai: true}, [], 42);
        expect(await apiGenerator('fixture-key')(body, new AbortController().signal)).toBe('{"schemaVersion":1,"questions":[]}');
        expect(posts).toEqual(names);
    });
});
