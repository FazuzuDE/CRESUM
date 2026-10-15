-- Dormant storage contract. No app transport or privileged public RPC is enabled.
create schema if not exists cresum_private;
revoke all on schema cresum_private from public, anon, authenticated;

create function cresum_private.preserve_identity()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare column_name text;
begin
  foreach column_name in array tg_argv loop
    if to_jsonb(new) -> column_name is distinct from to_jsonb(old) -> column_name then
      raise exception 'Cloud entity identity is immutable' using errcode = '22023';
    end if;
  end loop;
  return new;
end $$;

create function cresum_private.advance_revision()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'INSERT' then
    if new.revision <> 1 then
      raise exception 'Initial revision must be 1' using errcode = '23514';
    end if;
    new.created_at := clock_timestamp();
  else
    if new.revision <> old.revision + 1 then
      raise exception 'Cloud revision conflict' using errcode = '40001';
    end if;
    new.created_at := old.created_at;
    if tg_table_name = 'completed_workouts' and
       to_jsonb(old) ->> 'deleted_at' is not null and
       to_jsonb(new) ->> 'deleted_at' is null then
      raise exception 'A tombstone cannot be cleared' using errcode = '23514';
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
revoke all on function cresum_private.preserve_identity() from public, anon, authenticated;
revoke all on function cresum_private.advance_revision() from public, anon, authenticated;

create table public.sync_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  label text,
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

create table public.completed_workouts (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  source_device_id text,
  name text not null,
  template_id text not null,
  started_at_ms double precision not null check (started_at_ms >= 0 and started_at_ms < 'Infinity'::float8),
  finished_at_ms double precision not null check (finished_at_ms >= started_at_ms and finished_at_ms < 'Infinity'::float8),
  current_exercise_index integer not null check (current_exercise_index >= 0),
  rest_duration_seconds double precision not null check (rest_duration_seconds > 0 and rest_duration_seconds < 'Infinity'::float8 and rest_duration_seconds = trunc(rest_duration_seconds)),
  rest_override_seconds double precision check (rest_override_seconds >= 0 and rest_override_seconds < 'Infinity'::float8),
  program_slot jsonb check (jsonb_typeof(program_slot) = 'object'),
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, workout_id),
  foreign key (user_id, source_device_id) references public.sync_devices(user_id, device_id)
);
create index completed_workouts_owner_finished on public.completed_workouts(user_id, finished_at_ms, workout_id);
create index completed_workouts_owner_updated on public.completed_workouts(user_id, updated_at, workout_id);
create index completed_workouts_source_device on public.completed_workouts(user_id, source_device_id);

create table public.completed_workout_exercises (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  exercise_index integer not null check (exercise_index >= 0),
  exercise_id text not null,
  library_id text not null,
  name text not null,
  muscle text not null,
  target jsonb check (jsonb_typeof(target) = 'object'),
  primary key (user_id, workout_id, exercise_index),
  foreign key (user_id, workout_id) references public.completed_workouts(user_id, workout_id) on delete cascade
);

create table public.completed_workout_sets (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  exercise_index integer not null check (exercise_index >= 0),
  set_index integer not null check (set_index >= 0),
  set_id text not null,
  weight text not null,
  reps text not null,
  other_side_reps text,
  completed_at_ms double precision check (completed_at_ms >= 0 and completed_at_ms < 'Infinity'::float8),
  primary key (user_id, workout_id, exercise_index, set_index),
  foreign key (user_id, workout_id, exercise_index)
    references public.completed_workout_exercises(user_id, workout_id, exercise_index) on delete cascade
);

create trigger devices_identity before update on public.sync_devices
  for each row execute function cresum_private.preserve_identity('user_id', 'device_id');
create trigger devices_revision before insert or update on public.sync_devices
  for each row execute function cresum_private.advance_revision();
create trigger workouts_identity before update on public.completed_workouts
  for each row execute function cresum_private.preserve_identity('user_id', 'workout_id', 'source_device_id');
create trigger workouts_revision before insert or update on public.completed_workouts
  for each row execute function cresum_private.advance_revision();
create trigger exercises_identity before update on public.completed_workout_exercises
  for each row execute function cresum_private.preserve_identity('user_id', 'workout_id', 'exercise_index', 'exercise_id');
create trigger sets_identity before update on public.completed_workout_sets
  for each row execute function cresum_private.preserve_identity('user_id', 'workout_id', 'exercise_index', 'set_index', 'set_id');

-- Revoke platform default privileges too, then grant only these operations.
do $$ declare relation text; begin
  foreach relation in array array['sync_devices', 'completed_workouts', 'completed_workout_exercises', 'completed_workout_sets'] loop
    execute format('alter table public.%I enable row level security', relation);
    execute format('revoke all on public.%I from public, anon, authenticated', relation);
    execute format('grant select, insert, update on public.%I to authenticated', relation);
    execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)', relation);
    if relation in ('sync_devices', 'completed_workouts') then
      execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', relation);
      execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', relation);
    else
      execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.completed_workouts w where w.user_id = %I.user_id and w.workout_id = %I.workout_id and w.deleted_at is null))', relation, relation, relation);
      execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.completed_workouts w where w.user_id = %I.user_id and w.workout_id = %I.workout_id and w.deleted_at is null)) with check ((select auth.uid()) = user_id and exists (select 1 from public.completed_workouts w where w.user_id = %I.user_id and w.workout_id = %I.workout_id and w.deleted_at is null))', relation, relation, relation, relation, relation);
    end if;
  end loop;
end $$;
