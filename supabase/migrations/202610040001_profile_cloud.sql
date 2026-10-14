begin;

create table if not exists public.profile_cloud_saves (
    user_id uuid primary key references auth.users(id) on delete cascade,
    revision bigint not null check (revision > 0),
    payload jsonb not null,
    previous_payload jsonb,
    last_request_id uuid not null,
    updated_at timestamptz not null default now(),
    constraint profile_bundle_size check (octet_length(payload::text) <= 20971520)
);
alter table public.profile_cloud_saves enable row level security;
revoke all on public.profile_cloud_saves from public, anon, authenticated;
grant select on public.profile_cloud_saves to authenticated;
drop policy if exists profile_owner_read on public.profile_cloud_saves;
create policy profile_owner_read on public.profile_cloud_saves for select to authenticated
    using ((select auth.uid()) = user_id);

create or replace function public.save_profile_bundle(
    p_owner uuid, p_expected_revision bigint, p_request_id uuid, p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    saved public.profile_cloud_saves%rowtype;
begin
    if auth.uid() is null or auth.uid() is distinct from p_owner then
        raise exception 'Profile owner mismatch' using errcode = '42501';
    end if;
    if p_request_id is null or p_expected_revision is null or p_expected_revision < 0 then
        raise exception 'Invalid write request' using errcode = '22023';
    end if;
    if p_payload is null or jsonb_typeof(p_payload) <> 'object'
        or p_payload->>'version' is distinct from '1'
        or jsonb_typeof(p_payload->'profiles') is distinct from 'array'
        or jsonb_typeof(p_payload->'local') is distinct from 'object'
        or jsonb_typeof(p_payload->'databases') is distinct from 'array'
        or octet_length(p_payload::text) > 20971520 then
        raise exception 'Invalid profile bundle' using errcode = '22023';
    end if;
    if jsonb_array_length(p_payload->'profiles') > 100 then
        raise exception 'Too many profiles' using errcode = '22023';
    end if;
    -- Serializes the initial insert too, when no row exists to SELECT FOR UPDATE.
    perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 41004));
    select * into saved from public.profile_cloud_saves where user_id = p_owner for update;
    if found and saved.last_request_id = p_request_id then
        if saved.payload is distinct from p_payload or saved.revision <> p_expected_revision + 1 then
            raise exception 'Request ID reused with different content' using errcode = '22023';
        end if;
        return jsonb_build_object('revision', saved.revision, 'updated_at', saved.updated_at);
    end if;
    if coalesce(saved.revision, 0) <> p_expected_revision then
        raise exception 'Profile revision conflict' using errcode = '40001';
    end if;
    insert into public.profile_cloud_saves as current_save(user_id, revision, payload, previous_payload, last_request_id, updated_at)
        values (p_owner, 1, p_payload, null, p_request_id, now())
        on conflict (user_id) do update set revision = current_save.revision + 1,
            previous_payload = current_save.payload, payload = excluded.payload,
            last_request_id = excluded.last_request_id, updated_at = now()
        returning * into saved;
    return jsonb_build_object('revision', saved.revision, 'updated_at', saved.updated_at);
end;
$$;
revoke all on function public.save_profile_bundle(uuid, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_profile_bundle(uuid, bigint, uuid, jsonb) to authenticated;

comment on table public.profile_cloud_saves is 'Whole Genius Kids profile bundle. Owner reads only; writes use revision-checked RPC. Farm account saves remain separate.';
notify pgrst, 'reload schema';
commit;
