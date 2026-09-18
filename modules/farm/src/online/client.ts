import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateSnapshot } from '../core/validation';
import { CloudConflict, type CloudSave, type CloudTransport, type PendingUpload } from './types';
import { authReturnMessage } from './google';

const url = import.meta.env.FARM_LAB_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.FARM_LAB_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const initialAuthMessage = authReturnMessage(location.href);
export async function googleProviderReady() {
    if (!url || !key) return false;
    try {
        const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
            headers: { apikey: key }, signal: AbortSignal.timeout(10000), cache: 'no-store',
        });
        if (!response.ok) throw new Error();
        const settings = await response.json();
        return settings.external?.google === true;
    } catch { throw new Error('Chưa kết nối được dịch vụ đăng nhập. Bạn thử lại khi có mạng nhé.'); }
}
// Only public project credentials belong in Vite. Never use a service-role key here.
export const farmSupabase: SupabaseClient | null = url && key ? createClient(url, key, {
    auth: { storageKey: 'lang-mam-auth-v1', flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

function fail(error: { code?: string; message: string }): never {
    if (error.code === '40001') throw new CloudConflict();
    if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error.code ?? ''))
        throw new Error('Máy chủ chưa cài đặt kho nông trại. Bản trên máy vẫn an toàn.');
    if (['42501', 'PGRST301', 'PGRST303'].includes(error.code ?? ''))
        throw new Error('Phiên đăng nhập cần được xác nhận lại. Bản trên máy vẫn được giữ.');
    throw new Error('Chưa kết nối được kho online. Bạn có thể tiếp tục chơi và thử đồng bộ lại.');
}
function decode(value: unknown, owner: string): CloudSave {
    const v = value as CloudSave;
    if (!v || v.owner_id !== owner || !Number.isSafeInteger(v.revision) || v.revision < 1 || !Number.isFinite(Date.parse(v.updated_at)))
        throw new Error('Bản online không hợp lệ. Bản trên máy vẫn được giữ.');
    return { ...v, state: validateSnapshot(v.state) };
}
export class SupabaseFarmTransport implements CloudTransport {
    constructor(private client: SupabaseClient, private owner: string) { }
    async read() {
        const { data, error } = await this.client.from('farm_cloud_saves').select('owner_id,revision,state,updated_at')
            .eq('owner_id', this.owner).abortSignal(AbortSignal.timeout(20000)).maybeSingle();
        if (error) fail(error);
        return data ? decode(data, this.owner) : null;
    }
    async write(pending: PendingUpload) {
        const { data, error } = await this.client.rpc('farm_write_save', {
            p_owner: this.owner, p_expected_revision: pending.expectedRevision,
            p_request_id: pending.requestId, p_state: pending.state,
        }).abortSignal(AbortSignal.timeout(20000));
        if (error) fail(error);
        // Receipt returns only the acknowledged revision; use the exact submitted payload.
        return decode({ ...data, state: pending.state }, this.owner);
    }
}
