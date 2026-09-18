-- Run in Supabase SQL Editor as postgres. Everything created by this test is rolled back.
begin;
create temporary table farm_test_results (name text, result text) on commit drop;
grant insert, select on farm_test_results to authenticated, anon;
select set_config('farm_test.a', gen_random_uuid()::text, true),
       set_config('farm_test.b', gen_random_uuid()::text, true);
insert into auth.users(id,email) values
    (current_setting('farm_test.a')::uuid, 'farm-test-' || current_setting('farm_test.a') || '@example.invalid'),
    (current_setting('farm_test.b')::uuid, 'farm-test-' || current_setting('farm_test.b') || '@example.invalid');
select set_config('request.jwt.claim.sub', current_setting('farm_test.a'), true);
set local role authenticated;
do $$
declare
    a uuid := current_setting('farm_test.a')::uuid;
    b uuid := current_setting('farm_test.b')::uuid;
    request uuid := gen_random_uuid();
    snapshot jsonb := '{"schema":2,"contentVersion":3,"entities":[],"plots":[],"inventory":{},"world":{},"coins":100}';
    first_result jsonb;
    next_result jsonb;
begin
    first_result := public.farm_write_save(a,null,request,snapshot);
    assert first_result->>'revision' = '1', 'first write';
    insert into farm_test_results values ('First save', 'PASS');
    assert public.farm_write_save(a,null,request,snapshot) = first_result, 'retry';
    insert into farm_test_results values ('Same request retry', 'PASS');
    begin
        perform public.farm_write_save(a,null,request,jsonb_set(snapshot,'{coins}','101'));
        raise exception 'FAIL changed retry';
    exception when sqlstate '22023' then insert into farm_test_results values ('Changed retry rejected','PASS'); end;
    begin
        perform public.farm_write_save(a,null,gen_random_uuid(),snapshot);
        raise exception 'FAIL stale revision';
    exception when sqlstate '40001' then insert into farm_test_results values ('Stale revision rejected','PASS'); end;
    begin
        perform public.farm_write_save(b,null,gen_random_uuid(),snapshot);
        raise exception 'FAIL wrong owner';
    exception when sqlstate '42501' then insert into farm_test_results values ('Wrong owner rejected','PASS'); end;
    begin
        perform public.farm_write_save(a,1,gen_random_uuid(),jsonb_set(snapshot,'{schema}','99'));
        raise exception 'FAIL schema validation';
    exception when sqlstate '22023' then insert into farm_test_results values ('Invalid schema rejected','PASS'); end;
    begin
        update public.farm_cloud_saves set revision=99 where owner_id=a;
        raise exception 'FAIL direct update';
    exception when sqlstate '42501' then insert into farm_test_results values ('Direct update denied','PASS'); end;
    begin
        perform * from public.farm_cloud_receipts where owner_id=a;
        raise exception 'FAIL receipt access';
    exception when sqlstate '42501' then insert into farm_test_results values ('Receipt read denied','PASS'); end;
    next_result := public.farm_write_save(a,1,gen_random_uuid(),jsonb_set(snapshot,'{coins}','105'));
    assert next_result->>'revision' = '2', 'second write';
    insert into farm_test_results values ('CAS update', 'PASS');
    assert public.farm_write_save(a,null,request,snapshot) = first_result, 'old retry after update';
    insert into farm_test_results values ('Old receipt stays stable', 'PASS');
end $$;
reset role;
select set_config('request.jwt.claim.sub', current_setting('farm_test.b'), true);
set local role authenticated;
do $$
declare
    a uuid := current_setting('farm_test.a')::uuid;
    b uuid := current_setting('farm_test.b')::uuid;
    snapshot jsonb := '{"schema":2,"contentVersion":3,"entities":[],"plots":[],"inventory":{},"world":{},"coins":100}';
begin
    assert (select count(*) from public.farm_cloud_saves where owner_id=a) = 0, 'RLS isolation';
    insert into farm_test_results values ('Other account cannot read save','PASS');
    assert public.farm_write_save(b,null,gen_random_uuid(),snapshot)->>'revision' = '1', 'second account';
    insert into farm_test_results values ('Second account own save','PASS');
    begin
        perform public.farm_write_save(a,2,gen_random_uuid(),snapshot);
        raise exception 'FAIL cross account overwrite';
    exception when sqlstate '42501' then insert into farm_test_results values ('Cross account overwrite denied','PASS'); end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$
begin
    begin
        perform owner_id from public.farm_cloud_saves;
        raise exception 'FAIL anonymous read';
    exception when sqlstate '42501' then insert into farm_test_results values ('Anonymous read denied','PASS'); end;
    begin
        perform public.farm_write_save(current_setting('farm_test.a')::uuid,2,gen_random_uuid(),'{}');
        raise exception 'FAIL anonymous write';
    exception when sqlstate '42501' then insert into farm_test_results values ('Anonymous write denied','PASS'); end;
end $$;
reset role;
do $$
begin
    assert (select state->>'coins'='105' and previous_state->>'coins'='100'
        from public.farm_cloud_saves where owner_id=current_setting('farm_test.a')::uuid), 'previous backup';
    insert into farm_test_results values ('Previous snapshot preserved','PASS');
    assert (select count(*) from farm_test_results) = 16, 'all checks completed';
end $$;
select name, result from farm_test_results;
rollback;
