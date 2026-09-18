import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// DATABASE_URL is read only by this Node tool, never by Vite's public env loader.
export function databaseUrl() {
    let value = process.env.DATABASE_URL;
    for (const relative of ['../../../.env', '../../../.env.local', '../.env', '../.env.local']) {
        const path = fileURLToPath(new URL(relative, import.meta.url));
        if (!fs.existsSync(path)) continue;
        for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
            const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*?)\s*$/);
            if (match) value = match[1].replace(/^(['"])(.*)\1$/, '$2');
        }
    }
    if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error('DATABASE_URL is missing or is not a PostgreSQL URL.');
    return value;
}
export async function connectDatabase() {
    const connection = new URL(databaseUrl());
    // Enforce certificate validation even when a pasted URI says sslmode=require/disable.
    for (const key of ['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert']) connection.searchParams.delete(key);
    const client = new pg.Client({ connectionString: connection.toString(), connectionTimeoutMillis: 20000, statement_timeout: 30000,
        ssl: { rejectUnauthorized: true } });
    await client.connect(); return client;
}
export function reportFailure(error) {
    // Do not print driver objects, URLs or passwords (including malformed URL errors).
    console.error(`Database operation failed (${error?.code ?? error?.name ?? 'unknown'}). Credentials were not logged.`);
    process.exitCode = 1;
}
