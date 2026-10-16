-- Explicit revision-checked conflict decisions. No client table grants change.
create function cresum_private.get_completed_workout(p_workout_id text)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare owner_id uuid:=auth.uid(); result jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_workout_id is null then raise exception 'Invalid workout identity' using errcode='22023'; end if;
 select jsonb_build_object('workoutId',w.workout_id,'revision',w.revision,'deletedAt',w.deleted_at,
  'workout',case when w.deleted_at is null then cresum_private.read_history_workout(owner_id,w.workout_id) else null end)
 into result from public.completed_workouts w where w.user_id=owner_id and w.workout_id=p_workout_id;
 return result;
end $$;

create function cresum_private.resolve_completed_workout(
 p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,
 p_choice text,p_copy_id text,p_workout jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare owner_id uuid:=auth.uid(); fingerprint text; receipt cresum_private.workout_mutations%rowtype;
 root public.completed_workouts%rowtype; result jsonb; copy_result jsonb:=null;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_workout_id is null or p_mutation_id is null or btrim(p_mutation_id)=''
  or p_device_id is null or btrim(p_device_id)='' or p_expected_revision is null
  or p_expected_revision<1 or p_expected_revision>9007199254740991
  or p_choice is null or p_choice not in ('local','cloud','both') then
  raise exception 'Invalid resolution request' using errcode='22023';
 end if;
 if (p_choice='both' and (p_copy_id is null or btrim(p_copy_id)='' or p_copy_id=p_workout_id))
  or (p_choice<>'both' and p_copy_id is not null)
  or (p_choice='cloud' and p_workout is not null)
  or (p_choice<>'cloud' and (p_workout is null or not cresum_private.valid_history_workout(p_workout)
   or p_workout->>'workout_id' is distinct from p_workout_id)) then
  raise exception 'Invalid resolution content' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('kind','history_resolution','id',p_workout_id,
  'device',p_device_id,'revision',p_expected_revision,'choice',p_choice,'copy',p_copy_id,'workout',p_workout)::text,'UTF8')),'hex');
 select * into receipt from cresum_private.workout_mutations m where m.user_id=owner_id and m.mutation_id=p_mutation_id;
 if found then
  if receipt.request_hash<>fingerprint then raise exception 'Mutation ID reused' using errcode='22023'; end if;
  return receipt.result;
 end if;
 select * into root from public.completed_workouts w where w.user_id=owner_id and w.workout_id=p_workout_id for update;
 if not found or root.revision<>p_expected_revision or (p_choice='local' and root.deleted_at is not null) then
  raise exception 'History revision conflict' using errcode='40001';
 end if;
 if p_choice='local' then
  perform cresum_private.publish_completed_workout(p_workout_id,'resolution:'||p_mutation_id||':local',p_device_id,p_expected_revision,p_workout);
 elsif p_choice='both' then
  perform cresum_private.publish_completed_workout(p_copy_id,'resolution:'||p_mutation_id||':copy',p_device_id,null,
   jsonb_set(p_workout,'{workout_id}',to_jsonb(p_copy_id)));
  copy_result:=cresum_private.get_completed_workout(p_copy_id);
 end if;
 result:=jsonb_build_object('kind','history_resolution','original',cresum_private.get_completed_workout(p_workout_id),'copy',copy_result);
 insert into cresum_private.workout_mutations(user_id,mutation_id,request_hash,result) values(owner_id,p_mutation_id,fingerprint,result);
 return result;
end $$;

create function public.get_completed_workout(p_workout_id text)
returns jsonb language sql stable security invoker set search_path=pg_catalog as $$
 select cresum_private.get_completed_workout(p_workout_id)
$$;
create function public.resolve_completed_workout(p_workout_id text,p_mutation_id text,p_device_id text,
 p_expected_revision bigint,p_choice text,p_copy_id text,p_workout jsonb)
returns jsonb language sql security invoker set search_path=pg_catalog as $$
 select cresum_private.resolve_completed_workout(p_workout_id,p_mutation_id,p_device_id,p_expected_revision,p_choice,p_copy_id,p_workout)
$$;
revoke all on function cresum_private.get_completed_workout(text),
 cresum_private.resolve_completed_workout(text,text,text,bigint,text,text,jsonb),public.get_completed_workout(text),
 public.resolve_completed_workout(text,text,text,bigint,text,text,jsonb) from public,anon,authenticated;
grant execute on function cresum_private.get_completed_workout(text),
 cresum_private.resolve_completed_workout(text,text,text,bigint,text,text,jsonb),public.get_completed_workout(text),
 public.resolve_completed_workout(text,text,text,bigint,text,text,jsonb) to authenticated;
