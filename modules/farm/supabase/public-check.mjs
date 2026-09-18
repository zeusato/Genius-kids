import fs from 'node:fs';
import assert from 'node:assert/strict';
import { databaseUrl, reportFailure } from './database.mjs';

try {
    const settings = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/).flatMap(line => {
        const m = line.match(/^\s*(FARM_LAB_\w+)\s*=\s*(.*?)\s*$/);
        return m ? [[m[1], m[2].replace(/^(['"])(.*)\1$/, '$2')]] : [];
    }));
    const url = new URL(settings.FARM_LAB_SUPABASE_URL), db = new URL(databaseUrl());
    assert.ok(db.hostname === `db.${url.hostname}` || decodeURIComponent(db.username).endsWith(`.${url.hostname.split('.')[0]}`), 'Database and browser project mismatch');
    console.log('Database and browser configuration target the same Supabase project.');
    const headers = { apikey: settings.FARM_LAB_SUPABASE_PUBLISHABLE_KEY };
    const auth = await fetch(new URL('/auth/v1/settings', url), { headers, signal: AbortSignal.timeout(15000) });
    const options = await auth.json();
    console.log(JSON.stringify({ authSettingsStatus: auth.status, emailEnabled: options.external?.email, signupDisabled: options.disable_signup, emailAutoConfirm: options.mailer_autoconfirm }));
    const rest = await fetch(new URL('/rest/v1/farm_cloud_saves?select=owner_id&limit=0', url), { headers, signal: AbortSignal.timeout(15000) });
    const result = await rest.json();
    console.log(JSON.stringify({ anonymousSaveReadStatus: rest.status, code: result?.code ?? null }));
} catch (error) { reportFailure(error); }
