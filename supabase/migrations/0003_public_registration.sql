create or replace function public.generate_submission_code()
returns text
language sql
volatile
as $$
  select 'REG-' || upper(left(replace(gen_random_uuid()::text, '-', ''), 8));
$$;

create or replace function public.submit_registration(
  target_tournament_id uuid,
  payload jsonb
)
returns table (
  registration_id uuid,
  submission_code text,
  status public.registration_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  tournament_row public.tournaments%rowtype;
  registration_row public.registrations%rowtype;
  submission_status public.registration_status := 'pending';
  roster jsonb := coalesce(payload -> 'players', '[]'::jsonb);
  player_item jsonb;
  active_player_count integer := 0;
  total_player_count integer := 0;
  captain_count integer := 0;
  sort_index integer := 0;
  registration_team_name text := trim(coalesce(payload ->> 'team_name', ''));
  registration_team_short_name text := nullif(trim(coalesce(payload ->> 'team_short_name', '')), '');
  registration_captain_name text := trim(coalesce(payload ->> 'captain_name', ''));
  registration_captain_contact text := trim(coalesce(payload ->> 'captain_contact', ''));
  registration_captain_email text := nullif(trim(coalesce(payload ->> 'captain_email', '')), '');
  registration_region text := trim(coalesce(payload ->> 'region', ''));
  registration_city text := nullif(trim(coalesce(payload ->> 'city', '')), '');
  registration_team_bio text := nullif(trim(coalesce(payload ->> 'team_bio', '')), '');
  generated_submission_code text := public.generate_submission_code();
begin
  select *
    into tournament_row
  from public.tournaments
  where id = target_tournament_id;

  if not found then
    raise exception 'Tournament not found';
  end if;

  if tournament_row.status <> 'registration_open' then
    raise exception 'Registration is currently closed for this tournament';
  end if;

  if registration_team_name = '' then
    raise exception 'Team name is required';
  end if;

  if registration_captain_name = '' then
    raise exception 'Captain name is required';
  end if;

  if registration_captain_contact = '' then
    raise exception 'Captain contact is required';
  end if;

  if registration_region = '' then
    raise exception 'Region is required';
  end if;

  if jsonb_typeof(roster) <> 'array' then
    raise exception 'Players payload must be an array';
  end if;

  total_player_count := jsonb_array_length(roster);

  if total_player_count = 0 then
    raise exception 'At least one player is required';
  end if;

  for player_item in
    select value
    from jsonb_array_elements(roster)
  loop
    if trim(coalesce(player_item ->> 'display_name', '')) = '' then
      raise exception 'Each player must include display_name';
    end if;

    if trim(coalesce(player_item ->> 'in_game_name', '')) = '' then
      raise exception 'Each player must include in_game_name';
    end if;

    if coalesce(player_item ->> 'roster_role', 'player') <> 'substitute' then
      active_player_count := active_player_count + 1;
    end if;

    if coalesce((player_item ->> 'is_captain')::boolean, false) then
      captain_count := captain_count + 1;
    end if;
  end loop;

  if active_player_count < tournament_row.roster_min_players then
    raise exception 'Minimum % active players required', tournament_row.roster_min_players;
  end if;

  if total_player_count > tournament_row.roster_max_players then
    raise exception 'Maximum % total players allowed', tournament_row.roster_max_players;
  end if;

  if captain_count <> 1 then
    raise exception 'Exactly one captain must be selected in roster';
  end if;

  if public.remaining_team_slots(target_tournament_id) <= 0 then
    submission_status := 'waitlisted';
  end if;

  insert into public.registrations (
    tournament_id,
    submission_code,
    status,
    team_name,
    team_slug,
    team_short_name,
    captain_name,
    captain_contact,
    captain_email,
    region,
    city,
    team_bio,
    source
  )
  values (
    target_tournament_id,
    generated_submission_code,
    submission_status,
    registration_team_name,
    public.slugify(registration_team_name),
    registration_team_short_name,
    registration_captain_name,
    registration_captain_contact,
    registration_captain_email,
    registration_region,
    registration_city,
    registration_team_bio,
    'public_form'
  )
  returning *
  into registration_row;

  for player_item in
    select value
    from jsonb_array_elements(roster)
  loop
    sort_index := sort_index + 1;

    insert into public.registration_players (
      registration_id,
      display_name,
      in_game_name,
      game_uid,
      game_server,
      roster_role,
      is_captain,
      sort_order
    )
    values (
      registration_row.id,
      trim(player_item ->> 'display_name'),
      trim(player_item ->> 'in_game_name'),
      nullif(trim(coalesce(player_item ->> 'game_uid', '')), ''),
      nullif(trim(coalesce(player_item ->> 'game_server', '')), ''),
      coalesce(player_item ->> 'roster_role', 'player')::public.roster_role,
      coalesce((player_item ->> 'is_captain')::boolean, false),
      sort_index
    );
  end loop;

  return query
  select registration_row.id, registration_row.submission_code, registration_row.status;
end;
$$;

grant execute on function public.generate_submission_code() to anon, authenticated;
grant execute on function public.submit_registration(uuid, jsonb) to anon, authenticated;
