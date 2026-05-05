-- Allow match score refresh to run from match_games triggers without granting
-- direct function execution to authenticated users.
alter function public.refresh_match_scores(uuid)
  security definer
  set search_path = public;

alter function public.refresh_match_scores_trigger()
  security definer
  set search_path = public;

revoke execute on function public.refresh_match_scores(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_match_scores_trigger() from public, anon, authenticated;
