import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

export const TEAM_STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "eliminated", label: "Tereliminasi" },
  { value: "champion", label: "Juara" },
  { value: "archived", label: "Diarsipkan" },
];

export const ROSTER_ROLE_OPTIONS = [
  { value: "captain", label: "Kapten" },
  { value: "player", label: "Pemain" },
  { value: "substitute", label: "Cadangan" },
];

function withString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function getAdminTeamsPageData() {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      teams: [],
      summary: null,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      teams: [],
      summary: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const [{ data: teamsData, error: teamsError }, { data: rosterCountsData, error: rosterCountsError }] =
    await Promise.all([
      supabase
        .from("teams")
        .select(
          "id, registration_id, status, seed_number, name, slug, short_name, captain_name, captain_contact, captain_email, region, city, logo_path, approved_at, eliminated_at, eliminated_round, placement, notes, created_at",
        )
        .eq("tournament_id", primary.tournament.id)
        .order("seed_number", { ascending: true, nullsFirst: false })
        .order("approved_at", { ascending: true }),
      supabase
        .from("team_roster_counts")
        .select("team_id, total_players, active_players, captain_count"),
    ]);

  if (teamsError || rosterCountsError) {
    return {
      tournament: primary.tournament,
      teams: [],
      summary: null,
      error: teamsError?.message || rosterCountsError?.message || "Gagal memuat data teams.",
    };
  }

  const teamIds = (teamsData || []).map((team) => team.id);
  let playersByTeamId = {};
  let playersError = null;

  if (teamIds.length) {
    const { data: teamPlayersData, error } = await supabase
      .from("team_players")
      .select(
        "id, team_id, display_name, in_game_name, game_uid, game_server, roster_role, is_captain, is_active, sort_order, created_at",
      )
      .in("team_id", teamIds)
      .order("sort_order", { ascending: true });

    playersError = error?.message || null;

    if (teamPlayersData) {
      playersByTeamId = teamPlayersData.reduce((accumulator, player) => {
        if (!accumulator[player.team_id]) {
          accumulator[player.team_id] = [];
        }

        accumulator[player.team_id].push(player);
        return accumulator;
      }, {});
    }
  }

  const rosterCountsByTeamId = Object.fromEntries(
    (rosterCountsData || []).map((item) => [item.team_id, item]),
  );

  const teams = (teamsData || []).map((team) => ({
    ...team,
    roster_counts: rosterCountsByTeamId[team.id] || {
      total_players: 0,
      active_players: 0,
      captain_count: 0,
    },
    players: playersByTeamId[team.id] || [],
  }));

  const summary = {
    total_count: teams.length,
    active_count: teams.filter((team) => team.status === "active").length,
    eliminated_count: teams.filter((team) => team.status === "eliminated").length,
    champion_count: teams.filter((team) => team.status === "champion").length,
    archived_count: teams.filter((team) => team.status === "archived").length,
    seeded_count: teams.filter((team) => Number.isInteger(team.seed_number)).length,
    roster_count: teams.reduce(
      (total, team) => total + (team.roster_counts.total_players || 0),
      0,
    ),
  };

  return {
    tournament: primary.tournament,
    teams,
    summary,
    error: playersError,
  };
}

export async function getAdminTeamDetailData(teamId) {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      team: null,
      players: [],
      rosterCounts: null,
      error: primary.error,
    };
  }

  if (!primary.tournament || !teamId) {
    return {
      tournament: primary.tournament || null,
      team: null,
      players: [],
      rosterCounts: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const [
    { data: team, error: teamError },
    { data: rosterCounts, error: rosterCountsError },
    { data: players, error: playersError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id, registration_id, status, seed_number, name, slug, short_name, captain_name, captain_contact, captain_email, region, city, logo_path, approved_at, approved_by, eliminated_at, eliminated_round, placement, notes, created_at",
      )
      .eq("tournament_id", primary.tournament.id)
      .eq("id", teamId)
      .maybeSingle(),
    supabase
      .from("team_roster_counts")
      .select("team_id, total_players, active_players, captain_count")
      .eq("team_id", teamId)
      .maybeSingle(),
    supabase
      .from("team_players")
      .select(
        "id, team_id, display_name, in_game_name, game_uid, game_server, roster_role, is_captain, is_active, sort_order, created_at",
      )
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
  ]);

  if (teamError || rosterCountsError || playersError) {
    return {
      tournament: primary.tournament,
      team: null,
      players: [],
      rosterCounts: null,
      error:
        teamError?.message ||
        rosterCountsError?.message ||
        playersError?.message ||
        "Gagal memuat detail tim.",
    };
  }

  if (!team) {
    return {
      tournament: primary.tournament,
      team: null,
      players: [],
      rosterCounts: null,
      error: null,
    };
  }

  return {
    tournament: primary.tournament,
    team,
    players: players || [],
    rosterCounts: rosterCounts || {
      team_id: teamId,
      total_players: 0,
      active_players: 0,
      captain_count: 0,
    },
    error: null,
  };
}
