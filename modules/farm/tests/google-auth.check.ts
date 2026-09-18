import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authRedirect, authReturnMessage, signInWithGoogle } from '../src/online/google';

it('keeps redirect on the current farm path without codes, labs or arbitrary destinations', () => {
    expect(authRedirect('https://example.test/farm/?lab=qa&code=private&next=https://evil.test/#token=private')).toBe('https://example.test/farm/');
});
it('does not leave the farm for a provider that is not configured', async () => {
    const start = vi.fn(), client = { auth: { signInWithOAuth: start } } as unknown as SupabaseClient;
    await expect(signInWithGoogle(client,'http://127.0.0.1:4328/',async () => false)).rejects.toThrow('đang được chuẩn bị');
    expect(start).not.toHaveBeenCalled();
});
it('requests only Google identity scopes and returns to the farm', async () => {
    const start = vi.fn().mockResolvedValue({error:null}), client = { auth: { signInWithOAuth: start } } as unknown as SupabaseClient;
    await signInWithGoogle(client,'http://127.0.0.1:4328/?lab=qa',async () => true);
    expect(start).toHaveBeenCalledWith({provider:'google',options:{redirectTo:'http://127.0.0.1:4328/',scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
});
it('shows safe messages for cancellation and provider errors without exposing external descriptions', () => {
    expect(authReturnMessage('https://farm.test/#error=access_denied&error_description=UNTRUSTED')).toContain('chưa hoàn tất');
    expect(authReturnMessage('https://farm.test/?error=server_error&error_description=UNTRUSTED')).not.toContain('UNTRUSTED');
    expect(authReturnMessage('https://farm.test/?code=private')).toBe('');
});
it('reports SDK failures without echoing server details', async () => {
    const client = { auth: { signInWithOAuth: async () => ({error:{message:'private details'}}) } } as unknown as SupabaseClient;
    await expect(signInWithGoogle(client,'http://127.0.0.1:4328/',async () => true)).rejects.toThrow('Chưa mở được đăng nhập Google');
});
