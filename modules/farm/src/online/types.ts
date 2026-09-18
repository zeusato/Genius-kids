import type { FarmState } from '../core/types';
export type CloudSave = { owner_id: string; revision: number; state: FarmState; updated_at: string };
export type PendingUpload = { requestId: string; expectedRevision: number | null; change: number; state: FarmState };
export type SyncMeta = { ownerId: string; linked: boolean; revision: number | null; change: number; dirty: boolean; pending?: PendingUpload; syncedAt?: string };
export type SyncStatus = { phase: 'checking' | 'unlinked' | 'pending' | 'saved' | 'offline' | 'conflict' | 'error'; message?: string; remote?: CloudSave | null; syncedAt?: string };
export interface CloudTransport {
    read(): Promise<CloudSave | null>;
    write(pending: PendingUpload): Promise<CloudSave>;
}
export class CloudConflict extends Error { constructor() { super('Có bản lưu mới từ thiết bị khác.'); } }
