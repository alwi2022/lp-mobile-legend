create or replace function public.admin_role_rank(input_role public.admin_role)
returns integer
language sql
immutable
as $$
  select case input_role
    when 'super_admin' then 300
    when 'admin' then 200
    when 'operator' then 100
    else 0
  end;
$$;

create or replace function public.is_admin(min_role public.admin_role default 'operator')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and a.is_active = true
      and public.admin_role_rank(a.role) >= public.admin_role_rank(min_role)
  );
$$;

grant usage on schema public to anon, authenticated;

grant select on public.tournaments to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.teams to anon, authenticated;
grant select on public.team_players to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.match_games to anon, authenticated;
grant select on public.bracket_slots to anon, authenticated;
grant select on public.streams to anon, authenticated;

grant select, insert, update, delete on public.admins to authenticated;
grant select, insert, update, delete on public.registrations to authenticated;
grant select, insert, update, delete on public.registration_players to authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_players to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.match_games to authenticated;
grant select, insert, update, delete on public.bracket_slots to authenticated;
grant select, insert, update, delete on public.streams to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.tournaments to authenticated;

grant select on public.registration_roster_counts to authenticated;
grant select on public.team_roster_counts to authenticated;
grant select on public.tournament_slot_summary to authenticated;

grant execute on function public.is_admin(public.admin_role) to authenticated;
grant execute on function public.remaining_team_slots(uuid) to anon, authenticated;
grant execute on function public.required_series_wins(integer) to anon, authenticated;

revoke execute on function public.promote_registration_to_team(uuid, uuid, integer) from public, anon;
grant execute on function public.promote_registration_to_team(uuid, uuid, integer) to authenticated;

revoke execute on function public.refresh_match_scores(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_match_scores_trigger() from public, anon, authenticated;

alter view public.registration_roster_counts set (security_invoker = true);
alter view public.team_roster_counts set (security_invoker = true);
alter view public.tournament_slot_summary set (security_invoker = true);

alter table public.tournaments enable row level security;
alter table public.site_settings enable row level security;
alter table public.admins enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_players enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_games enable row level security;
alter table public.bracket_slots enable row level security;
alter table public.streams enable row level security;

create policy "public read tournaments"
on public.tournaments
for select
to anon, authenticated
using (true);

create policy "admins manage tournaments"
on public.tournaments
for all
to authenticated
using (public.is_admin('admin'))
with check (public.is_admin('admin'));

create policy "public read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "admins manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_admin('admin'))
with check (public.is_admin('admin'));

create policy "admins select own profile"
on public.admins
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin('super_admin')
);

create policy "super admins insert admins"
on public.admins
for insert
to authenticated
with check (public.is_admin('super_admin'));

create policy "super admins update admins"
on public.admins
for update
to authenticated
using (public.is_admin('super_admin'))
with check (public.is_admin('super_admin'));

create policy "super admins delete admins"
on public.admins
for delete
to authenticated
using (public.is_admin('super_admin'));

create policy "admins manage registrations"
on public.registrations
for all
to authenticated
using (public.is_admin('operator'))
with check (public.is_admin('operator'));

create policy "admins manage registration players"
on public.registration_players
for all
to authenticated
using (public.is_admin('operator'))
with check (public.is_admin('operator'));

create policy "public read teams"
on public.teams
for select
to anon, authenticated
using (true);

create policy "admins manage teams"
on public.teams
for all
to authenticated
using (public.is_admin('admin'))
with check (public.is_admin('admin'));

create policy "public read team players"
on public.team_players
for select
to anon, authenticated
using (true);

create policy "admins manage team players"
on public.team_players
for all
to authenticated
using (public.is_admin('admin'))
with check (public.is_admin('admin'));

create policy "public read matches"
on public.matches
for select
to anon, authenticated
using (true);

create policy "admins manage matches"
on public.matches
for all
to authenticated
using (public.is_admin('operator'))
with check (public.is_admin('operator'));

create policy "public read match games"
on public.match_games
for select
to anon, authenticated
using (true);

create policy "admins manage match games"
on public.match_games
for all
to authenticated
using (public.is_admin('operator'))
with check (public.is_admin('operator'));

create policy "public read bracket slots"
on public.bracket_slots
for select
to anon, authenticated
using (true);

create policy "admins manage bracket slots"
on public.bracket_slots
for all
to authenticated
using (public.is_admin('admin'))
with check (public.is_admin('admin'));

create policy "public read streams"
on public.streams
for select
to anon, authenticated
using (true);

create policy "admins manage streams"
on public.streams
for all
to authenticated
using (public.is_admin('operator'))
with check (public.is_admin('operator'));
