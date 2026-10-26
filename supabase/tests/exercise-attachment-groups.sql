begin;
insert into auth.users(id) values('55555555-5555-4555-8555-555555555555'),('66666666-6666-4666-8666-666666666666');
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
do $$
declare w jsonb; result jsonb; restored jsonb;
begin
 if public.get_equipment_group_capabilities()->>'historyGroups'<>'1' then raise exception 'missing group capability'; end if;
 w:=jsonb_build_object('workout_id','attachment-session','template_id','p','name','Pull','started_at_ms',0,'finished_at_ms',100,'current_exercise_index',0,'rest_duration_seconds',90,'rest_override_seconds',null,'program_slot',null,
 'exercises',jsonb_build_array(jsonb_build_object('exercise_index',0,'exercise_id','e','library_id','lat-pulldown-close-neutral-ergonomic-handle','name','Ergonomic','muscle','Lats','target',null,
 'exercise_group',jsonb_build_object('id','g','familyId','lat-pulldown','name','Pulldown'),
 'sets',jsonb_build_array(jsonb_build_object('set_index',0,'set_id','s','weight','45','reps','12','other_side_reps',null,'completed_at_ms',50)))));
 if not cresum_private.valid_history_workout(w) then raise exception 'valid grouped history rejected'; end if;
 result:=public.publish_completed_workout_v2('attachment-session','group-mutation','device',null,w);
 restored:=cresum_private.read_history_workout('55555555-5555-4555-8555-555555555555','attachment-session');
 if restored<>w then raise exception 'group history lost fields: %',restored; end if;
 if public.publish_completed_workout_v2('attachment-session','group-mutation','device',null,w)<>result then raise exception 'retry not idempotent'; end if;
 if cresum_private.valid_history_workout(jsonb_set(w,'{exercises,0,exercise_group,name}','""')) then raise exception 'empty group accepted'; end if;
 if cresum_private.valid_history_workout(jsonb_set(w,'{exercises,0,exercise_group}','[]')) then raise exception 'malformed group accepted'; end if;
 if not cresum_private.valid_history_workout(w#-'{exercises,0,exercise_group}') then raise exception 'legacy history rejected'; end if;
end $$;
set local role authenticated;
do $$ begin
 begin
  update public.completed_workout_exercises set exercise_group=null where workout_id='attachment-session';
  raise exception 'direct group mutation allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',true);
do $$ begin
 if public.get_completed_workout_v2('attachment-session') is not null then raise exception 'another owner saw group'; end if;
end $$;
reset role;
rollback;
