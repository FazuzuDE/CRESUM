begin;
insert into auth.users(id) values('77777777-7777-4777-8777-777777777777');
select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
do $$
declare w jsonb; old_shape jsonb; page jsonb;
begin
 w:=jsonb_build_object('workout_id','versioned-group','template_id','p','name','Pull','started_at_ms',0,'finished_at_ms',100,'current_exercise_index',0,'rest_duration_seconds',90,'rest_override_seconds',null,'program_slot',null,
 'exercises',jsonb_build_array(jsonb_build_object('exercise_index',0,'exercise_id','e','library_id','lat-pulldown-close-neutral-ergonomic-handle','name','Ergonomic','muscle','Lats','target',null,'exercise_group',jsonb_build_object('id','g','familyId','lat-pulldown','name','Pulldown'),'sets',jsonb_build_array(jsonb_build_object('set_index',0,'set_id','s','weight','45','reps','12','other_side_reps',null,'completed_at_ms',50)))));
 begin perform public.publish_completed_workout('versioned-group','legacy-group','device',null,w);raise exception 'legacy published grouped payload';exception when feature_not_supported then null;end;
 perform public.publish_completed_workout_v2('versioned-group','new-client','device',null,w);
 if public.get_completed_workout_v2('versioned-group')->'workout'<>w then raise exception 'new reader lost group'; end if;
 page:=public.pull_completed_workouts_v2('0',50);
 if page->'changes'->0->'workout'<>w then raise exception 'new pull lost group'; end if;
 -- Pre-feature readers accept unknown fields but reconstruct children without them.
 -- The old endpoint must reject before such a decoder can persist a flattened copy.
 begin perform public.get_completed_workout('versioned-group');raise exception 'old get exposed new payload';exception when feature_not_supported then null;end;
 begin perform public.pull_completed_workouts('0',50);raise exception 'old pull exposed new payload';exception when feature_not_supported then null;end;
 if public.resolve_completed_workout_v2('versioned-group','new-resolution','device',1,'cloud',null,null)->'original'->'workout'<>w then raise exception 'new resolution lost group';end if;
 old_shape:=w#-'{exercises,0,exercise_group}';
 begin perform public.publish_completed_workout('versioned-group','old-write','device',1,old_shape);raise exception 'old write erased group';exception when feature_not_supported then null;end;
 begin perform public.resolve_completed_workout('versioned-group','old-resolution','device',1,'local',null,old_shape);raise exception 'old resolution erased group';exception when feature_not_supported then null;end;
 if public.get_completed_workout_v2('versioned-group')->'workout'<>w then raise exception 'rejected old client mutated group'; end if;
 -- The legacy protocol still handles ordinary workouts.
 old_shape:=jsonb_set(old_shape,'{workout_id}','"plain-workout"');
 perform public.publish_completed_workout('plain-workout','legacy-new','device',null,old_shape);
 if public.get_completed_workout('plain-workout')->'workout'<>old_shape then raise exception 'legacy workflow regressed';end if;
end $$;
rollback;
