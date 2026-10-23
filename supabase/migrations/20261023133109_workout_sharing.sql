-- Only Edge Functions using a verified author identity may access these RPCs.
create table cresum_private.shared_plans (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 payload_hash text not null, payload jsonb not null,
 token_hash text not null unique, token_cipher text not null,
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), revoked_at timestamptz,
 check(octet_length(payload::text)<=65536)
);
create unique index shared_plan_active_snapshot on cresum_private.shared_plans(owner_id,payload_hash) where revoked_at is null;
alter table cresum_private.shared_plans enable row level security;
create table cresum_private.plan_library (
 publication_id uuid primary key references cresum_private.shared_plans(id) on delete cascade,
 metadata jsonb not null, published boolean not null default false
);
alter table cresum_private.plan_library enable row level security;
create table cresum_private.sharing_limits (
 bucket text primary key, starts_at timestamptz not null, hits integer not null
);
alter table cresum_private.sharing_limits enable row level security;
revoke all on cresum_private.shared_plans,cresum_private.plan_library,cresum_private.sharing_limits from public,anon,authenticated;

create function public.sharing_limit(p_bucket text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security definer set search_path=pg_catalog as $$
declare accepted boolean;
begin
 insert into cresum_private.sharing_limits as l(bucket,starts_at,hits) values(p_bucket,clock_timestamp(),1)
 on conflict(bucket) do update set
 hits=case when l.starts_at < clock_timestamp()-make_interval(secs=>p_seconds) then 1 else l.hits+1 end,
 starts_at=case when l.starts_at < clock_timestamp()-make_interval(secs=>p_seconds) then clock_timestamp() else l.starts_at end
 returning hits<=p_limit into accepted;
 return accepted;
end $$;

create function public.publish_shared_plan(p_owner uuid,p_hash text,p_payload jsonb,p_token_hash text,p_cipher text)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare row cresum_private.shared_plans;
begin
 perform pg_advisory_xact_lock(hashtext(p_owner::text));
 select * into row from cresum_private.shared_plans where owner_id=p_owner and payload_hash=p_hash and revoked_at is null;
 if found then return jsonb_build_object('origin',jsonb_build_object('publicationId',row.id,'version',row.version),'cipher',row.token_cipher); end if;
 if not public.sharing_limit('author:'||p_owner::text,30,3600) then raise exception 'Publication limit'; end if;
 if (select count(*) from cresum_private.shared_plans where owner_id=p_owner and revoked_at is null)>=500 then raise exception 'Active limit'; end if;
 if p_payload->>'schemaVersion'<>'1' or jsonb_typeof(p_payload->'exercises')<>'array' or length(p_payload->>'title') not between 1 and 120 then raise exception 'Invalid plan'; end if;
 insert into cresum_private.shared_plans(owner_id,payload_hash,payload,token_hash,token_cipher)
 values(p_owner,p_hash,p_payload,p_token_hash,p_cipher) returning * into row;
 return jsonb_build_object('origin',jsonb_build_object('publicationId',row.id,'version',row.version),'cipher',row.token_cipher);
end $$;

create function public.read_shared_plan(p_hash text) returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('origin',jsonb_build_object('publicationId',id,'version',version),'plan',payload)
 from cresum_private.shared_plans where token_hash=p_hash and revoked_at is null
$$;
create function public.revoke_shared_plan(p_owner uuid,p_id uuid) returns boolean language plpgsql security definer set search_path=pg_catalog as $$
begin
 update cresum_private.shared_plans set revoked_at=coalesce(revoked_at,now()) where id=p_id and owner_id=p_owner;
 return found;
end $$;
create function public.list_shared_plan_library() returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select coalesce(jsonb_agg(jsonb_build_object('origin',jsonb_build_object('publicationId',p.id,'version',p.version),'metadata',l.metadata) order by p.id),'[]'::jsonb)
 from cresum_private.plan_library l join cresum_private.shared_plans p on p.id=l.publication_id where l.published and p.revoked_at is null
$$;
create function public.read_library_plan(p_id uuid) returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('origin',jsonb_build_object('publicationId',p.id,'version',p.version),'plan',p.payload)
 from cresum_private.plan_library l join cresum_private.shared_plans p on p.id=l.publication_id where p.id=p_id and l.published and p.revoked_at is null
$$;
revoke all on function public.sharing_limit(text,integer,integer),public.publish_shared_plan(uuid,text,jsonb,text,text),public.read_shared_plan(text),public.revoke_shared_plan(uuid,uuid),public.list_shared_plan_library(),public.read_library_plan(uuid) from public,anon,authenticated;
grant execute on function public.sharing_limit(text,integer,integer),public.publish_shared_plan(uuid,text,jsonb,text,text),public.read_shared_plan(text),public.revoke_shared_plan(uuid,uuid),public.list_shared_plan_library(),public.read_library_plan(uuid) to service_role;

-- Numeric authored targets carry no fabricated official program provenance.
create or replace function cresum_private.valid_history_workout(w jsonb)
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
   if t->>'kind'='authored' then
    if exists(select 1 from jsonb_object_keys(t) x where x not in ('kind','repMin','repMax','restMin','restMax','perSide')) then return false; end if;
    foreach k in array array['repMin','repMax'] loop
     if not cresum_private.history_number(t->k,1,true) or (t->>k)::float8>1000 then return false; end if;
    end loop;
    foreach k in array array['restMin','restMax'] loop
     if not cresum_private.history_number(t->k,0,true) or (t->>k)::float8>3600 then return false; end if;
    end loop;
    if (t->>'repMin')::float8>(t->>'repMax')::float8 or (t->>'restMin')::float8>(t->>'restMax')::float8 then return false; end if;
    if t ? 'perSide' and jsonb_typeof(t->'perSide') is distinct from 'boolean' then return false; end if;
   else
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

create function public.list_owned_shared_plans(p_owner uuid) returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select coalesce(jsonb_agg(jsonb_build_object('origin',jsonb_build_object('publicationId',id,'version',version),'title',payload->>'title','createdAt',extract(epoch from created_at)*1000) order by created_at desc),'[]'::jsonb)
 from cresum_private.shared_plans where owner_id=p_owner and revoked_at is null
$$;
revoke all on function public.list_owned_shared_plans(uuid) from public,anon,authenticated;
grant execute on function public.list_owned_shared_plans(uuid) to service_role;
