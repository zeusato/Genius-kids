-- SQL Editor (postgres). Fixtures and writes all roll back; no real profiles are touched.
begin;
create temporary table profile_checks (name text, result text) on commit drop;
grant insert, select on profile_checks to authenticated, anon;
select set_config('profile_test.a', gen_random_uuid()::text, true), set_config('profile_test.b', gen_random_uuid()::text, true);
insert into auth.users(id,email) values
    (current_setting('profile_test.a')::uuid, 'profile-test-' || current_setting('profile_test.a') || '@example.invalid'),
    (current_setting('profile_test.b')::uuid, 'profile-test-' || current_setting('profile_test.b') || '@example.invalid');
select set_config('request.jwt.claim.sub', current_setting('profile_test.a'), true);
set local role authenticated;
do $$
declare
    a uuid := current_setting('profile_test.a')::uuid;
    b uuid := current_setting('profile_test.b')::uuid;
    req uuid := gen_random_uuid();
    bundle jsonb := '{"version":1,"profiles":[],"local":{},"databases":[]}';
    first_result jsonb;
begin
    first_result := public.save_profile_bundle(a,0,req,bundle);
    assert first_result->>'revision' = '1', 'first write';
    insert into profile_checks values ('First save','PASS');
    assert public.save_profile_bundle(a,0,req,bundle) = first_result, 'retry';
    insert into profile_checks values ('Lost response retry is idempotent','PASS');
    begin
        perform public.save_profile_bundle(a,0,req,jsonb_set(bundle,'{profiles}','[{"id":"changed"}]'));
        raise exception 'FAIL changed request';
    exception when sqlstate '22023' then insert into profile_checks values ('Changed request ID rejected','PASS'); end;
    begin
        perform public.save_profile_bundle(a,0,gen_random_uuid(),bundle);
        raise exception 'FAIL stale revision';
    exception when sqlstate '40001' then insert into profile_checks values ('Concurrent stale revision rejected','PASS'); end;
    begin
        perform public.save_profile_bundle(b,0,gen_random_uuid(),bundle);
        raise exception 'FAIL wrong owner';
    exception when sqlstate '42501' then insert into profile_checks values ('Wrong owner rejected','PASS'); end;
    begin
        perform public.save_profile_bundle(a,1,gen_random_uuid(),'{}');
        raise exception 'FAIL invalid version';
    exception when sqlstate '22023' then insert into profile_checks values ('Invalid bundle rejected','PASS'); end;
    begin
        update public.profile_cloud_saves set revision=99 where user_id=a;
        raise exception 'FAIL direct write';
    exception when sqlstate '42501' then insert into profile_checks values ('Direct writes denied','PASS'); end;
    assert public.save_profile_bundle(a,1,gen_random_uuid(),jsonb_set(bundle,'{profiles}','[{"id":"new"}]'))->>'revision' = '2', 'second write';
    insert into profile_checks values ('Revision-checked update','PASS');
    assert (select previous_payload = bundle from public.profile_cloud_saves where user_id=a), 'backup';
    insert into profile_checks values ('Previous version preserved','PASS');
    begin
        perform public.save_profile_bundle(a,0,req,bundle);
        raise exception 'FAIL old retry after another write';
    exception when sqlstate '40001' then insert into profile_checks values ('Old retry cannot overwrite newer state','PASS'); end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('profile_test.b'),true);
set local role authenticated;
do $$
begin
    assert (select count(*) from public.profile_cloud_saves where user_id=current_setting('profile_test.a')::uuid)=0, 'RLS isolation';
    insert into profile_checks values ('Account B cannot read A','PASS');
    assert public.save_profile_bundle(current_setting('profile_test.b')::uuid,0,gen_random_uuid(),'{"version":1,"profiles":[],"local":{},"databases":[]}')->>'revision'='1', 'own save';
    insert into profile_checks values ('Account B can save own profile','PASS');
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$
begin
    begin
        perform * from public.profile_cloud_saves;
        raise exception 'FAIL anonymous read';
    exception when sqlstate '42501' then insert into profile_checks values ('Anonymous read denied','PASS'); end;
    begin
        perform public.save_profile_bundle(current_setting('profile_test.a')::uuid,2,gen_random_uuid(),'{}');
        raise exception 'FAIL anonymous write';
    exception when sqlstate '42501' then insert into profile_checks values ('Anonymous write denied','PASS'); end;
end $$;
reset role;
do $$ begin assert (select count(*) from profile_checks)=14, 'all checks ran'; end $$;
select name,result from profile_checks;
rollback;
