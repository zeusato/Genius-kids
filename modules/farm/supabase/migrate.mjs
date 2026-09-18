import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { connectDatabase, reportFailure } from './database.mjs';

let client;
try {
    client = await connectDatabase();
    await client.query('begin');
    await client.query('select pg_advisory_xact_lock(918250001)');
    await client.query('create table if not exists public.farm_schema_migrations (version text primary key, sha256 text not null, applied_at timestamptz not null default now())');
    await client.query('revoke all on public.farm_schema_migrations from public, anon, authenticated');
    await client.query('alter table public.farm_schema_migrations enable row level security');
    const version = '202609180001_farm_cloud';
    const sql = (await fs.readFile(new URL(`migrations/${version}.sql`, import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
    const hash = createHash('sha256').update(sql).digest('hex');
    const old = await client.query('select sha256 from public.farm_schema_migrations where version=$1', [version]);
    if (old.rows.length) {
        if (old.rows[0].sha256 !== hash) throw new Error('Applied migration checksum differs. Create a new migration.');
        console.log('Farm migration already applied; checksum matches.');
    } else {
        await client.query(sql.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, ''));
        await client.query('insert into public.farm_schema_migrations(version,sha256) values ($1,$2)', [version, hash]);
        console.log('Farm tables, owner-only reads and guarded save RPC created.');
    }
    await client.query("notify pgrst, 'reload schema'");
    await client.query('commit');
} catch (error) { if (client) await client.query('rollback').catch(() => {}); reportFailure(error); }
finally { await client?.end(); }
