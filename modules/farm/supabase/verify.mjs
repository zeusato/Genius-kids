import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { connectDatabase, reportFailure } from './database.mjs';

let client, checks = 0;
try {
    if (process.argv.includes('--local')) {
        const { PGlite } = await import('@electric-sql/pglite');
        const db = new PGlite();
        await db.exec(`create role anon; create role authenticated; create schema auth;
            create table auth.users(id uuid primary key, email text);
            create function auth.uid() returns uuid language sql stable as
                'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
            grant usage on schema public, auth to anon, authenticated;`);
        await db.exec(await readFile(new URL('migrations/202609180001_farm_cloud.sql', import.meta.url), 'utf8'));
        client = { query: (sql, values) => db.query(sql, values), end: () => db.close() };
        console.log('Verifying in embedded PostgreSQL; no Supabase connection or deployment.');
    } else client = await connectDatabase();
    await client.query('begin');
    // Temporary identities exist only in this transaction: no email and no persistent accounts.
    const a = randomUUID(), b = randomUUID(), request = randomUUID();
    await client.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [a, `farm-test-${a}@example.invalid`, b, `farm-test-${b}@example.invalid`]);
    const snapshot = { schema: 2, contentVersion: 3, entities: [], plots: [], inventory: {}, world: {}, coins: 100 };
    async function identity(id, role = 'authenticated') {
        await client.query('reset role');
        await client.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
        await client.query(role === 'anon' ? 'set local role anon' : 'set local role authenticated');
    }
    async function rejects(code, query, args) {
        await client.query('savepoint denied_operation');
        let actual;
        try { await client.query(query, args); } catch (error) { actual = error.code; }
        await client.query('rollback to savepoint denied_operation');
        assert.equal(actual, code); checks++;
    }
    const rpc = 'select public.farm_write_save($1,$2,$3,$4::jsonb) as result';
    await identity(a);
    const first = (await client.query(rpc, [a, null, request, snapshot])).rows[0].result;
    assert.equal(first.revision, 1); checks++;
    assert.deepEqual((await client.query(rpc, [a, null, request, snapshot])).rows[0].result, first); checks++;
    await rejects('22023', rpc, [a, null, request, { ...snapshot, coins: 101 }]);
    await rejects('40001', rpc, [a, null, randomUUID(), snapshot]);
    await rejects('42501', rpc, [b, null, randomUUID(), snapshot]);
    await rejects('22023', rpc, [a, 1, randomUUID(), { ...snapshot, schema: 99 }]);
    await rejects('42501', 'update public.farm_cloud_saves set revision=99 where owner_id=$1', [a]);
    await rejects('42501', 'select * from public.farm_cloud_receipts where owner_id=$1', [a]);
    const second = (await client.query(rpc, [a, 1, randomUUID(), { ...snapshot, coins: 105 }])).rows[0].result;
    assert.equal(second.revision, 2); checks++;
    // Old acknowledgement stays stable even when a newer save exists.
    assert.deepEqual((await client.query(rpc, [a, null, request, snapshot])).rows[0].result, first); checks++;
    await identity(b);
    assert.equal((await client.query('select owner_id,revision,state,updated_at from public.farm_cloud_saves where owner_id=$1', [a])).rows.length, 0); checks++;
    assert.equal((await client.query(rpc, [b, null, randomUUID(), snapshot])).rows[0].result.revision, 1); checks++;
    await rejects('42501', rpc, [a, 2, randomUUID(), snapshot]);
    await identity('', 'anon');
    await rejects('42501', 'select owner_id from public.farm_cloud_saves');
    await rejects('42501', rpc, [a, 2, randomUUID(), snapshot]);
    await client.query('reset role');
    const stored = (await client.query('select state,previous_state from public.farm_cloud_saves where owner_id=$1', [a])).rows[0];
    assert.equal(stored.state.coins, 105); assert.equal(stored.previous_state.coins, 100); checks++;
    await client.query('rollback');
    console.log(`${checks} database checks passed: RLS, owner guard, CAS, idempotency, validation, previous backup. All test users and saves rolled back.`);
} catch (error) { if (client) await client.query('rollback').catch(() => {}); reportFailure(error); }
finally { await client?.end(); }
