-- Disposable DB only. Never execute fixtures against a linked project.
begin;
set local plpgsql.check_asserts=on;
insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
declare w jsonb:='{"workout_id":"same-id","template_id":"old","name":"A","started_at_ms":0,"finished_at_ms":10,"current_exercise_index":0,"rest_duration_seconds":90,"rest_override_seconds":null,"program_slot":null,"exercises":[{"exercise_index":0,"exercise_id":"exercise","library_id":"bench","name":"Bench Press","muscle":"Chest","target":null,"sets":[{"set_index":0,"set_id":"set","weight":"60","reps":"8","other_side_reps":null,"completed_at_ms":1}]}]}';
begin
 perform public.publish_completed_workout('same-id','seed','phone',null,w);
 perform public.resolve_completed_workout('same-id','both','phone',1,'both','copy',jsonb_set(w,'{name}','"Local A"'));
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$
declare w jsonb:='{"workout_id":"same-id","template_id":"old","name":"B","started_at_ms":0,"finished_at_ms":10,"current_exercise_index":0,"rest_duration_seconds":90,"rest_override_seconds":null,"program_slot":null,"exercises":[{"exercise_index":0,"exercise_id":"exercise","library_id":"bench","name":"Bench Press","muscle":"Chest","target":null,"sets":[{"set_index":0,"set_id":"set","weight":"80","reps":"5","other_side_reps":null,"completed_at_ms":1}]}]}';
begin
 perform public.publish_completed_workout('same-id','seed','phone',null,w);
 perform public.resolve_completed_workout('same-id','both','phone',1,'both','copy',jsonb_set(w,'{name}','"Local B"'));
 begin
  delete from auth.users where id='22222222-2222-4222-8222-222222222222';
  raise exception 'Authenticated client deleted Auth user';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  delete from auth.users where id='11111111-1111-4111-8111-111111111111';
  raise exception 'Anonymous client deleted Auth user';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Snapshot every B row, including receipt payloads, before deleting A.
create temporary table account_b_before(relation text primary key, rows jsonb);
do $$ declare relation_name text; snapshot jsonb; begin
 foreach relation_name in array array['public.sync_devices','public.completed_workouts','public.completed_workout_exercises','public.completed_workout_sets','cresum_private.workout_changes','cresum_private.workout_mutations'] loop
  execute format('select jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text) from %s t where user_id=$1',relation_name)
   into snapshot using '22222222-2222-4222-8222-222222222222'::uuid;
  assert snapshot is not null,'Missing B deletion fixture';
  insert into account_b_before values(relation_name,snapshot);
  execute format('select jsonb_agg(to_jsonb(t)) from %s t where user_id=$1',relation_name)
   into snapshot using '11111111-1111-4111-8111-111111111111'::uuid;
  assert snapshot is not null,'Missing A deletion fixture';
 end loop;
end $$;
-- Simulates Auth admin hard deletion and its real DB cascades in one statement.
delete from auth.users where id='11111111-1111-4111-8111-111111111111';
do $$ declare relation_name text; actual jsonb; expected jsonb; remaining bigint; begin
 assert not exists(select 1 from auth.users where id='11111111-1111-4111-8111-111111111111'),'A Auth record survived';
 assert exists(select 1 from auth.users where id='22222222-2222-4222-8222-222222222222'),'B Auth record deleted';
 foreach relation_name in array array['public.sync_devices','public.completed_workouts','public.completed_workout_exercises','public.completed_workout_sets','cresum_private.workout_changes','cresum_private.workout_mutations'] loop
  execute format('select count(*) from %s where user_id=$1',relation_name)
   into remaining using '11111111-1111-4111-8111-111111111111'::uuid;
  assert remaining=0,'Deleted owner data survived in '||relation_name;
  execute format('select jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text) from %s t where user_id=$1',relation_name)
   into actual using '22222222-2222-4222-8222-222222222222'::uuid;
  select rows into expected from account_b_before b where b.relation=relation_name;
  assert actual=expected,'Other account changed in '||relation_name;
 end loop;
end $$;
-- A still-unexpired JWT subject cannot repopulate its deleted account.
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
declare w jsonb:='{"workout_id":"after-delete","template_id":"old","name":"A","started_at_ms":0,"finished_at_ms":10,"current_exercise_index":0,"rest_duration_seconds":90,"rest_override_seconds":null,"program_slot":null,"exercises":[]}';
begin
 assert public.get_completed_workout('same-id') is null,'A read retained private history';
 begin
  perform public.publish_completed_workout('after-delete','late','new-phone',null,w);
  raise exception 'Deleted account recreated cloud data';
 exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
 assert public.get_completed_workout('same-id')->'workout'->>'name'='B','B lost normal access';
end $$;
reset role;
rollback;
