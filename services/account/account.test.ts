import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { captureSnapshot, decode, emptySnapshot, encode, fingerprint, restoreSnapshot, validateSnapshot, ACTIVE_OWNER, type ProfileSnapshot } from './snapshot';
import { ProfileCoordinator } from './coordinator';
import { CloudConflict, type CloudSave, type CloudTransport } from './cloud';
import { readCache, writeCache } from './vault';
import type { StudentProfile } from '../../types';
vi.mock('../../src/lib/supabase', () => ({ supabase: null }));

const profile = (id = 'child', stars = 12) => ({ id, name: 'Bé An', grade: 3, stars,
    currentAvatarId: 'avatar_01', stats: {},
    learn: { completed: { lesson1: true } }, history: [{ id: 'exam1' }], inventory: ['reward1'],
    counting: { drafts: { count: { phase: 'play' } } }, chatHistory: [{ content: 'Con thích toán' }],
} as unknown as StudentProfile);
const snapshot = (id = 'child', stars = 12): ProfileSnapshot => ({ ...emptySnapshot(), profiles: [profile(id, stars)], local: { ['caro:' + id + ':draft-v1']: '{"round":2}' } });
beforeEach(() => {
    const storage = Object.create(null);
    Object.defineProperties(storage, {
        getItem: { value: (k: string) => storage[k] ?? null },
        setItem: { value: (k: string, v: string) => { storage[k] = String(v); } },
        removeItem: { value: (k: string) => { delete storage[k]; } },
    });
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('IDBKeyRange', IDBKeyRange);
});

describe('whole-profile snapshots', () => {
    it('migrates legacy profiles without losing reading, badges, chat or future module fields', async () => {
        const legacy = { id: 'old', name: 'Bé cũ', readingProgress: [{ bookId: 'book', currentPage: 12 }],
            solarBadges: ['sun'], chatHistory: [{ content: 'Con thích sách' }], futureModule: { checkpoint: 5 } };
        localStorage.setItem('math_profiles', JSON.stringify([legacy]));
        const captured = await captureSnapshot();
        expect(captured.profiles[0]).toMatchObject({ ...legacy, stars: 0, grade: 2 });
        expect((captured.profiles[0] as any).futureModule).toEqual({ checkpoint: 5 });
    });
    it('round trips all profile fields, drafts, binary terrain and attachments; excludes keys/session secrets', async () => {
        const s = snapshot();
        s.databases = [
            { database: 'planet-maker-worlds', store: 'tiles', rows: [{ key: ['child', 0], value: await encode({ studentId: 'child', tile: 0, height: new Float32Array([1.5, -2]), biome: new Uint8Array([1, 2]) }) }] },
            { database: 'electricity-notebook-v1', store: 'thumbnails', rows: [{ key: 'drawing1', value: await encode({ id: 'drawing1', ownerId: 'child', image: new Blob(['picture'], { type: 'image/png' }) }) }] },
            { database: 'lang-mam-profile-v1-child', store: 'snapshots', rows: [{ key: 'autosave', value: { coins: 91 } }] },
        ];
        localStorage.setItem('mathgenius_gemini_key', 'secret'); localStorage.setItem('sb-session', 'token');
        await restoreSnapshot(s);
        const captured = await captureSnapshot();
        expect(captured.profiles).toEqual(s.profiles); expect(captured.local).toEqual(s.local);
        expect(await fingerprint(captured)).toBe(await fingerprint(s));
        const terrain = decode(captured.databases.find(d => d.store === 'tiles')!.rows[0].value);
        expect(terrain.height).toBeInstanceOf(Float32Array); expect(Array.from(terrain.height)).toEqual([1.5, -2]);
        const attachment = decode(captured.databases.find(d => d.store === 'thumbnails')!.rows[0].value).image;
        expect(await attachment.text()).toBe('picture');
        expect(localStorage.getItem('mathgenius_gemini_key')).toBe('secret');
        expect(JSON.stringify(captured)).not.toContain('secret'); expect(JSON.stringify(captured)).not.toContain('token');
    });
    it('rejects foreign keys, stores, owner rows and invalid profiles before writing', async () => {
        await restoreSnapshot(snapshot());
        for (const bad of [
            { ...snapshot(), local: { mathgenius_gemini_key: 'secret' } },
            { ...snapshot(), profiles: [profile('a'), profile('a')] },
            { ...snapshot(), profiles: [profile('child', -1)] },
            { ...snapshot(), databases: [{ database: 'alien', store: 'secrets', rows: [] }] },
            { ...snapshot(), databases: [{ database: 'genius-english-v1', store: 'sessions', rows: [{ key: ['other', 'x'], value: { studentId: 'other', id: 'x' } }] }] },
        ]) {
            expect(() => validateSnapshot(bad)).toThrow(); await expect(restoreSnapshot(bad as ProfileSnapshot)).rejects.toThrow();
        }
        expect((await captureSnapshot()).profiles[0].id).toBe('child');
    });
    it('clears outgoing drafts on switching and restores deleted profiles without resurrecting them', async () => {
        await restoreSnapshot(snapshot('a')); await restoreSnapshot(snapshot('b'));
        expect(localStorage.getItem('caro:a:draft-v1')).toBeNull();
        expect(localStorage.getItem('caro:b:draft-v1')).toBeTruthy();
        await restoreSnapshot(emptySnapshot()); expect(await captureSnapshot()).toEqual(emptySnapshot());
    });
});

class Server implements CloudTransport {
    rows = new Map<string, CloudSave>(); offline = false; loseResponse = false; writes = 0;
    async read(owner: string) { if (this.offline) throw Error('offline'); return structuredClone(this.rows.get(owner) || null); }
    async head(owner: string) { const row = await this.read(owner); return row ? { revision: row.revision, updatedAt: row.updatedAt } : null; }
    async write(owner: string, p: Parameters<CloudTransport['write']>[1]) {
        if (this.offline) throw Error('offline');
        const old = this.rows.get(owner);
        if (old?.requestId === p.id) return structuredClone(old);
        if ((old?.revision || 0) !== p.revision) throw new CloudConflict();
        const next = { revision: p.revision + 1, snapshot: structuredClone(p.snapshot), requestId: p.id, updatedAt: new Date().toISOString() };
        this.rows.set(owner, next); this.writes++;
        if (this.loseResponse) { this.loseResponse = false; throw Error('response lost'); }
        return structuredClone(next);
    }
}
describe('account lifecycle and concurrent saves', () => {
    it('keeps guest, account A and account B independent; import is explicit', async () => {
        const server = new Server(), m = new ProfileCoordinator(server);
        await restoreSnapshot(snapshot('guest-child')); await m.activate('guest');
        await m.activate('A'); expect((await captureSnapshot()).profiles).toHaveLength(0);
        await m.importGuest(); expect(server.rows.get('A')!.snapshot.profiles[0].id).toBe('guest-child');
        await restoreSnapshot(snapshot('a-child', 100)); await m.sync();
        await m.activate('B'); expect((await captureSnapshot()).profiles).toHaveLength(0);
        await restoreSnapshot(snapshot('b-child', 200)); await m.sync();
        await m.activate('guest'); expect((await captureSnapshot()).profiles[0]).toEqual(profile('guest-child'));
        await m.activate('A'); expect((await captureSnapshot()).profiles[0]).toEqual(profile('a-child', 100));
        expect(server.rows.get('B')!.snapshot.profiles[0].stars).toBe(200);
    });
    it('retries a lost response exactly once then sends newer local progress without duplicate stars', async () => {
        const server = new Server(), m = new ProfileCoordinator(server);
        await m.activate('A'); await restoreSnapshot(snapshot('child', 20)); server.loseResponse = true;
        await expect(m.sync()).rejects.toThrow(); expect((await readCache('A'))!.pending).toBeTruthy();
        await restoreSnapshot(snapshot('child', 21)); await m.sync();
        expect(server.writes).toBe(2); expect(server.rows.get('A')!.snapshot.profiles[0].stars).toBe(21);
        expect((await readCache('A'))!.pending).toBeUndefined();
    });
    it('recovers offline work after reload including edits after the last checkpoint', async () => {
        const server = new Server(), first = new ProfileCoordinator(server);
        await first.activate('A'); await restoreSnapshot(snapshot('child', 30)); await first.sync();
        server.offline = true; await restoreSnapshot(snapshot('child', 31));
        const restarted = new ProfileCoordinator(server); await restarted.activate('A');
        expect(restarted.state).toBe('offline'); expect((await captureSnapshot()).profiles[0].stars).toBe(31);
        server.offline = false; await restarted.sync(); expect(server.rows.get('A')!.snapshot.profiles[0].stars).toBe(31);
    });
    it('protects both versions on conflict and uses an explicit choice without merging rewards', async () => {
        const server = new Server(), m = new ProfileCoordinator(server);
        await m.activate('A'); await restoreSnapshot(snapshot('child', 30)); await m.sync();
        server.rows.set('A', { ...server.rows.get('A')!, revision: 2, requestId: 'other', snapshot: snapshot('child', 50) });
        await restoreSnapshot(snapshot('child', 31)); await m.sync(); expect(m.state).toBe('conflict');
        expect(server.rows.get('A')!.snapshot.profiles[0].stars).toBe(50);
        await m.resolve('local'); expect(server.rows.get('A')!.snapshot.profiles[0].stars).toBe(31);
        expect((await readCache('A'))!.backup!.profiles[0].stars).toBe(50);
        server.rows.set('A', { ...server.rows.get('A')!, revision: 4, requestId: 'other2', snapshot: snapshot('child', 80) });
        await m.sync(); await m.resolve('cloud');
        expect((await captureSnapshot()).profiles[0].stars).toBe(80);
        expect((await readCache('A'))!.backup!.profiles[0].stars).toBe(31);
        await new ProfileCoordinator(server).activate('A');
        expect((await readCache('A'))!.backup!.profiles[0].stars).toBe(31);
    });
    it('refreshes clean cloud on startup, detects remote updates during play, and syncs deletion', async () => {
        const server = new Server(), m = new ProfileCoordinator(server);
        await m.activate('A'); await restoreSnapshot(snapshot()); await m.sync();
        server.rows.set('A', { ...server.rows.get('A')!, revision: 2, requestId: 'other', snapshot: snapshot('child', 90) });
        await m.sync(); expect(m.state).toBe('conflict'); expect((await captureSnapshot()).profiles[0].stars).toBe(12);
        const restarted = new ProfileCoordinator(server); await restarted.activate('A');
        expect((await captureSnapshot()).profiles[0].stars).toBe(90);
        await restoreSnapshot(emptySnapshot()); await restarted.sync(); expect(server.rows.get('A')!.snapshot.profiles).toEqual([]);
    });
    it('does not replace guest data when the first cloud download fails', async () => {
        const server = new Server(); server.offline = true;
        await restoreSnapshot(snapshot('guest-child'));
        await expect(new ProfileCoordinator(server).activate('A')).rejects.toThrow();
        expect((await captureSnapshot()).profiles[0].id).toBe('guest-child');
    });
    it('recovers an interrupted multi-database replacement from its journal', async () => {
        await writeCache({ owner: 'A', snapshot: snapshot('a-child'), revision: 4 });
        localStorage.setItem(ACTIVE_OWNER, 'A'); localStorage.setItem('genius-profile-switch-v1', 'A');
        await restoreSnapshot(snapshot('half-restored-b'));
        await new ProfileCoordinator(new Server()).recover();
        expect((await captureSnapshot()).profiles[0].id).toBe('a-child');
        expect(localStorage.getItem('genius-profile-switch-v1')).toBeNull();
    });
});
