import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

export const BRACKET_SLOT_SIDE_OPTIONS = [
  { value: "team_a", label: "Tim A" },
  { value: "team_b", label: "Tim B" },
];

export const BRACKET_SOURCE_OUTCOME_OPTIONS = [
  { value: "winner", label: "Pemenang" },
  { value: "loser", label: "Kalah" },
];

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
  return `${match.round_name} | Pertandingan ${match.match_number} | ${teamA} vs ${teamB}`;
}

export async function getAdminBracketPageData() {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      teams: [],
      matches: [],
      slots: [],
      summary: null,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      teams: [],
      matches: [],
      slots: [],
      summary: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const [
    { data: teamsData, error: teamsError },
    { data: matchesData, error: matchesError },
    { data: slotsData, error: slotsError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, short_name, seed_number, status")
      .eq("tournament_id", primary.tournament.id)
      .neq("status", "archived")
      .order("seed_number", { ascending: true, nullsFirst: false })
      .order("approved_at", { ascending: true }),
    supabase
      .from("matches")
      .select(
        "id, round_name, round_number, match_number, status, team_a_id, team_b_id, team_a_placeholder, team_b_placeholder, winner_team_id, loser_team_id, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name), winner_team:teams!matches_winner_team_id_fkey(name), loser_team:teams!matches_loser_team_id_fkey(name)",
      )
      .eq("tournament_id", primary.tournament.id)
      .order("round_number", { ascending: true })
      .order("match_number", { ascending: true }),
    supabase
      .from("bracket_slots")
      .select(
        "id, match_id, slot_side, round_number, slot_number, team_id, display_label, source_match_id, source_outcome, seed_number, is_bye, team:teams!bracket_slots_team_id_fkey(name), source_match:matches!bracket_slots_source_match_id_fkey(round_name, match_number)",
      )
      .eq("tournament_id", primary.tournament.id)
      .order("round_number", { ascending: true })
      .order("slot_number", { ascending: true }),
  ]);

  if (teamsError || matchesError || slotsError) {
    return {
      tournament: primary.tournament,
      teams: [],
      matches: [],
      slots: [],
      summary: null,
      error:
        teamsError?.message ||
        matchesError?.message ||
        slotsError?.message ||
        "Gagal memuat data bracket.",
    };
  }

  const teams = (teamsData || []).map((team) => ({
    ...team,
    option_label: team.seed_number ? `${team.name} | Unggulan #${team.seed_number}` : team.name,
  }));
  const teamNamesById = Object.fromEntries(teams.map((team) => [team.id, team.name]));

  const matches = (matchesData || []).map((match) => ({
    ...match,
    team_a_name: getRelationName(match.team_a) || teamNamesById[match.team_a_id] || "",
    team_b_name: getRelationName(match.team_b) || teamNamesById[match.team_b_id] || "",
    winner_team_name: getRelationName(match.winner_team),
    loser_team_name: getRelationName(match.loser_team),
  })).map((match) => ({
    ...match,
    label: mapMatchLabel({
      ...match,
      team_a: { name: match.team_a_name },
      team_b: { name: match.team_b_name },
    }),
  }));

  const slots = (slotsData || []).map((slot) => ({
    ...slot,
    team_name: getRelationName(slot.team),
    source_match_label: slot.source_match
      ? `${slot.source_match.round_name} | Pertandingan ${slot.source_match.match_number}`
      : "",
  }));

  const slotsByMatchId = slots.reduce((accumulator, slot) => {
    if (!accumulator[slot.match_id]) {
      accumulator[slot.match_id] = [];
    }

    accumulator[slot.match_id].push(slot);
    return accumulator;
  }, {});

  const matchesWithSlots = matches.map((match) => ({
    ...match,
    bracket_slots: slotsByMatchId[match.id] || [],
  }));

  const summary = {
    total_slots: slots.length,
    linked_slots: slots.filter((slot) => slot.source_match_id).length,
    assigned_slots: slots.filter((slot) => slot.team_id).length,
    bye_slots: slots.filter((slot) => slot.is_bye).length,
    matches_with_slots: matchesWithSlots.filter((match) => match.bracket_slots.length).length,
  };

  return {
    tournament: primary.tournament,
    teams,
    matches: matchesWithSlots,
    slots,
    summary,
    error: null,
  };
}

export async function getAdminBracketMatchDetailData(matchId) {
  const pageData = await getAdminBracketPageData();

  if (pageData.error || !pageData.tournament) {
    return {
      tournament: pageData.tournament,
      teams: pageData.teams || [],
      sourceMatches: pageData.matches || [],
      match: null,
      error: pageData.error,
    };
  }

  const match = pageData.matches.find((item) => item.id === matchId) || null;

  return {
    tournament: pageData.tournament,
    teams: pageData.teams,
    sourceMatches: pageData.matches,
    match,
    error: null,
  };
}
