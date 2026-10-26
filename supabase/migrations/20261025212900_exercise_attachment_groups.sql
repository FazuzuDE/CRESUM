-- Prepared locally; deployment and Edge activation require separate review.
-- Existing RLS, owner predicates, idempotency receipts and RPC grants remain.
create function cresum_private.valid_exercise_group(g jsonb)
returns boolean language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare k text;
begin
 if g is null then return true; end if;
 if jsonb_typeof(g) is distinct from 'object' then return false; end if;
 if exists(select 1 from jsonb_object_keys(g) x where x not in ('id','familyId','name')) then return false; end if;
 foreach k in array array['id','familyId','name'] loop
  if jsonb_typeof(g->k) is distinct from 'string' or length(btrim(g->>k))=0 or length(g->>k)>160 then return false; end if;
 end loop;
 return true;
end $$;
alter table public.completed_workout_exercises add column exercise_group jsonb
 check(cresum_private.valid_exercise_group(exercise_group));

-- Preserve the latest authored-target validation as the base rather than copying
-- an older validator that would reject shared-plan targets.
alter function cresum_private.valid_history_workout(jsonb) rename to valid_history_workout_without_groups;
create function cresum_private.valid_history_workout(w jsonb)
returns boolean language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare e jsonb; g jsonb; previous text:=null; closed text[]:=array[]::text[]; known jsonb:='{}'::jsonb; identities text[]:=array[]::text[]; gid text; key text;
begin
 if not cresum_private.valid_history_workout_without_groups(w) then return false; end if;
 for e in select value from jsonb_array_elements(w->'exercises') loop
  g:=nullif(e->'exercise_group','null'::jsonb);gid:=g->>'id';
  if not cresum_private.valid_exercise_group(g) then return false; end if;
  if previous is not null and previous is distinct from gid then closed:=array_append(closed,previous); end if;
  previous:=gid;
  if g is null then continue; end if;
  if gid=any(closed) or jsonb_array_length(e->'sets') not between 1 and 20 then return false; end if;
  if known ? gid and known->gid<>g then return false; end if;
  known:=known||jsonb_build_object(gid,g);
  key:=jsonb_build_array(gid,e->>'library_id')::text;
  if key=any(identities) then return false; end if;
  identities:=array_append(identities,key);
 end loop;
 return true;
end $$;

create or replace function cresum_private.read_history_workout(owner_id uuid, entity_id text)
returns jsonb language sql stable security invoker set search_path=pg_catalog as $$
 select jsonb_build_object(
  'workout_id',w.workout_id,'template_id',w.template_id,'name',w.name,
  'started_at_ms',w.started_at_ms,'finished_at_ms',w.finished_at_ms,
  'current_exercise_index',w.current_exercise_index,'rest_duration_seconds',w.rest_duration_seconds,
  'rest_override_seconds',w.rest_override_seconds,'program_slot',w.program_slot,
  'exercises',coalesce((select jsonb_agg(jsonb_build_object(
   'exercise_index',e.exercise_index,'exercise_id',e.exercise_id,'library_id',e.library_id,
   'name',e.name,'muscle',e.muscle,'target',e.target,
   'sets',coalesce((select jsonb_agg(jsonb_build_object(
    'set_index',s.set_index,'set_id',s.set_id,'weight',s.weight,'reps',s.reps,
    'other_side_reps',s.other_side_reps,'completed_at_ms',s.completed_at_ms) order by s.set_index)
    from public.completed_workout_sets s where s.user_id=e.user_id and s.workout_id=e.workout_id and s.exercise_index=e.exercise_index),'[]'::jsonb)) || case when e.exercise_group is null then '{}'::jsonb else jsonb_build_object('exercise_group',e.exercise_group) end order by e.exercise_index)
   from public.completed_workout_exercises e where e.user_id=w.user_id and e.workout_id=w.workout_id),'[]'::jsonb))
 from public.completed_workouts w where w.user_id=owner_id and w.workout_id=entity_id
$$;

create or replace function cresum_private.publish_completed_workout(
 p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,p_workout jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare
 owner_id uuid:=auth.uid(); fingerprint text; receipt cresum_private.workout_mutations%rowtype;
 current_root public.completed_workouts%rowtype; next_revision bigint; change_id bigint;
 e jsonb; s jsonb; result jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_workout_id is null or p_mutation_id is null or btrim(p_mutation_id)='' or p_device_id is null or btrim(p_device_id)=''
  or (p_expected_revision is not null and (p_expected_revision<1 or p_expected_revision>9007199254740991))
  or (p_workout is null and p_expected_revision is null) then
  raise exception 'Invalid history request' using errcode='22023';
 end if;
 if p_workout is not null and (not cresum_private.valid_history_workout(p_workout)
  or p_workout->>'workout_id' is distinct from p_workout_id) then
  raise exception 'Invalid history snapshot' using errcode='22023';
 end if;
 -- Held until transaction commit: same-owner sequence allocation follows commit order.
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('id',p_workout_id,'device',p_device_id,
  'revision',p_expected_revision,'workout',p_workout)::text,'UTF8')),'hex');
 select * into receipt from cresum_private.workout_mutations m where m.user_id=owner_id and m.mutation_id=p_mutation_id;
 if found then
  if receipt.request_hash<>fingerprint then raise exception 'Mutation ID reused' using errcode='22023'; end if;
  return receipt.result;
 end if;
 select * into current_root from public.completed_workouts w where w.user_id=owner_id and w.workout_id=p_workout_id for update;
 if found then
  if current_root.revision is distinct from p_expected_revision or current_root.deleted_at is not null then
   raise exception 'History revision conflict' using errcode='40001';
  end if;
  next_revision:=current_root.revision+1;
 else
  if p_expected_revision is not null or p_workout is null then raise exception 'History revision conflict' using errcode='40001'; end if;
  next_revision:=1;
 end if;
 insert into public.sync_devices(user_id,device_id) values(owner_id,p_device_id) on conflict(user_id,device_id) do nothing;
 if p_workout is null then
  update public.completed_workouts set revision=next_revision,deleted_at=clock_timestamp()
   where user_id=owner_id and workout_id=p_workout_id;
 else
  insert into public.completed_workouts(user_id,workout_id,source_device_id,name,template_id,started_at_ms,finished_at_ms,
   current_exercise_index,rest_duration_seconds,rest_override_seconds,program_slot,revision)
  values(owner_id,p_workout_id,p_device_id,p_workout->>'name',p_workout->>'template_id',
   (p_workout->>'started_at_ms')::float8,(p_workout->>'finished_at_ms')::float8,(p_workout->>'current_exercise_index')::integer,
   (p_workout->>'rest_duration_seconds')::float8,(p_workout->>'rest_override_seconds')::float8,nullif(p_workout->'program_slot','null'::jsonb),1)
  -- INSERT triggers require revision 1 before conflict resolution; UPDATE uses the checked next revision.
  on conflict(user_id,workout_id) do update set
   name=excluded.name,template_id=excluded.template_id,started_at_ms=excluded.started_at_ms,finished_at_ms=excluded.finished_at_ms,
   current_exercise_index=excluded.current_exercise_index,rest_duration_seconds=excluded.rest_duration_seconds,
   rest_override_seconds=excluded.rest_override_seconds,program_slot=excluded.program_slot,revision=next_revision;
  delete from public.completed_workout_exercises where user_id=owner_id and workout_id=p_workout_id;
  for e in select value from jsonb_array_elements(p_workout->'exercises') loop
   insert into public.completed_workout_exercises(user_id,workout_id,exercise_index,exercise_id,library_id,name,muscle,target,exercise_group)
   values(owner_id,p_workout_id,(e->>'exercise_index')::integer,e->>'exercise_id',e->>'library_id',e->>'name',e->>'muscle',nullif(e->'target','null'::jsonb),nullif(e->'exercise_group','null'::jsonb));
   for s in select value from jsonb_array_elements(e->'sets') loop
    insert into public.completed_workout_sets(user_id,workout_id,exercise_index,set_index,set_id,weight,reps,other_side_reps,completed_at_ms)
    values(owner_id,p_workout_id,(e->>'exercise_index')::integer,(s->>'set_index')::integer,s->>'set_id',s->>'weight',s->>'reps',s->>'other_side_reps',(s->>'completed_at_ms')::float8);
   end loop;
  end loop;
 end if;
 insert into cresum_private.workout_changes(user_id,workout_id) values(owner_id,p_workout_id) returning sequence into change_id;
 result:=jsonb_build_object('revision',next_revision,'changeSequence',change_id::text);
 insert into cresum_private.workout_mutations(user_id,mutation_id,request_hash,result) values(owner_id,p_mutation_id,fingerprint,result);
 return result;
end $$;

create or replace function public.publish_shared_plan(p_owner uuid,p_hash text,p_payload jsonb,p_token_hash text,p_cipher text)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare row cresum_private.shared_plans;
begin
 perform pg_advisory_xact_lock(hashtext(p_owner::text));
 select * into row from cresum_private.shared_plans where owner_id=p_owner and payload_hash=p_hash and revoked_at is null;
 if found then return jsonb_build_object('origin',jsonb_build_object('publicationId',row.id,'version',row.version),'cipher',row.token_cipher); end if;
 if not public.sharing_limit('author:'||p_owner::text,30,3600) then raise exception 'Publication limit'; end if;
 if (select count(*) from cresum_private.shared_plans where owner_id=p_owner and revoked_at is null)>=500 then raise exception 'Active limit'; end if;
 if coalesce(p_payload->>'schemaVersion','') not in ('1','2') or jsonb_typeof(p_payload->'exercises')<>'array' or length(p_payload->>'title') not between 1 and 120 then raise exception 'Invalid plan'; end if;
 insert into cresum_private.shared_plans(owner_id,payload_hash,payload,token_hash,token_cipher)
 values(p_owner,p_hash,p_payload,p_token_hash,p_cipher) returning * into row;
 return jsonb_build_object('origin',jsonb_build_object('publicationId',row.id,'version',row.version),'cipher',row.token_cipher);
end $$;

create function public.get_equipment_group_capabilities()
returns jsonb language sql immutable security invoker set search_path=pg_catalog as $$
 select '{"historyGroups":1,"sharedPlan":2}'::jsonb
$$;
revoke all on function public.get_equipment_group_capabilities() from public,anon;
grant execute on function public.get_equipment_group_capabilities() to authenticated,service_role;
revoke all on function cresum_private.valid_exercise_group(jsonb),cresum_private.valid_history_workout(jsonb),cresum_private.valid_history_workout_without_groups(jsonb) from public,anon,authenticated;

-- Versioned History wire protocol: old readers must never normalize away groups.
-- Legacy requests fail closed on a grouped page/entity; plain history remains valid.
create function cresum_private.require_legacy_history(v jsonb)
returns void language plpgsql immutable set search_path=pg_catalog as $$
begin
 if coalesce(jsonb_path_exists(v,'$.**.exercise_group ? (@ != null)'),false) then
  raise exception 'Update the application to sync attachment groups' using errcode='0A000';
 end if;
end $$;
create or replace function public.get_completed_workout(p_workout_id text)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin result:=cresum_private.get_completed_workout(p_workout_id);perform cresum_private.require_legacy_history(result);return result;end $$;
create or replace function public.pull_completed_workouts(p_after text default '0',p_limit integer default 50)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin result:=cresum_private.pull_completed_workouts(p_after,p_limit);perform cresum_private.require_legacy_history(result);return result;end $$;
create or replace function public.publish_completed_workout(p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,p_workout jsonb)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
begin
 perform cresum_private.require_legacy_history(p_workout);
 perform cresum_private.require_legacy_history(cresum_private.get_completed_workout(p_workout_id));
 return cresum_private.publish_completed_workout(p_workout_id,p_mutation_id,p_device_id,p_expected_revision,p_workout);
end $$;
create or replace function public.resolve_completed_workout(p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,p_choice text,p_copy_id text,p_workout jsonb)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
begin
 perform cresum_private.require_legacy_history(p_workout);
 perform cresum_private.require_legacy_history(cresum_private.get_completed_workout(p_workout_id));
 return cresum_private.resolve_completed_workout(p_workout_id,p_mutation_id,p_device_id,p_expected_revision,p_choice,p_copy_id,p_workout);
end $$;
create function public.get_completed_workout_v2(p_workout_id text)
returns jsonb language sql stable security invoker set search_path=pg_catalog as $$select cresum_private.get_completed_workout(p_workout_id)$$;
create function public.pull_completed_workouts_v2(p_after text default '0',p_limit integer default 50)
returns jsonb language sql security invoker set search_path=pg_catalog as $$select cresum_private.pull_completed_workouts(p_after,p_limit)$$;
create function public.publish_completed_workout_v2(p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,p_workout jsonb)
returns jsonb language sql security invoker set search_path=pg_catalog as $$select cresum_private.publish_completed_workout(p_workout_id,p_mutation_id,p_device_id,p_expected_revision,p_workout)$$;
create function public.resolve_completed_workout_v2(p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,p_choice text,p_copy_id text,p_workout jsonb)
returns jsonb language sql security invoker set search_path=pg_catalog as $$select cresum_private.resolve_completed_workout(p_workout_id,p_mutation_id,p_device_id,p_expected_revision,p_choice,p_copy_id,p_workout)$$;
revoke all on function cresum_private.require_legacy_history(jsonb),public.get_completed_workout_v2(text),public.pull_completed_workouts_v2(text,integer),public.publish_completed_workout_v2(text,text,text,bigint,jsonb),public.resolve_completed_workout_v2(text,text,text,bigint,text,text,jsonb) from public,anon,authenticated;
grant execute on function cresum_private.require_legacy_history(jsonb),public.get_completed_workout_v2(text),public.pull_completed_workouts_v2(text,integer),public.publish_completed_workout_v2(text,text,text,bigint,jsonb),public.resolve_completed_workout_v2(text,text,text,bigint,text,text,jsonb) to authenticated;
create or replace function public.get_equipment_group_capabilities()
returns jsonb language sql stable security invoker set search_path=pg_catalog as $$select '{"historyGroups":1,"historyProtocol":2,"sharedPlan":2}'::jsonb$$;
