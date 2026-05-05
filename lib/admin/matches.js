import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

export const MATCH_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "live", label: "Berlangsung" },
  { value: "finished", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export const MATCH_STATUS_OPTIONS = [
  { value: "scheduled", label: "Terjadwal" },
  { value: "live", label: "Berlangsung" },
  { value: "finished", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export const MATCH_GAME_STATUS_OPTIONS = [
  { value: "scheduled", label: "Terjadwal" },
  { value: "live", label: "Berlangsung" },
  { value: "finished", label: "Selesai" },
  { value: "void", label: "Tidak Sah" },
];

export const BEST_OF_OPTIONS = [1, 3, 5, 7];

export function normalizeMatchFilter(value) {
  const validValues = new Set(MATCH_FILTERS.map((item) => item.value));
  return validValues.has(value) ? value : "all";
}

function withString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getRelationName(value) {
  if (Array.isArray(value)) {
    return withString(value[0]?.name, "");
  }

  return withString(value?.name, "");
}

function getTeamOptionLabel(team) {
  if (team.seed_number) {
    return `${team.name} | Unggulan #${team.seed_number}`;
  }

  if (team.short_name) {
    return `${team.name} | ${team.short_name}`;
  }

  return team.name;
}

function getMatchDisplayName(match) {
  const teamA = match.team_a_name || match.team_a_placeholder || "TBD";
  const teamB = match.team_b_name || match.team_b_placeholder || "TBD";
  return `${teamA} vs ${teamB}`;
}

function mapGameRow(game) {
  return {
    ...game,
    winner_team_name: getRelationName(game.winner_team),
  };
}

export async function getAdminMatchesPageData(filter = "all") {
  const activeFilter = normalizeMatchFilter(filter);
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      activeFilter,
      teams: [],
      matches: [],
      summary: null,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      activeFilter,
      teams: [],
      matches: [],
      summary: null,
      error: null,
    };
  }

  const supabase = await createClient();
  let matchesQuery = supabase
    .from("matches")
    .select(
      "id, stage_name, round_name, round_number, match_number, status, best_of, scheduled_at, venue_name, team_a_id, team_b_id, team_a_placeholder, team_b_placeholder, winner_team_id, loser_team_id, score_a_total, score_b_total, notes, created_at, published_at, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name), winner_team:teams!matches_winner_team_id_fkey(name), loser_team:teams!matches_loser_team_id_fkey(name)",
    )
    .eq("tournament_id", primary.tournament.id)
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true });

  if (activeFilter !== "all") {
    matchesQuery = matchesQuery.eq("status", activeFilter);
  }

  const [{ data: matchesData, error: matchesError }, { data: teamsData, error: teamsError }] =
    await Promise.all([
      matchesQuery,
      supabase
        .from("teams")
        .select("id, name, short_name, seed_number, status")
        .eq("tournament_id", primary.tournament.id)
        .neq("status", "archived")
        .order("seed_number", { ascending: true, nullsFirst: false })
        .order("approved_at", { ascending: true }),
    ]);

  if (matchesError || teamsError) {
    return {
      tournament: primary.tournament,
      activeFilter,
      teams: [],
      matches: [],
      summary: null,
      error:
        matchesError?.message || teamsError?.message || "Gagal memuat data pertandingan.",
    };
  }

  const teams = (teamsData || []).map((team) => ({
    ...team,
    option_label: getTeamOptionLabel(team),
  }));
  const teamNamesById = Object.fromEntries(teams.map((team) => [team.id, team.name]));

  const baseMatches = (matchesData || []).map((match) => ({
    ...match,
    team_a_name: getRelationName(match.team_a) || teamNamesById[match.team_a_id] || "",
    team_b_name: getRelationName(match.team_b) || teamNamesById[match.team_b_id] || "",
    winner_team_name: getRelationName(match.winner_team),
    loser_team_name: getRelationName(match.loser_team),
  }));

  const matchesWithDisplayNames = baseMatches.map((match) => ({
    ...match,
    display_name: getMatchDisplayName(match),
  }));

  const matchIds = matchesWithDisplayNames.map((match) => match.id);
  let gamesByMatchId = {};
  let gamesError = null;

  if (matchIds.length) {
    const { data: gamesData, error } = await supabase
      .from("match_games")
      .select(
        "id, match_id, game_number, status, started_at, ended_at, winner_team_id, team_a_score, team_b_score, notes, winner_team:teams!match_games_winner_team_id_fkey(name)",
      )
      .in("match_id", matchIds)
      .order("game_number", { ascending: true });

    gamesError = error?.message || null;

    if (gamesData) {
      gamesByMatchId = gamesData
        .map(mapGameRow)
        .reduce((accumulator, game) => {
          if (!accumulator[game.match_id]) {
            accumulator[game.match_id] = [];
          }

          accumulator[game.match_id].push(game);
          return accumulator;
        }, {});
    }
  }

  const matches = matchesWithDisplayNames.map((match) => {
    const games = gamesByMatchId[match.id] || [];

    return {
      ...match,
      games,
      next_game_number: Math.max(games.length + 1, 1),
    };
  });

  const summary = {
    total_count: matches.length,
    scheduled_count: matches.filter((match) => match.status === "scheduled").length,
    live_count: matches.filter((match) => match.status === "live").length,
    finished_count: matches.filter((match) => match.status === "finished").length,
    cancelled_count: matches.filter((match) => match.status === "cancelled").length,
    total_games_count: matches.reduce((total, match) => total + match.games.length, 0),
  };

  return {
    tournament: primary.tournament,
    activeFilter,
    teams,
    matches,
    summary,
    error: gamesError,
  };
}

export async function getAdminMatchDetailData(matchId) {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      teams: [],
      match: null,
      error: primary.error,
    };
  }

  if (!primary.tournament || !matchId) {
    return {
      tournament: primary.tournament || null,
      teams: [],
      match: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const [
    { data: matchData, error: matchError },
    { data: teamsData, error: teamsError },
    { data: gamesData, error: gamesError },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, stage_name, round_name, round_number, match_number, status, best_of, scheduled_at, venue_name, team_a_id, team_b_id, team_a_placeholder, team_b_placeholder, winner_team_id, loser_team_id, score_a_total, score_b_total, notes, created_at, published_at, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name), winner_team:teams!matches_winner_team_id_fkey(name), loser_team:teams!matches_loser_team_id_fkey(name)",
      )
      .eq("tournament_id", primary.tournament.id)
      .eq("id", matchId)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, short_name, seed_number, status")
      .eq("tournament_id", primary.tournament.id)
      .neq("status", "archived")
      .order("seed_number", { ascending: true, nullsFirst: false })
      .order("approved_at", { ascending: true }),
    supabase
      .from("match_games")
      .select(
        "id, match_id, game_number, status, started_at, ended_at, winner_team_id, team_a_score, team_b_score, notes, winner_team:teams!match_games_winner_team_id_fkey(name)",
      )
      .eq("match_id", matchId)
      .order("game_number", { ascending: true }),
  ]);

  if (matchError || teamsError || gamesError) {
    return {
      tournament: primary.tournament,
      teams: [],
      match: null,
      error:
        matchError?.message ||
        teamsError?.message ||
        gamesError?.message ||
        "Gagal memuat detail pertandingan.",
    };
  }

  if (!matchData) {
    return {
      tournament: primary.tournament,
      teams: [],
      match: null,
      error: null,
    };
  }

  const teams = (teamsData || []).map((team) => ({
    ...team,
    option_label: getTeamOptionLabel(team),
  }));
  const teamNamesById = Object.fromEntries(teams.map((team) => [team.id, team.name]));

  const mappedGames = (gamesData || []).map(mapGameRow);
  const match = {
    ...matchData,
    team_a_name: getRelationName(matchData.team_a) || teamNamesById[matchData.team_a_id] || "",
    team_b_name: getRelationName(matchData.team_b) || teamNamesById[matchData.team_b_id] || "",
    winner_team_name: getRelationName(matchData.winner_team),
    loser_team_name: getRelationName(matchData.loser_team),
    games: mappedGames,
    next_game_number: Math.max(mappedGames.length + 1, 1),
  };
  match.display_name = getMatchDisplayName(match);

  return {
    tournament: primary.tournament,
    teams,
    match,
    error: null,
  };
}
