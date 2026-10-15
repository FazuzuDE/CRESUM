-- Atomic completed-history protocol. App activation is a separate integration.
create table cresum_private.workout_changes (
  sequence bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  foreign key (user_id, workout_id) references public.completed_workouts(user_id, workout_id) on delete cascade
);
create index workout_changes_owner_sequence on cresum_private.workout_changes(user_id, sequence);
create index workout_changes_owner_workout on cresum_private.workout_changes(user_id, workout_id);
create table cresum_private.workout_mutations (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id text not null,
  request_hash text not null,
  result jsonb not null,
  primary key(user_id, mutation_id)
);
alter table cresum_private.workout_changes enable row level security;
alter table cresum_private.workout_mutations enable row level security;
revoke all on cresum_private.workout_changes, cresum_private.workout_mutations from public, anon, authenticated;
revoke all on all sequences in schema cresum_private from public, anon, authenticated;

create function cresum_private.history_number(v jsonb, minimum double precision, integral boolean)
returns boolean language sql immutable security invoker set search_path=pg_catalog as $$
 select case when jsonb_typeof(v)='number' then
  v::text::double precision >= minimum and v::text::double precision < 'Infinity'::float8
  and (not integral or v::text::double precision=trunc(v::text::double precision))
 else false end
$$;

create function cresum_private.valid_history_workout(w jsonb)
returns boolean language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare e jsonb; s jsonb; t jsonb; slot jsonb; k text; i integer:=0; j integer;
begin
 if jsonb_typeof(w) is distinct from 'object' then return false; end if;
 foreach k in array array['workout_id','template_id','name'] loop
  if jsonb_typeof(w->k) is distinct from 'string' then return false; end if;
 end loop;
 if not cresum_private.history_number(w->'started_at_ms',0,false)
  or not cresum_private.history_number(w->'finished_at_ms',0,false)
  or (w->>'finished_at_ms')::float8 < (w->>'started_at_ms')::float8
  or not cresum_private.history_number(w->'current_exercise_index',0,true)
  or not cresum_private.history_number(w->'rest_duration_seconds',1,true)
  or jsonb_typeof(w->'exercises') is distinct from 'array' then return false; end if;
 if w->'rest_override_seconds' is distinct from 'null'::jsonb
  and not cresum_private.history_number(w->'rest_override_seconds',0,false) then return false; end if;
 if (jsonb_array_length(w->'exercises')=0 and (w->>'current_exercise_index')::float8<>0)
  or (jsonb_array_length(w->'exercises')>0 and (w->>'current_exercise_index')::float8>=jsonb_array_length(w->'exercises')) then return false; end if;
 slot:=w->'program_slot';
 if slot is distinct from 'null'::jsonb then
  if jsonb_typeof(slot) is distinct from 'object'
   or jsonb_typeof(slot->'assignmentId') is distinct from 'string'
   or not cresum_private.history_number(slot->'weekIndex',0,true)
   or not cresum_private.history_number(slot->'slotIndex',0,true)
   or (slot->>'weekIndex')::float8>9007199254740991 or (slot->>'slotIndex')::float8>9007199254740991
   or jsonb_typeof(slot->'date') is distinct from 'string'
   or (slot->>'date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
   -- Core's component Date constructor remaps years 0..99; preserve its accepted domain.
   or left(slot->>'date',4)::integer<100
   or to_char((slot->>'date')::date,'YYYY-MM-DD')<>slot->>'date' then return false; end if;
 end if;
 for e in select value from jsonb_array_elements(w->'exercises') loop
  if jsonb_typeof(e) is distinct from 'object' or e->'exercise_index' is distinct from to_jsonb(i)
   or jsonb_typeof(e->'sets') is distinct from 'array' then return false; end if;
  foreach k in array array['exercise_id','library_id','name','muscle'] loop
   if jsonb_typeof(e->k) is distinct from 'string' then return false; end if;
  end loop;
  t:=e->'target';
  if t is distinct from 'null'::jsonb then
   if jsonb_typeof(t) is distinct from 'object' then return false; end if;
   foreach k in array array['repMin','repMax','restMin','restMax','revision'] loop
    if not cresum_private.history_number(t->k,1,true) then return false; end if;
   end loop;
   if (t->>'repMin')::float8>(t->>'repMax')::float8 or (t->>'restMin')::float8>(t->>'restMax')::float8
    or (t->>'restMax')::float8>3600 or jsonb_typeof(t->'programId') is distinct from 'string'
    or length(t->>'programId')=0 or jsonb_typeof(t->'sourceRefs') is distinct from 'array'
    or jsonb_array_length(t->'sourceRefs')=0 then return false; end if;
   if t ? 'perSide' and jsonb_typeof(t->'perSide') is distinct from 'boolean' then return false; end if;
   if exists(select 1 from jsonb_array_elements(t->'sourceRefs') x where jsonb_typeof(x.value) is distinct from 'string') then return false; end if;
  end if;
  j:=0;
  for s in select value from jsonb_array_elements(e->'sets') loop
   if jsonb_typeof(s) is distinct from 'object' or s->'set_index' is distinct from to_jsonb(j) then return false; end if;
   foreach k in array array['set_id','weight','reps'] loop
    if jsonb_typeof(s->k) is distinct from 'string' then return false; end if;
   end loop;
   if s->'other_side_reps' is distinct from 'null'::jsonb and jsonb_typeof(s->'other_side_reps') is distinct from 'string' then return false; end if;
   if s->'completed_at_ms' is distinct from 'null'::jsonb and not cresum_private.history_number(s->'completed_at_ms',0,false) then return false; end if;
   j:=j+1;
  end loop;
  i:=i+1;
 end loop;
 return true;
exception when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format or datetime_field_overflow then return false;
end $$;

create function cresum_private.read_history_workout(owner_id uuid, entity_id text)
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
    from public.completed_workout_sets s where s.user_id=e.user_id and s.workout_id=e.workout_id and s.exercise_index=e.exercise_index),'[]'::jsonb)) order by e.exercise_index)
   from public.completed_workout_exercises e where e.user_id=w.user_id and e.workout_id=w.workout_id),'[]'::jsonb))
 from public.completed_workouts w where w.user_id=owner_id and w.workout_id=entity_id
$$;

create function cresum_private.publish_completed_workout(
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
   insert into public.completed_workout_exercises(user_id,workout_id,exercise_index,exercise_id,library_id,name,muscle,target)
   values(owner_id,p_workout_id,(e->>'exercise_index')::integer,e->>'exercise_id',e->>'library_id',e->>'name',e->>'muscle',nullif(e->'target','null'::jsonb));
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

create function cresum_private.pull_completed_workouts(p_after text,p_limit integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare owner_id uuid:=auth.uid(); after_id bigint;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_after is null or p_after !~ '^(0|[1-9][0-9]*)$' or length(p_after)>19
  or (length(p_after)=19 and p_after>'9223372036854775807')
  or p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Invalid history page' using errcode='22023'; end if;
 after_id:=p_after::bigint;
 return (with candidates as (
  select c.sequence,c.workout_id from cresum_private.workout_changes c where c.user_id=owner_id and c.sequence>after_id order by c.sequence limit p_limit+1
 ), page as (select * from candidates order by sequence limit p_limit)
 select jsonb_build_object('cursor',coalesce((select max(sequence)::text from page),p_after),
  'hasMore',(select count(*)>p_limit from candidates),
  'changes',coalesce((select jsonb_agg(jsonb_build_object('sequence',p.sequence::text,'workoutId',w.workout_id,
   'revision',w.revision,'deletedAt',w.deleted_at,
   'workout',case when w.deleted_at is null then cresum_private.read_history_workout(owner_id,w.workout_id) else null end) order by p.sequence)
   from page p join public.completed_workouts w on w.user_id=owner_id and w.workout_id=p.workout_id),'[]'::jsonb)));
end $$;

create function public.publish_completed_workout(p_workout_id text,p_mutation_id text,p_device_id text,p_expected_revision bigint,p_workout jsonb)
returns jsonb language sql security invoker set search_path=pg_catalog as $$
 select cresum_private.publish_completed_workout(p_workout_id,p_mutation_id,p_device_id,p_expected_revision,p_workout)
$$;
create function public.pull_completed_workouts(p_after text default '0',p_limit integer default 50)
returns jsonb language sql security invoker set search_path=pg_catalog as $$
 select cresum_private.pull_completed_workouts(p_after,p_limit)
$$;

-- Only RPC publication may mutate history; direct writes would bypass the feed.
revoke insert,update on public.sync_devices,public.completed_workouts,public.completed_workout_exercises,public.completed_workout_sets from authenticated;
revoke all on function cresum_private.history_number(jsonb,double precision,boolean),
 cresum_private.valid_history_workout(jsonb),cresum_private.read_history_workout(uuid,text),
 cresum_private.publish_completed_workout(text,text,text,bigint,jsonb),cresum_private.pull_completed_workouts(text,integer),
 public.publish_completed_workout(text,text,text,bigint,jsonb),public.pull_completed_workouts(text,integer) from public,anon,authenticated;
grant usage on schema cresum_private to authenticated;
grant execute on function cresum_private.publish_completed_workout(text,text,text,bigint,jsonb),
 cresum_private.pull_completed_workouts(text,integer),public.publish_completed_workout(text,text,text,bigint,jsonb),
 public.pull_completed_workouts(text,integer) to authenticated;
