-- Destructive fixtures are rolled back; use only an isolated test database.
begin;
set local plpgsql.check_asserts = on;
insert into auth.users (id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
insert into public.sync_devices (user_id, device_id, label) values
  (auth.uid(), 'legacy-device', 'Phone');
insert into public.completed_workouts
  (user_id, workout_id, source_device_id, name, template_id,
   started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
values (auth.uid(), 'legacy-workout', 'legacy-device', 'A workout', 'upper', 0, 1000.5, 0, 90);
insert into public.completed_workout_exercises
  (user_id, workout_id, exercise_index, exercise_id, library_id, name, muscle)
values
  (auth.uid(), 'legacy-workout', 0, 'repeated-id', 'row', 'Row', 'Back'),
  (auth.uid(), 'legacy-workout', 1, 'repeated-id', 'row', 'Row', 'Back');
insert into public.completed_workout_sets
  (user_id, workout_id, exercise_index, set_index, set_id, weight, reps, other_side_reps, completed_at_ms)
values
  (auth.uid(), 'legacy-workout', 0, 0, 'repeated-set', '0', '10', '8', 500.25),
  (auth.uid(), 'legacy-workout', 0, 1, 'repeated-set', '', '', null, null);

do $$ begin
  assert (select count(*) = 2 from public.completed_workout_exercises), 'Repeated historical exercise IDs lost';
  assert (select count(*) = 2 from public.completed_workout_sets), 'Repeated historical set IDs lost';
  assert (select weight = '0' and reps = '10' and other_side_reps = '8'
          and completed_at_ms = 500.25 from public.completed_workout_sets where set_index = 0), 'Paired/zero facts changed';
  assert (select weight = '' and reps = '' and completed_at_ms is null
          from public.completed_workout_sets where set_index = 1), 'Uncompleted set snapshot changed';
  begin
    insert into public.sync_devices (user_id, device_id) values
      ('22222222-2222-4222-8222-222222222222', 'forged');
    raise exception 'Cross-owner insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update public.completed_workouts set user_id = '22222222-2222-4222-8222-222222222222', revision = 2;
    raise exception 'Owner reassignment succeeded';
  exception when invalid_parameter_value or insufficient_privilege then null; end;
  begin
    update public.completed_workouts set workout_id = 'renamed', revision = 2;
    raise exception 'Stable workout identity changed';
  exception when invalid_parameter_value then null; end;
  begin
    update public.completed_workouts set name = 'stale', revision = 1;
    raise exception 'Stale revision accepted';
  exception when serialization_failure then null; end;
end $$;
update public.completed_workouts set name = 'Changed once', revision = 2;
do $$ begin
  assert (select revision = 2 and name = 'Changed once' from public.completed_workouts), 'Valid revision update failed';
  begin
    update public.completed_workouts set revision = 4;
    raise exception 'Skipped revision accepted';
  exception when serialization_failure then null; end;
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$ declare affected integer; begin
  assert (select count(*) = 0 from public.sync_devices), 'Other owner device leaked';
  assert (select count(*) = 0 from public.completed_workouts), 'Other owner history leaked';
  assert (select count(*) = 0 from public.completed_workout_exercises), 'Other owner exercises leaked';
  assert (select count(*) = 0 from public.completed_workout_sets), 'Other owner sets leaked';
  update public.completed_workouts set name = 'B overwrote A', revision = 3;
  get diagnostics affected = row_count;
  assert affected = 0, 'Cross-owner update succeeded';
  begin
    insert into public.completed_workout_exercises
      (user_id, workout_id, exercise_index, exercise_id, library_id, name, muscle)
    values (auth.uid(), 'legacy-workout', 0, 'x', 'row', 'Row', 'Back');
    raise exception 'Cross-owner aggregate attachment succeeded';
  exception when foreign_key_violation or insufficient_privilege then null; end;
end $$;
insert into public.sync_devices (user_id, device_id) values (auth.uid(), 'legacy-device');
insert into public.completed_workouts
  (user_id, workout_id, source_device_id, name, template_id,
   started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
values (auth.uid(), 'legacy-workout', 'legacy-device', 'B workout', 'upper', 0, 1000, 0, 90);
do $$ begin
  assert (select count(*) = 1 and min(name) = 'B workout' from public.completed_workouts), 'Same ID across owners is not isolated';
  begin
    insert into public.completed_workouts
      (user_id, workout_id, name, template_id, started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
    values (auth.uid(), 'bad-time', 'Bad', 'upper', 100, 99, 0, 90);
    raise exception 'Invalid completion order accepted';
  exception when check_violation then null; end;
  begin
    insert into public.completed_workouts
      (user_id, workout_id, name, template_id, started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
    values (auth.uid(), 'bad-number', 'Bad', 'upper', 0, 'Infinity'::float8, 0, 90);
    raise exception 'Infinite completion accepted';
  exception when check_violation then null; end;
  begin
    delete from public.completed_workouts;
    raise exception 'Physical delete permitted';
  exception when insufficient_privilege then null; end;
end $$;

insert into public.sync_devices (user_id, device_id) values (auth.uid(), 'b-only-device');
insert into public.completed_workouts
  (user_id, workout_id, source_device_id, name, template_id,
   started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
values (auth.uid(), 'b-only-workout', 'b-only-device', 'B only', 'upper', 0, 1000, 0, 90);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.completed_workouts set deleted_at = now(), revision = 3;
do $$ declare affected integer; begin
  assert (select deleted_at is not null and revision = 3 from public.completed_workouts), 'Tombstone missing';
  begin
    update public.completed_workouts set deleted_at = null, revision = 4;
    raise exception 'Tombstone resurrected';
  exception when check_violation then null; end;
  update public.completed_workout_sets set weight = '999';
  get diagnostics affected = row_count;
  assert affected = 0, 'Tombstoned aggregate changed';
  begin
    insert into public.completed_workout_exercises
      (user_id, workout_id, exercise_index, exercise_id, library_id, name, muscle)
    values (auth.uid(), 'legacy-workout', 2, 'x', 'row', 'Row', 'Back');
    raise exception 'Tombstoned aggregate accepted new content';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert (select count(*) = 0 from public.completed_workouts), 'Authenticated role without a user leaked rows';
  begin
    insert into public.sync_devices (user_id, device_id) values
      ('11111111-1111-4111-8111-111111111111', 'unsigned');
    raise exception 'Authenticated role without a user inserted data';
  exception when insufficient_privilege then null; end;
end $$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ declare relation text; begin
  foreach relation in array array['sync_devices', 'completed_workouts', 'completed_workout_exercises', 'completed_workout_sets'] loop
    begin
      execute format('select * from public.%I', relation);
      raise exception 'Anonymous access permitted to %', relation;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
reset role;
-- Prove composite FKs independently of RLS by testing them as table owner.
do $$ begin
  assert (select count(*) = 4 from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname in
          ('sync_devices', 'completed_workouts', 'completed_workout_exercises', 'completed_workout_sets') and c.relrowsecurity), 'A cloud table has no RLS';
  begin
    insert into public.completed_workout_exercises
      (user_id, workout_id, exercise_index, exercise_id, library_id, name, muscle)
    values ('11111111-1111-4111-8111-111111111111', 'b-only-workout', 0, 'x', 'row', 'Row', 'Back');
    raise exception 'Composite owner/workout foreign key missing';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.completed_workouts
      (user_id, workout_id, source_device_id, name, template_id,
       started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
    values ('11111111-1111-4111-8111-111111111111', 'wrong-device', 'b-only-device', 'Bad', 'upper', 0, 1000, 0, 90);
    raise exception 'Composite owner/device foreign key missing';
  exception when foreign_key_violation then null; end;
end $$;
-- Core v1 accepts every finite positive integer, including values beyond int8.
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$ declare duration double precision; counter integer := 0; begin
  foreach duration in array array[2147483648::float8, 1e20::float8, 1.7976931348623157e308::float8] loop
    counter := counter + 1;
    insert into public.completed_workouts
      (user_id, workout_id, name, template_id, started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
    values (auth.uid(), 'large-rest-' || counter, 'Large rest', 'upper', 0, 1000, 0, duration);
    assert (select rest_duration_seconds = duration from public.completed_workouts
            where workout_id = 'large-rest-' || counter), 'Valid Core rest duration changed';
  end loop;
  foreach duration in array array[0::float8, -1::float8, 0.5::float8, 'Infinity'::float8, 'NaN'::float8] loop
    begin
      insert into public.completed_workouts
        (user_id, workout_id, name, template_id, started_at_ms, finished_at_ms, current_exercise_index, rest_duration_seconds)
      values (auth.uid(), 'invalid-rest', 'Invalid rest', 'upper', 0, 1000, 0, duration);
      raise exception 'Invalid rest duration accepted';
    exception when check_violation then null; end;
  end loop;
end $$;
reset role;
rollback;
