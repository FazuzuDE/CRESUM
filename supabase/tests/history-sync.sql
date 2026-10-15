-- Isolated test database only. No fixture users may be created remotely.
begin;
set local plpgsql.check_asserts = on;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
create function pg_temp.reject_test_set() returns trigger language plpgsql as $$
begin
 if new.weight = 'force-rollback' then raise exception 'Test write failure' using errcode='23514'; end if;
 return new;
end $$;
create trigger force_aggregate_rollback before insert on public.completed_workout_sets
 for each row execute function pg_temp.reject_test_set();
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
declare
 w jsonb := '{"workout_id":"legacy","template_id":"old","name":"Saved","started_at_ms":0,"finished_at_ms":1000.5,"current_exercise_index":0,"rest_duration_seconds":1e20,"rest_override_seconds":0,"program_slot":null,"exercises":[{"exercise_index":0,"exercise_id":"same","library_id":"variant","name":"Original","muscle":"Back","target":null,"sets":[{"set_index":0,"set_id":"same","weight":"0","reps":"10","other_side_reps":"8","completed_at_ms":0.25},{"set_index":1,"set_id":"same","weight":"","reps":"","other_side_reps":null,"completed_at_ms":null}]},{"exercise_index":1,"exercise_id":"same","library_id":"variant","name":"Second","muscle":"Back","target":null,"sets":[]}]}';
 r jsonb; first_result jsonb; updated jsonb; page jsonb; first_cursor text; second_cursor text;
begin
 w := jsonb_set(w,'{program_slot}','{"assignmentId":"saved","weekIndex":0,"slotIndex":1,"date":"2026-10-15"}');
 w := jsonb_set(w,'{exercises,0,target}','{"repMin":8,"repMax":12,"restMin":60,"restMax":90,"programId":"old","revision":1,"sourceRefs":["ref"],"perSide":true}');
 begin
  perform public.publish_completed_workout('legacy','m1','bad-year-device',null,
   jsonb_set(w,'{program_slot,date}','"0099-01-01"'));
  raise exception 'Core-invalid program year accepted';
 exception when invalid_parameter_value then null; end;
 assert not exists(select 1 from public.completed_workouts), 'Invalid date left a root';
 assert not exists(select 1 from public.sync_devices), 'Invalid date left a device';
 assert public.pull_completed_workouts('0',100)->'changes'='[]'::jsonb, 'Invalid date left a feed entry';
 -- The exact supported Core lower boundary must also survive publication.
 w := jsonb_set(w,'{program_slot,date}','"0100-01-01"');
 first_result := public.publish_completed_workout('legacy','m1','phone',null,w);
 assert (first_result->>'revision')::bigint=1, 'Initial revision wrong';
 assert exists(select 1 from pg_locks where locktype='advisory' and pid=pg_backend_pid() and granted), 'Owner transaction lock missing';
 first_cursor := first_result->>'changeSequence';
 r := public.publish_completed_workout('legacy','m1','phone',null,w);
 assert r=first_result, 'Server-success retry changed result';
 assert (select count(*)=1 from public.completed_workouts), 'Retry duplicated root';
 assert (select count(*)=2 from public.completed_workout_exercises), 'Nested repeated IDs lost';
 assert (select count(*)=2 from public.completed_workout_sets), 'Repeated sets lost';
 page := public.pull_completed_workouts('0',1);
 assert page->'changes'->0->'workout'=w, 'Lossless aggregate round trip failed';
 assert page->>'cursor'=first_cursor and page->>'hasMore'='false', 'Replay added another feed entry';
 begin
  perform public.publish_completed_workout('legacy','m1','phone',null,jsonb_set(w,'{name}','"forged replay"'));
  raise exception 'Mutation ID reuse with changed request accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.publish_completed_workout('legacy','stale','phone',2,w);
  raise exception 'Stale revision accepted';
 exception when serialization_failure then null; end;
 -- Inject a failure after the root/device write and child replacement begins.
 begin
  perform public.publish_completed_workout('legacy','failed','failed-device',1,
    jsonb_set(w,'{exercises,0,sets,1,weight}','"force-rollback"'));
  raise exception 'Expected aggregate failure';
 exception when check_violation then null; end;
 assert (select revision=1 and name='Saved' from public.completed_workouts), 'Partial root committed';
 assert (select count(*)=2 from public.completed_workout_sets), 'Partial children committed';
 assert not exists(select 1 from public.sync_devices where device_id='failed-device'), 'Partial device committed';
 assert (public.pull_completed_workouts('0',100)->'changes')=page->'changes', 'Failed write committed feed';
 updated := jsonb_set(w,'{name}','"Changed"');
 r := public.publish_completed_workout('legacy','failed','phone',1,updated);
 assert (r->>'revision')::bigint=2, 'Failed receipt blocked valid retry';
 second_cursor := r->>'changeSequence';
 assert public.publish_completed_workout('legacy','m1','phone',null,w)=first_result, 'Old replay failed after later edit';
 assert (select name='Changed' and revision=2 from public.completed_workouts), 'Old replay overwrote newer data';
 page := public.pull_completed_workouts('0',1);
 assert page->>'hasMore'='true' and page->>'cursor'=first_cursor, 'First page cursor wrong';
 assert (page->'changes'->0->>'revision')::bigint=2 and page->'changes'->0->'workout'=updated, 'Feed must return coherent current snapshot';
 page := public.pull_completed_workouts(first_cursor,1);
 assert page->>'cursor'=second_cursor and page->>'hasMore'='false', 'Second page wrong';
 begin
  perform public.publish_completed_workout('bad','bad','bad-device',null,jsonb_set(w,'{workout_id}','"different"'));
  raise exception 'Mismatched identity accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.publish_completed_workout('legacy','bad-shape','phone',2,jsonb_set(w,'{exercises,0,sets,0,weight}','0'));
  raise exception 'Non-string historical weight accepted';
 exception when invalid_parameter_value then null; end;
 begin
  update public.completed_workouts set name='bypass',revision=3;
  raise exception 'Direct root mutation bypasses feed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.completed_workout_sets values(auth.uid(),'legacy',0,9,'x','1','1',null,null);
  raise exception 'Direct child mutation bypasses feed';
 exception when insufficient_privilege then null; end;
 -- Same IDs and mutation IDs belong to different owners.
 perform set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
 assert not exists(select 1 from public.completed_workouts), 'Other owner root leaked';
 assert public.pull_completed_workouts('0',100)->'changes'='[]'::jsonb, 'Other owner feed leaked';
 r := public.publish_completed_workout('legacy','m1','phone',null,w);
 assert (r->>'revision')::bigint=1, 'Other owner receipt leaked';
 perform set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
 assert jsonb_array_length(public.pull_completed_workouts('0',100)->'changes')=2, 'Owner feed contaminated';
 r := public.publish_completed_workout('legacy','delete','phone',2,null);
 assert (r->>'revision')::bigint=3, 'Tombstone revision wrong';
 assert public.publish_completed_workout('legacy','delete','phone',2,null)=r, 'Delete replay changed result';
 page := public.pull_completed_workouts(second_cursor,100);
 assert jsonb_array_length(page->'changes')=1 and page->'changes'->0->'workout'='null'::jsonb
   and page->'changes'->0->>'deletedAt' is not null, 'Tombstone omitted';
 begin
  perform public.publish_completed_workout('legacy','resurrect','phone',3,w);
  raise exception 'Tombstone resurrected';
 exception when serialization_failure then null; end;
 begin
  perform public.pull_completed_workouts('01',1);
  raise exception 'Noncanonical cursor accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.pull_completed_workouts('0',101);
  raise exception 'Unbounded page accepted';
 exception when invalid_parameter_value then null; end;
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform public.pull_completed_workouts('0',1);
  raise exception 'Unsigned pull accepted';
 exception when invalid_authorization_specification then null; end;
 begin
  perform public.publish_completed_workout('unsigned','unsigned','phone',null,w);
  raise exception 'Unsigned publish accepted';
 exception when invalid_authorization_specification then null; end;
end $$;
reset role;
-- Cursor precision beyond Number.MAX_SAFE_INTEGER, using disposable sequence only.
select setval(pg_get_serial_sequence('cresum_private.workout_changes','sequence'),9007199254740992,true);
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare r jsonb; page jsonb; begin
 r := public.publish_completed_workout('big','big','phone',null,
  '{"workout_id":"big","template_id":"old","name":"Big","started_at_ms":0,"finished_at_ms":0,"current_exercise_index":0,"rest_duration_seconds":1.7976931348623157e308,"rest_override_seconds":null,"program_slot":null,"exercises":[]}');
 assert r->>'changeSequence'='9007199254740993', 'Bigint receipt rounded';
 page := public.pull_completed_workouts('9007199254740992',1);
 assert page->>'cursor'='9007199254740993' and page->'changes'->0->>'sequence'='9007199254740993', 'Bigint pull rounded';
 assert public.pull_completed_workouts('9007199254740993',1)->>'cursor'='9007199254740993', 'Empty page regressed cursor';
end $$;
set local role anon;
do $$ begin
 begin perform public.pull_completed_workouts('0',1); raise exception 'Anon pull permitted';
 exception when insufficient_privilege then null; end;
 begin perform public.publish_completed_workout('x','x','x',null,null); raise exception 'Anon publish permitted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 assert not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('publish_completed_workout','pull_completed_workouts') and p.prosecdef), 'Privileged public RPC';
 assert not has_table_privilege('authenticated','cresum_private.workout_mutations','select'), 'Receipts exposed';
 assert not has_table_privilege('authenticated','cresum_private.workout_changes','insert'), 'Feed writable';
end $$;
rollback;
