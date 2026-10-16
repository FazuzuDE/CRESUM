-- Disposable DB only, never fixture writes to a linked project.
begin;
set local plpgsql.check_asserts=on;
create function pg_temp.reject_resolution_copy() returns trigger language plpgsql as $$
begin
 if new.workout_id='rollback-copy' then raise exception 'Test copy write failure' using errcode='23514'; end if;
 return new;
end $$;
create trigger reject_resolution_copy before insert on public.completed_workouts
 for each row execute function pg_temp.reject_resolution_copy();
insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
declare
 w jsonb:='{"workout_id":"legacy","template_id":"old","name":"Cloud","started_at_ms":0,"finished_at_ms":10,"current_exercise_index":0,"rest_duration_seconds":90,"rest_override_seconds":null,"program_slot":null,"exercises":[]}';
 local_w jsonb; r jsonb; replay jsonb; before_feed jsonb;
begin
 perform public.publish_completed_workout('legacy','seed','phone',null,w);
 assert public.get_completed_workout('legacy')->'workout'=w,'Lookup lost snapshot';
 assert public.get_completed_workout('missing') is null,'Missing row leaked';
 local_w:=jsonb_set(w,'{name}','"Device"');
 before_feed:=public.pull_completed_workouts('0',100);
 begin
  perform public.resolve_completed_workout('legacy','stale','phone',2,'both','copy',local_w);
  raise exception 'Stale resolution accepted';
 exception when serialization_failure then null; end;
 assert public.get_completed_workout('copy') is null,'Stale choice created copy';
 assert public.pull_completed_workouts('0',100)=before_feed,'Stale choice changed feed';
 r:=public.resolve_completed_workout('legacy','both-1','phone',1,'both','copy',local_w);
 assert r->>'kind'='history_resolution','Wrong receipt kind';
 assert r->'original'->'workout'=w,'Both replaced cloud original';
 assert r->'copy'->'workout'=jsonb_set(local_w,'{workout_id}','"copy"'),'Both lost local copy';
 assert (select count(*)=2 from public.completed_workouts),'Both did not create exactly one copy';
 -- Later edits cannot change the exact saved response of the authorized decision.
 perform public.publish_completed_workout('legacy','later','other-phone',1,jsonb_set(w,'{name}','"Later cloud"'));
 replay:=public.resolve_completed_workout('legacy','both-1','phone',1,'both','copy',local_w);
 assert replay=r,'Retry changed selected snapshots';
 assert (select count(*)=2 from public.completed_workouts),'Retry duplicated copy';
 begin
  perform public.resolve_completed_workout('legacy','both-1','phone',1,'both','another-copy',local_w);
  raise exception 'Changed replay body accepted';
 exception when invalid_parameter_value then null; end;
 assert public.get_completed_workout('another-copy') is null,'Invalid replay created copy';
 r:=public.resolve_completed_workout('legacy','local-1','phone',2,'local',null,local_w);
 assert (r->'original'->>'revision')::bigint=3,'Local choice revision wrong';
 assert r->'original'->'workout'=local_w and r->'copy'='null'::jsonb,'Local choice changed content';
 before_feed:=public.pull_completed_workouts('0',100);
 r:=public.resolve_completed_workout('legacy','cloud-1','phone',3,'cloud',null,null);
 assert r->'original'->'workout'=local_w,'Cloud choice lost selected state';
 assert public.pull_completed_workouts('0',100)=before_feed,'Cloud choice mutated history';
 perform public.publish_completed_workout('legacy','delete','phone',3,null);
 begin
  perform public.resolve_completed_workout('legacy','revive','phone',4,'local',null,local_w);
  raise exception 'Deleted identity revived';
 exception when serialization_failure then null; end;
 r:=public.resolve_completed_workout('legacy','save-deleted-copy','phone',4,'both','kept-copy',local_w);
 assert r->'original'->'workout'='null'::jsonb,'Deleted original restored';
 assert r->'copy'->'workout'->>'workout_id'='kept-copy','Deleted copy missing';
 r:=public.resolve_completed_workout('legacy','accept-delete','phone',4,'cloud',null,null);
 assert r->'original'->'workout'='null'::jsonb,'Accept deletion returned live workout';
 begin
  perform public.resolve_completed_workout('legacy','collision','phone',4,'both','copy',local_w);
  raise exception 'Copy ID collision overwritten';
 exception when serialization_failure then null; end;
 assert public.get_completed_workout('copy')->'workout'->>'name'='Device','Collision overwrote history';
 before_feed:=public.pull_completed_workouts('0',100);
 begin
  perform public.resolve_completed_workout('legacy','rollback-resolution','phone',4,'both','rollback-copy',local_w);
  raise exception 'Failing copy committed';
 exception when check_violation then null; end;
 assert public.get_completed_workout('rollback-copy') is null,'Failed transaction left copy';
 assert public.pull_completed_workouts('0',100)=before_feed,'Failed transaction left feed change';
 -- Historical empty IDs and repeated nested IDs remain supported by resolution.
 w:=jsonb_set(w,'{workout_id}','""');
 w:=jsonb_set(w,'{exercises}','[{"exercise_index":0,"exercise_id":"same","library_id":"legacy","name":"Saved","muscle":"Back","target":null,"sets":[{"set_index":0,"set_id":"same","weight":"0","reps":"8","other_side_reps":null,"completed_at_ms":1},{"set_index":1,"set_id":"same","weight":"","reps":"","other_side_reps":null,"completed_at_ms":null}]},{"exercise_index":1,"exercise_id":"same","library_id":"legacy","name":"Saved 2","muscle":"Back","target":null,"sets":[]}]');
 perform public.publish_completed_workout('','empty-seed','phone',null,w);
 r:=public.resolve_completed_workout('','empty-both','phone',1,'both','empty-copy',w);
 assert r->'original'->>'workoutId'='','Legacy empty ID changed';
 assert r->'copy'->'workout'->'exercises'=w->'exercises','Repeated snapshots lost';
 begin
  perform public.resolve_completed_workout('legacy','bad','phone',4,null,null,null);
  raise exception 'Null choice accepted';
 exception when invalid_parameter_value then null; end;
 assert not has_function_privilege('anon','public.get_completed_workout(text)','execute'),'Anon lookup allowed';
 assert not has_function_privilege('anon','public.resolve_completed_workout(text,text,text,bigint,text,text,jsonb)','execute'),'Anon resolution allowed';
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
 assert public.get_completed_workout('legacy') is null,'Other-account lookup leaked';
 begin
  perform public.resolve_completed_workout('legacy','steal','b-phone',4,'cloud',null,null);
  raise exception 'Other owner resolved history';
 exception when serialization_failure then null; end;
 assert not exists(select 1 from public.completed_workouts),'Other-owner history appeared';
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 begin perform public.get_completed_workout('legacy');raise exception 'Unauthenticated lookup accepted';exception when invalid_authorization_specification then null;end;
 begin perform public.resolve_completed_workout('legacy','none','phone',1,'cloud',null,null);raise exception 'Unauthenticated resolve accepted';exception when invalid_authorization_specification then null;end;
end $$;
reset role;
do $$ begin
 assert not exists(select 1 from cresum_private.workout_mutations where mutation_id='rollback-resolution'),'Failed transaction left resolution receipt';
end $$;
rollback;
