import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

function withString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getRelationName(value) {
  if (Array.isArray(value)) {
    return withString(value[0]?.name, "");
  }

  return withString(value?.name, "");
}

function mapMatchLabel(match) {
  const teamA = getRelationName(match.team_a) || withString(match.team_a_placeholder, "TBD");
  const teamB = getRelationName(match.team_b) || withString(match.team_b_placeholder, "TBD");
  return `${match.round_name} | ${teamA} vs ${teamB}`;
}

export async function getAdminDashboardData() {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      summary: null,
      nextMatch: null,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      summary: null,
      nextMatch: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const [
    { data: slotSummary, error: slotSummaryError },
    { data: teamsData, error: teamsError },
    { data: matchesData, error: matchesError },
    { data: streamsData, error: streamsError },
  ] = await Promise.all([
    supabase
      .from("tournament_slot_summary")
      .select("*")
      .eq("tournament_id", primary.tournament.id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, status, seed_number")
      .eq("tournament_id", primary.tournament.id),
    supabase
      .from("matches")
      .select(
        "id, status, scheduled_at, round_name, match_number, team_a_placeholder, team_b_placeholder, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name)",
      )
      .eq("tournament_id", primary.tournament.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("streams")
      .select("id, title, status, is_featured")
      .eq("tournament_id", primary.tournament.id),
  ]);

  if (slotSummaryError || teamsError || matchesError || streamsError) {
    return {
      tournament: primary.tournament,
      summary: null,
      nextMatch: null,
      error:
        slotSummaryError?.message ||
        teamsError?.message ||
        matchesError?.message ||
        streamsError?.message ||
        "Gagal memuat dashboard data.",
    };
  }

  const teams = teamsData || [];
  const matches = matchesData || [];
  const streams = streamsData || [];
  const now = Date.now();

  const nextMatch =
    matches
      .filter((match) => match.status === "live")
      .map((match) => ({
        ...match,
        label: mapMatchLabel(match),
      }))[0] ||
    matches
      .filter((match) => {
        if (!match.scheduled_at) {
          return false;
        }

        return match.status !== "finished" && new Date(match.scheduled_at).getTime() >= now;
      })
      .map((match) => ({
        ...match,
        label: mapMatchLabel(match),
      }))[0] ||
    null;

  return {
    tournament: primary.tournament,
    summary: {
      approved_team_count: slotSummary?.approved_team_count || 0,
      pending_registration_count: slotSummary?.pending_registration_count || 0,
      waitlisted_registration_count: slotSummary?.waitlisted_registration_count || 0,
      remaining_slots: slotSummary?.remaining_slots ?? primary.tournament.team_slot_limit,
      live_match_count: matches.filter((match) => match.status === "live").length,
      finished_match_count: matches.filter((match) => match.status === "finished").length,
      total_match_count: matches.length,
      live_stream_count: streams.filter((stream) => stream.status === "live").length,
      featured_stream_count: streams.filter((stream) => stream.is_featured).length,
      seeded_team_count: teams.filter((team) => Number.isInteger(team.seed_number)).length,
      champion_count: teams.filter((team) => team.status === "champion").length,
    },
    nextMatch,
    error: null,
  };
}
