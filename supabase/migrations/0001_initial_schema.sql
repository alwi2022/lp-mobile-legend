create extension if not exists pgcrypto;

create type public.tournament_format as enum (
  'single_elimination',
  'double_elimination',
  'round_robin',
  'hybrid'
);

create type public.tournament_status as enum (
  'draft',
  'registration_open',
  'registration_closed',
  'ongoing',
  'completed',
  'archived'
);

create type public.admin_role as enum (
  'super_admin',
  'admin',
  'operator'
);

create type public.registration_status as enum (
  'pending',
  'approved',
  'rejected',
  'waitlisted'
);

create type public.team_status as enum (
  'active',
  'eliminated',
  'champion',
  'archived'
);

create type public.roster_role as enum (
  'captain',
  'player',
  'substitute'
);

create type public.match_status as enum (
  'scheduled',
  'live',
  'finished',
  'cancelled'
);

create type public.match_game_status as enum (
  'scheduled',
  'live',
  'finished',
  'void'
);

create type public.bracket_slot_side as enum (
  'team_a',
  'team_b'
);

create type public.bracket_source_outcome as enum (
  'winner',
  'loser'
);

create type public.stream_platform as enum (
  'youtube',
  'twitch',
  'tiktok',
  'custom'
);

create type public.stream_status as enum (
  'draft',
  'live_soon',
  'live',
  'ended',
  'archived'
);

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  game_title text not null default 'Mobile Legends',
  format public.tournament_format not null default 'single_elimination',
  status public.tournament_status not null default 'draft',
  team_slot_limit integer not null default 16 check (team_slot_limit > 0),
  roster_min_players integer not null default 5 check (roster_min_players > 0),
  roster_max_players integer not null default 6 check (roster_max_players >= roster_min_players),
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  check_in_deadline timestamptz,
  technical_meeting_at timestamptz,
  kickoff_at timestamptz,
  grand_final_at timestamptz,
  timezone text not null default 'Asia/Jakarta',
  venue_name text,
  public_notes text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null unique references public.tournaments (id) on delete cascade,
  brand_name text not null default 'Satria Tournament',
  brand_mark text not null default 'ST',
  site_title text not null default 'SATRIA TOURNAMENT',
  meta_description text not null default 'Website turnamen Mobile Legends Satria Tournament.',
  hero_eyebrow text not null default 'Turnamen Mobile Legends',
  hero_title text not null default 'Satria Tournament',
  hero_description text not null default '',
  hero_primary_label text not null default 'Daftar Tim',
  hero_primary_href text not null default '/register',
  hero_secondary_label text not null default 'Lihat Bracket',
  hero_secondary_href text not null default '#bracket',
  hero_format_label text not null default 'Single Elimination BO3',
  register_eyebrow text not null default 'Pendaftaran Tim',
  register_title text not null default 'Pendaftaran tim dipusatkan lewat form internal',
  register_description text not null default 'Tim yang ingin daftar akan diarahkan ke form internal supaya data masuk langsung ke dashboard panitia.',
  register_cta_label text not null default 'Form Internal',
  register_cta_title text not null default 'Daftar lewat Form Internal',
  register_cta_description text not null default 'Pendaftaran tim dipusatkan ke form internal supaya pengiriman data, persetujuan, slot, dan dashboard panitia tetap sinkron.',
  register_cta_action_label text not null default 'Daftar Sekarang',
  register_cta_action_href text not null default '/register',
  contact_label text not null default 'Kontak Panitia',
  contact_value text not null default '',
  live_eyebrow text not null default 'Siaran Langsung',
  live_title text not null default 'Video utama dan daftar pertandingan live',
  live_description text not null default '',
  footer_title text not null default 'Satria Tournament',
  footer_description text not null default '',
  extra_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  role public.admin_role not null default 'operator',
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  submission_code text not null unique,
  status public.registration_status not null default 'pending',
  team_name text not null,
  team_slug text not null default '',
  team_short_name text,
  captain_name text not null,
  captain_contact text not null,
  captain_email text,
  region text not null,
  city text,
  logo_path text,
  proof_payment_path text,
  team_bio text,
  source text not null default 'public_form',
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users (id) on delete set null,
  waitlisted_at timestamptz,
  waitlisted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create table public.registration_players (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  display_name text not null,
  in_game_name text not null,
  game_uid text,
  game_server text,
  roster_role public.roster_role not null default 'player',
  is_captain boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (registration_id, sort_order)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  registration_id uuid unique references public.registrations (id) on delete set null,
  status public.team_status not null default 'active',
  seed_number integer check (seed_number is null or seed_number > 0),
  name text not null,
  slug text not null,
  short_name text,
  captain_name text not null,
  captain_contact text not null,
  captain_email text,
  region text not null,
  city text,
  logo_path text,
  approved_at timestamptz not null default now(),
  approved_by uuid references auth.users (id) on delete set null,
  eliminated_at timestamptz,
  eliminated_round text,
  placement integer check (placement is null or placement > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (tournament_id, slug)
);

create table public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  display_name text not null,
  in_game_name text not null,
  game_uid text,
  game_server text,
  roster_role public.roster_role not null default 'player',
  is_captain boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (team_id, sort_order)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  stage_name text not null default 'Main Bracket',
  round_name text not null,
  round_number integer not null check (round_number > 0),
  match_number integer not null check (match_number > 0),
  status public.match_status not null default 'scheduled',
  best_of integer not null default 3 check (best_of in (1, 3, 5, 7)),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  venue_name text,
  team_a_id uuid references public.teams (id) on delete set null,
  team_b_id uuid references public.teams (id) on delete set null,
  team_a_placeholder text,
  team_b_placeholder text,
  winner_team_id uuid references public.teams (id) on delete set null,
  loser_team_id uuid references public.teams (id) on delete set null,
  score_a_total integer not null default 0 check (score_a_total >= 0),
  score_b_total integer not null default 0 check (score_b_total >= 0),
  notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (tournament_id, stage_name, round_number, match_number),
  check (team_a_id is null or team_b_id is null or team_a_id <> team_b_id)
);

create table public.match_games (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  game_number integer not null check (game_number > 0),
  status public.match_game_status not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  winner_team_id uuid references public.teams (id) on delete set null,
  team_a_score integer check (team_a_score is null or team_a_score >= 0),
  team_b_score integer check (team_b_score is null or team_b_score >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (match_id, game_number)
);

create table public.bracket_slots (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  slot_side public.bracket_slot_side not null,
  round_number integer not null check (round_number > 0),
  slot_number integer not null check (slot_number > 0),
  team_id uuid references public.teams (id) on delete set null,
  display_label text,
  source_match_id uuid references public.matches (id) on delete set null,
  source_outcome public.bracket_source_outcome,
  seed_number integer check (seed_number is null or seed_number > 0),
  is_bye boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (match_id, slot_side),
  check (
    (source_match_id is null and source_outcome is null)
    or (source_match_id is not null and source_outcome is not null)
  )
);

create table public.streams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  match_id uuid references public.matches (id) on delete set null,
  title text not null,
  platform public.stream_platform not null default 'youtube',
  status public.stream_status not null default 'draft',
  stream_url text,
  embed_url text,
  youtube_id text,
  scheduled_start_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index tournaments_status_idx on public.tournaments (status);
create index tournaments_featured_idx on public.tournaments (is_featured) where is_featured = true;

create index registrations_tournament_status_idx on public.registrations (tournament_id, status);
create index registrations_submitted_at_idx on public.registrations (submitted_at desc);
create unique index registrations_unique_team_name_active_idx
  on public.registrations (tournament_id, lower(team_name))
  where status in ('pending', 'approved', 'waitlisted');
create unique index registrations_unique_captain_contact_active_idx
  on public.registrations (tournament_id, captain_contact)
  where status in ('pending', 'approved', 'waitlisted');

create index registration_players_registration_idx on public.registration_players (registration_id);
create unique index registration_players_one_captain_idx
  on public.registration_players (registration_id)
  where is_captain = true;

create index teams_tournament_status_idx on public.teams (tournament_id, status);
create unique index teams_unique_name_idx
  on public.teams (tournament_id, lower(name));

create index team_players_team_idx on public.team_players (team_id);
create unique index team_players_one_captain_idx
  on public.team_players (team_id)
  where is_captain = true;

create index matches_tournament_status_schedule_idx
  on public.matches (tournament_id, status, scheduled_at);
create index matches_winner_idx on public.matches (winner_team_id);

create index match_games_match_idx on public.match_games (match_id, game_number);
create index bracket_slots_tournament_round_idx on public.bracket_slots (tournament_id, round_number, slot_number);
create index bracket_slots_source_match_idx on public.bracket_slots (source_match_id);

create index streams_tournament_status_idx on public.streams (tournament_id, status, scheduled_start_at);
create index streams_match_idx on public.streams (match_id);
create unique index streams_one_featured_per_tournament_idx
  on public.streams (tournament_id)
  where is_featured = true;

create trigger tournaments_set_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create trigger admins_set_updated_at
before update on public.admins
for each row execute function public.set_updated_at();

create trigger registrations_set_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

create trigger registration_players_set_updated_at
before update on public.registration_players
for each row execute function public.set_updated_at();

create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger team_players_set_updated_at
before update on public.team_players
for each row execute function public.set_updated_at();

create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

create trigger match_games_set_updated_at
before update on public.match_games
for each row execute function public.set_updated_at();

create trigger bracket_slots_set_updated_at
before update on public.bracket_slots
for each row execute function public.set_updated_at();

create trigger streams_set_updated_at
before update on public.streams
for each row execute function public.set_updated_at();

create or replace function public.remaining_team_slots(target_tournament_id uuid)
returns integer
language sql
stable
as $$
  select
    greatest(
      t.team_slot_limit - count(team.id)::integer,
      0
    )
  from public.tournaments t
  left join public.teams team
    on team.tournament_id = t.id
   and team.status in ('active', 'eliminated', 'champion')
  where t.id = target_tournament_id
  group by t.team_slot_limit;
$$;

create or replace function public.required_series_wins(best_of_value integer)
returns integer
language sql
immutable
as $$
  select ((best_of_value + 1) / 2);
$$;

create or replace function public.sync_registration_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.reviewed_at = now();

    if new.status = 'approved' then
      new.approved_at = coalesce(new.approved_at, now());
      new.rejected_at = null;
      new.waitlisted_at = null;
    elsif new.status = 'rejected' then
      new.rejected_at = coalesce(new.rejected_at, now());
      new.approved_at = null;
      new.waitlisted_at = null;
    elsif new.status = 'waitlisted' then
      new.waitlisted_at = coalesce(new.waitlisted_at, now());
      new.approved_at = null;
      new.rejected_at = null;
    else
      new.approved_at = null;
      new.rejected_at = null;
      new.waitlisted_at = null;
    end if;
  elsif tg_op = 'INSERT' then
    if new.status = 'approved' then
      new.reviewed_at = coalesce(new.reviewed_at, now());
      new.approved_at = coalesce(new.approved_at, now());
    elsif new.status = 'rejected' then
      new.reviewed_at = coalesce(new.reviewed_at, now());
      new.rejected_at = coalesce(new.rejected_at, now());
    elsif new.status = 'waitlisted' then
      new.reviewed_at = coalesce(new.reviewed_at, now());
      new.waitlisted_at = coalesce(new.waitlisted_at, now());
    end if;
  end if;

  if nullif(trim(coalesce(new.team_slug, '')), '') is null then
    new.team_slug = public.slugify(new.team_name);
  else
    new.team_slug = public.slugify(new.team_slug);
  end if;

  return new;
end;
$$;

create trigger registrations_status_timestamp_trigger
before insert or update on public.registrations
for each row execute function public.sync_registration_status_timestamps();

create or replace function public.sync_team_slug()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(coalesce(new.slug, '')), '') is null then
    new.slug = public.slugify(new.name);
  else
    new.slug = public.slugify(new.slug);
  end if;

  return new;
end;
$$;

create trigger teams_slug_trigger
before insert or update on public.teams
for each row execute function public.sync_team_slug();

create or replace function public.refresh_match_scores(target_match_id uuid)
returns void
language plpgsql
as $$
declare
  current_match public.matches%rowtype;
  a_wins integer := 0;
  b_wins integer := 0;
  wins_needed integer := 0;
  next_status public.match_status;
  next_winner uuid;
  next_loser uuid;
begin
  select *
    into current_match
  from public.matches
  where id = target_match_id;

  if not found then
    return;
  end if;

  select count(*)::integer
    into a_wins
  from public.match_games mg
  where mg.match_id = current_match.id
    and mg.status = 'finished'
    and mg.winner_team_id = current_match.team_a_id;

  select count(*)::integer
    into b_wins
  from public.match_games mg
  where mg.match_id = current_match.id
    and mg.status = 'finished'
    and mg.winner_team_id = current_match.team_b_id;

  wins_needed := public.required_series_wins(current_match.best_of);
  next_winner := null;
  next_loser := null;

  if a_wins >= wins_needed and current_match.team_a_id is not null then
    next_winner := current_match.team_a_id;
    next_loser := current_match.team_b_id;
  elsif b_wins >= wins_needed and current_match.team_b_id is not null then
    next_winner := current_match.team_b_id;
    next_loser := current_match.team_a_id;
  end if;

  if current_match.status = 'cancelled' then
    next_status := 'cancelled';
  elsif next_winner is not null then
    next_status := 'finished';
  elsif exists (
    select 1
    from public.match_games mg
    where mg.match_id = current_match.id
      and mg.status = 'live'
  ) then
    next_status := 'live';
  else
    next_status := 'scheduled';
  end if;

  update public.matches
     set score_a_total = a_wins,
         score_b_total = b_wins,
         winner_team_id = next_winner,
         loser_team_id = next_loser,
         status = next_status,
         ended_at = case
           when next_winner is not null then coalesce(current_match.ended_at, now())
           when next_status <> 'finished' then null
           else current_match.ended_at
         end
   where id = current_match.id;
end;
$$;

create or replace function public.refresh_match_scores_trigger()
returns trigger
language plpgsql
as $$
declare
  affected_match_id uuid;
begin
  if tg_op = 'DELETE' then
    affected_match_id := old.match_id;
  else
    affected_match_id := new.match_id;
  end if;

  if tg_op = 'UPDATE' and old.match_id is distinct from new.match_id then
    perform public.refresh_match_scores(old.match_id);
  end if;

  perform public.refresh_match_scores(affected_match_id);
  return null;
end;
$$;

create trigger match_games_refresh_match_scores_trigger
after insert or update or delete on public.match_games
for each row execute function public.refresh_match_scores_trigger();

create or replace function public.promote_registration_to_team(
  target_registration_id uuid,
  approver_user_id uuid,
  target_seed_number integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  registration_row public.registrations%rowtype;
  created_team_id uuid;
  slots_left integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to approve registrations';
  end if;

  if approver_user_id is distinct from auth.uid() then
    raise exception 'Approver user mismatch';
  end if;

  if not public.is_admin('admin') then
    raise exception 'Admin role required to approve registrations';
  end if;

  select *
    into registration_row
  from public.registrations
  where id = target_registration_id
  for update;

  if not found then
    raise exception 'Registration % not found', target_registration_id;
  end if;

  select id
    into created_team_id
  from public.teams
  where registration_id = registration_row.id;

  if created_team_id is not null then
    update public.registrations
       set status = 'approved',
           approved_at = coalesce(approved_at, now()),
           approved_by = coalesce(approved_by, approver_user_id),
           reviewed_at = coalesce(reviewed_at, now()),
           updated_by = approver_user_id
     where id = registration_row.id;

    return created_team_id;
  end if;

  slots_left := coalesce(public.remaining_team_slots(registration_row.tournament_id), 0);

  if slots_left <= 0 then
    raise exception 'No team slots remaining for tournament %', registration_row.tournament_id;
  end if;

  insert into public.teams (
    tournament_id,
    registration_id,
    status,
    seed_number,
    name,
    slug,
    short_name,
    captain_name,
    captain_contact,
    captain_email,
    region,
    city,
    logo_path,
    approved_at,
    approved_by,
    created_by,
    updated_by
  )
  values (
    registration_row.tournament_id,
    registration_row.id,
    'active',
    target_seed_number,
    registration_row.team_name,
    public.slugify(coalesce(nullif(registration_row.team_slug, ''), registration_row.team_name)),
    registration_row.team_short_name,
    registration_row.captain_name,
    registration_row.captain_contact,
    registration_row.captain_email,
    registration_row.region,
    registration_row.city,
    registration_row.logo_path,
    now(),
    approver_user_id,
    approver_user_id,
    approver_user_id
  )
  returning id into created_team_id;

  insert into public.team_players (
    team_id,
    display_name,
    in_game_name,
    game_uid,
    game_server,
    roster_role,
    is_captain,
    is_active,
    sort_order,
    created_by,
    updated_by
  )
  select
    created_team_id,
    rp.display_name,
    rp.in_game_name,
    rp.game_uid,
    rp.game_server,
    rp.roster_role,
    rp.is_captain,
    true,
    rp.sort_order,
    approver_user_id,
    approver_user_id
  from public.registration_players rp
  where rp.registration_id = registration_row.id
  order by rp.sort_order asc, rp.created_at asc;

  update public.registrations
     set status = 'approved',
         reviewed_at = now(),
         approved_at = now(),
         approved_by = approver_user_id,
         rejected_at = null,
         waitlisted_at = null,
         updated_by = approver_user_id
   where id = registration_row.id;

  return created_team_id;
end;
$$;

create or replace view public.registration_roster_counts as
select
  rp.registration_id,
  count(*)::integer as total_players,
  count(*) filter (where rp.roster_role <> 'substitute')::integer as active_players,
  count(*) filter (where rp.is_captain = true)::integer as captain_count
from public.registration_players rp
group by rp.registration_id;

create or replace view public.team_roster_counts as
select
  tp.team_id,
  count(*)::integer as total_players,
  count(*) filter (where tp.roster_role <> 'substitute' and tp.is_active = true)::integer as active_players,
  count(*) filter (where tp.is_captain = true and tp.is_active = true)::integer as captain_count
from public.team_players tp
group by tp.team_id;

create or replace view public.tournament_slot_summary as
select
  t.id as tournament_id,
  t.name as tournament_name,
  t.team_slot_limit,
  coalesce(team_counts.approved_team_count, 0) as approved_team_count,
  coalesce(registration_counts.pending_registration_count, 0) as pending_registration_count,
  coalesce(registration_counts.waitlisted_registration_count, 0) as waitlisted_registration_count,
  greatest(
    t.team_slot_limit - coalesce(team_counts.approved_team_count, 0),
    0
  ) as remaining_slots
from public.tournaments t
left join lateral (
  select count(team.id)::integer as approved_team_count
  from public.teams team
  where team.tournament_id = t.id
    and team.status in ('active', 'eliminated', 'champion')
) team_counts on true
left join lateral (
  select
    count(r.id) filter (where r.status = 'pending')::integer as pending_registration_count,
    count(r.id) filter (where r.status = 'waitlisted')::integer as waitlisted_registration_count
  from public.registrations r
  where r.tournament_id = t.id
) registration_counts on true;
