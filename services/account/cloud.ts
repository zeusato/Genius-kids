import { supabase } from '../../src/lib/supabase';
import { validateSnapshot, type ProfileSnapshot } from './snapshot';
import type { PendingUpload } from './vault';

export interface CloudSave { revision: number; snapshot: ProfileSnapshot; requestId: string; updatedAt: string }
export interface CloudTransport {
    read(owner: string): Promise<CloudSave | null>;
    head(owner: string): Promise<{ revision: number; updatedAt: string } | null>;
    write(owner: string, pending: PendingUpload): Promise<CloudSave>;
}
export class CloudConflict extends Error {}
async function requireOwner(owner: string) {
    if (!supabase || (await supabase.auth.getSession()).data.session?.user.id !== owner) throw Error('Phiên đăng nhập đã đổi. Hãy đăng nhập lại để đồng bộ.');
}
export const cloud: CloudTransport = {
    async head(owner) {
        await requireOwner(owner);
        const { data, error } = await supabase!.from('profile_cloud_saves').select('revision,updated_at').eq('user_id', owner)
            .abortSignal(AbortSignal.timeout(15000)).maybeSingle();
        if (error) throw error;
        await requireOwner(owner);
        return data ? { revision: data.revision, updatedAt: data.updated_at } : null;
    },
    async read(owner) {
        if (!supabase) throw Error('Chưa cấu hình lưu trên tài khoản.');
        await requireOwner(owner);
        const { data, error } = await supabase.from('profile_cloud_saves')
            .select('revision,payload,last_request_id,updated_at').eq('user_id', owner).abortSignal(AbortSignal.timeout(15000)).maybeSingle();
        if (error) throw error;
        await requireOwner(owner);
        return data ? { revision: data.revision, snapshot: validateSnapshot(data.payload), requestId: data.last_request_id, updatedAt: data.updated_at } : null;
    },
    async write(owner, pending) {
        if (!supabase) throw Error('Chưa cấu hình lưu trên tài khoản.');
        validateSnapshot(pending.snapshot);
        await requireOwner(owner);
        const { data, error } = await supabase.rpc('save_profile_bundle', {
            p_owner: owner, p_expected_revision: pending.revision, p_request_id: pending.id, p_payload: pending.snapshot,
        }).abortSignal(AbortSignal.timeout(15000));
        if (error?.code === '40001') throw new CloudConflict('Có bản lưu khác trên tài khoản.');
        if (error) throw error;
        return { revision: data.revision, snapshot: pending.snapshot, requestId: pending.id, updatedAt: data.updated_at };
    },
};
