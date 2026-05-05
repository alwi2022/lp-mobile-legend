import { createClient } from "../supabase/server";

export async function getPrimaryTournament() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, slug, name, status, format, team_slot_limit, roster_min_players, roster_max_players, timezone, is_featured, registration_open_at, registration_close_at, check_in_deadline, technical_meeting_at, kickoff_at, grand_final_at, created_at",
    )
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    tournament: data ?? null,
    error: error?.message ?? null,
  };
}
