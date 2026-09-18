import type { SupabaseClient } from '@supabase/supabase-js';

/** Never send lab parameters, callback codes, or arbitrary next URLs to OAuth. */
export function authRedirect(address: string) {
    const url = new URL(address);
    return `${url.origin}${url.pathname}`;
}
/** Provider error descriptions are external input: display only our own messages. */
export function authReturnMessage(address: string): string {
    const url = new URL(address), hash = new URLSearchParams(url.hash.slice(1));
    const error = url.searchParams.get('error') ?? hash.get('error');
    if (!error && !url.searchParams.has('error_code') && !hash.has('error_code')) return '';
    return error === 'access_denied'
        ? 'Đăng nhập chưa hoàn tất. Bạn có thể thử lại; khu vườn trên máy vẫn được giữ.'
        : 'Chưa xác nhận được đăng nhập. Hãy thử lại từ nút đăng nhập bên dưới.';
}
export async function signInWithGoogle(client: Pick<SupabaseClient, 'auth'>, address: string, ready: () => Promise<boolean>) {
    // Avoid sending the player to Supabase's raw error page while the provider is not configured.
    if (!await ready()) throw new Error('Đăng nhập Google đang được chuẩn bị. Bạn vẫn có thể chơi trên máy hoặc dùng email.');
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: {
        redirectTo: authRedirect(address), scopes: 'openid email profile', queryParams: { prompt: 'select_account' },
    } });
    if (error) throw new Error('Chưa mở được đăng nhập Google. Kiểm tra kết nối và thử lại.');
}
