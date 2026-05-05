function getRelationName(value) {
  if (Array.isArray(value)) {
    return typeof value[0]?.name === "string" ? value[0].name : "";
  }

  return typeof value?.name === "string" ? value.name : "";
}

export async function syncMatchPairingsFromSlots(supabase, tournamentId, userId) {
  const [
    { data: slotsData, error: slotsError },
    { data: matchesData, error: matchesError },
    { data: teamsData, error: teamsError },
  ] = await Promise.all([
    supabase
      .from("bracket_slots")
      .select("id, match_id, slot_side, team_id, display_label")
      .eq("tournament_id", tournamentId),
    supabase.from("matches").select("id, tournament_id").eq("tournament_id", tournamentId),
    supabase
      .from("teams")
      .select("id, name")
      .eq("tournament_id", tournamentId),
  ]);

  if (slotsError || matchesError || teamsError) {
    return (
      slotsError?.message ||
      matchesError?.message ||
      teamsError?.message ||
      "Gagal sync pairings."
    );
  }

  const teamNamesById = Object.fromEntries((teamsData || []).map((team) => [team.id, team.name]));
  const slotsByMatchId = (slotsData || []).reduce((accumulator, slot) => {
    if (!accumulator[slot.match_id]) {
      accumulator[slot.match_id] = {};
    }

    accumulator[slot.match_id][slot.slot_side] = slot;
    return accumulator;
  }, {});

  for (const match of matchesData || []) {
    const matchSlots = slotsByMatchId[match.id] || {};
    const teamASlot = matchSlots.team_a || null;
    const teamBSlot = matchSlots.team_b || null;

    const teamAId = teamASlot?.team_id || null;
    const teamBId = teamBSlot?.team_id || null;
    const teamAPlaceholder =
      teamAId ? teamNamesById[teamAId] || null : teamASlot?.display_label || null;
    const teamBPlaceholder =
      teamBId ? teamNamesById[teamBId] || null : teamBSlot?.display_label || null;

    const { error } = await supabase
      .from("matches")
      .update({
        team_a_id: teamAId,
        team_b_id: teamBId,
        team_a_placeholder: teamAId ? null : teamAPlaceholder,
        team_b_placeholder: teamBId ? null : teamBPlaceholder,
        updated_by: userId,
      })
      .eq("id", match.id)
      .eq("tournament_id", tournamentId);

    if (error) {
      return error.message;
    }
  }

  return null;
}

export async function propagateBracketResults(supabase, tournamentId, userId) {
  const [
    { data: slotsData, error: slotsError },
    { data: matchesData, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("bracket_slots")
      .select(
        "id, match_id, team_id, display_label, source_match_id, source_outcome, source_match:matches!bracket_slots_source_match_id_fkey(id, round_name, match_number), team:teams!bracket_slots_team_id_fkey(name)",
      )
      .eq("tournament_id", tournamentId),
    supabase
      .from("matches")
      .select(
        "id, round_name, match_number, winner_team_id, loser_team_id, winner_team:teams!matches_winner_team_id_fkey(name), loser_team:teams!matches_loser_team_id_fkey(name)",
      )
      .eq("tournament_id", tournamentId),
  ]);

  if (slotsError || matchesError) {
    return slotsError?.message || matchesError?.message || "Gagal membaca source bracket.";
  }

  const matchesById = Object.fromEntries((matchesData || []).map((match) => [match.id, match]));

  for (const slot of slotsData || []) {
    if (!slot.source_match_id || !slot.source_outcome) {
      continue;
    }

    const sourceMatch = matchesById[slot.source_match_id];

    if (!sourceMatch) {
      continue;
    }

    const nextTeamId =
      slot.source_outcome === "winner" ? sourceMatch.winner_team_id : sourceMatch.loser_team_id;
    const fallbackLabel =
      slot.source_outcome === "winner"
        ? `Pemenang ${sourceMatch.round_name || `Pertandingan ${sourceMatch.match_number}`}`
        : `Kalah dari ${sourceMatch.round_name || `Pertandingan ${sourceMatch.match_number}`}`;
    const nextLabel =
      nextTeamId
        ? slot.source_outcome === "winner"
          ? getRelationName(sourceMatch.winner_team)
          : getRelationName(sourceMatch.loser_team)
        : fallbackLabel;

    if (nextTeamId === slot.team_id && nextLabel === slot.display_label) {
      continue;
    }

    const { error } = await supabase
      .from("bracket_slots")
      .update({
        team_id: nextTeamId || null,
        display_label: nextTeamId ? nextLabel || null : nextLabel,
        updated_by: userId,
      })
      .eq("id", slot.id)
      .eq("tournament_id", tournamentId);

    if (error) {
      return error.message;
    }
  }

  return null;
}

export async function syncBracketState(supabase, tournamentId, userId) {
  const propagationError = await propagateBracketResults(supabase, tournamentId, userId);

  if (propagationError) {
    return propagationError;
  }

  return syncMatchPairingsFromSlots(supabase, tournamentId, userId);
}
