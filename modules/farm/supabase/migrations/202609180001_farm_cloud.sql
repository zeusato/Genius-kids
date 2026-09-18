-- Làng Mầm account backups. Independent of the host application's tables.
begin;

create table public.farm_cloud_saves (
    owner_id uuid primary key references auth.users(id) on delete cascade,
    revision bigint not null check (revision > 0),
    state jsonb not null check (jsonb_typeof(state) = 'object'),
    previous_state jsonb,
    updated_at timestamptz not null default now()
);
create table public.farm_cloud_receipts (
    owner_id uuid not null references auth.users(id) on delete cascade,
    request_id uuid not null,
    payload_hash text not null,
    revision bigint not null,
    saved_at timestamptz not null,
    primary key (owner_id, request_id)
);
alter table public.farm_cloud_saves enable row level security;
alter table public.farm_cloud_receipts enable row level security;
revoke all on public.farm_cloud_saves from anon, authenticated;
revoke all on public.farm_cloud_receipts from anon, authenticated;
grant select (owner_id, revision, state, updated_at) on public.farm_cloud_saves to authenticated;
create policy farm_read_own_save on public.farm_cloud_saves for select to authenticated
    using ((select auth.uid()) = owner_id);
-- No receipt policies or direct write grants. All changes go through the guarded RPC.

create function public.farm_write_save(p_owner uuid, p_expected_revision bigint, p_request_id uuid, p_state jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    v_revision bigint;
    v_saved_at timestamptz;
    v_hash text;
    v_receipt public.farm_cloud_receipts%rowtype;
begin
    if auth.uid() is null or p_owner is distinct from auth.uid() then
        raise exception 'Account mismatch' using errcode = '42501';
    end if;
    if p_request_id is null or p_state is null or p_expected_revision < 1
       or jsonb_typeof(p_state) is distinct from 'object'
       or p_state->>'schema' is distinct from '2'
       or p_state->>'contentVersion' is distinct from '3'
       or jsonb_typeof(p_state->'entities') is distinct from 'array'
       or jsonb_typeof(p_state->'plots') is distinct from 'array'
       or jsonb_typeof(p_state->'inventory') is distinct from 'object'
       or jsonb_typeof(p_state->'world') is distinct from 'object'
       or octet_length(p_state::text) > 2097152 then
        raise exception 'Invalid farm snapshot' using errcode = '22023';
    end if;
    -- Serializes first-save creation as well as updates for this owner.
    perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 91825));
    v_hash := md5(p_state::text || ':' || coalesce(p_expected_revision::text, 'new'));
    select * into v_receipt from public.farm_cloud_receipts
        where owner_id = p_owner and request_id = p_request_id;
    if found then
        if v_receipt.payload_hash <> v_hash then
            raise exception 'Request id reused with different payload' using errcode = '22023';
        end if;
        return jsonb_build_object('owner_id', p_owner, 'revision', v_receipt.revision, 'updated_at', v_receipt.saved_at);
    end if;
    select revision into v_revision from public.farm_cloud_saves where owner_id = p_owner for update;
    if v_revision is distinct from p_expected_revision then
        raise exception 'Farm save changed on another device' using errcode = '40001';
    end if;
    v_revision := coalesce(v_revision, 0) + 1;
    v_saved_at := clock_timestamp();
    insert into public.farm_cloud_saves (owner_id, revision, state, updated_at)
        values (p_owner, v_revision, p_state, v_saved_at)
        on conflict (owner_id) do update set previous_state = farm_cloud_saves.state,
            state = excluded.state, revision = excluded.revision, updated_at = excluded.updated_at;
    insert into public.farm_cloud_receipts (owner_id, request_id, payload_hash, revision, saved_at)
        values (p_owner, p_request_id, v_hash, v_revision, v_saved_at);
    -- Older retry IDs safely fall back to the revision conflict, never duplicate progress.
    delete from public.farm_cloud_receipts where owner_id = p_owner and saved_at < now() - interval '90 days';
    return jsonb_build_object('owner_id', p_owner, 'revision', v_revision, 'updated_at', v_saved_at);
end;
$$;
revoke all on function public.farm_write_save(uuid, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.farm_write_save(uuid, bigint, uuid, jsonb) to authenticated;
commit;
