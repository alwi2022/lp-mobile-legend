import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

export const REGISTRATION_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "waitlisted", label: "Daftar Tunggu" },
  { value: "rejected", label: "Ditolak" },
];

export function normalizeRegistrationFilter(value) {
  const validValues = new Set(REGISTRATION_FILTERS.map((item) => item.value));
  return validValues.has(value) ? value : "all";
}

export async function getAdminRegistrationsPageData(filter = "all") {
  const activeFilter = normalizeRegistrationFilter(filter);
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      activeFilter,
      registrations: [],
      summary: null,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      activeFilter,
      registrations: [],
      summary: null,
      error: null,
    };
  }

  const supabase = await createClient();
  let registrationQuery = supabase
    .from("registrations")
    .select(
      "id, submission_code, status, team_name, team_short_name, captain_name, captain_contact, captain_email, region, city, admin_notes, submitted_at, reviewed_at, approved_at, rejected_at, waitlisted_at",
    )
    .eq("tournament_id", primary.tournament.id)
    .order("submitted_at", { ascending: false });

  if (activeFilter !== "all") {
    registrationQuery = registrationQuery.eq("status", activeFilter);
  }

  const [{ data: registrations, error: registrationsError }, { data: slotSummary, error: summaryError }, { count: rejectedCount, error: rejectedCountError }] =
    await Promise.all([
      registrationQuery,
      supabase
        .from("tournament_slot_summary")
        .select("*")
        .eq("tournament_id", primary.tournament.id)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", primary.tournament.id)
        .eq("status", "rejected"),
    ]);

  if (registrationsError || summaryError || rejectedCountError) {
    return {
      tournament: primary.tournament,
      activeFilter,
      registrations: [],
      summary: null,
      error:
        registrationsError?.message ||
        summaryError?.message ||
        rejectedCountError?.message ||
        "Gagal memuat data registrations.",
    };
  }

  const registrationIds = (registrations || []).map((item) => item.id);

  let rosterCountsByRegistrationId = {};
  let officialTeamsByRegistrationId = {};

  if (registrationIds.length) {
    const [{ data: rosterCounts, error: rosterError }, { data: teams, error: teamsError }] =
      await Promise.all([
        supabase
          .from("registration_roster_counts")
          .select("registration_id, total_players, active_players, captain_count")
          .in("registration_id", registrationIds),
        supabase
          .from("teams")
          .select("id, registration_id, name, status, seed_number")
          .in("registration_id", registrationIds),
      ]);

    if (rosterError || teamsError) {
      return {
        tournament: primary.tournament,
        activeFilter,
        registrations: [],
        summary: null,
        error: rosterError?.message || teamsError?.message || "Gagal memuat detail roster/team.",
      };
    }

    rosterCountsByRegistrationId = Object.fromEntries(
      (rosterCounts || []).map((item) => [item.registration_id, item]),
    );

    officialTeamsByRegistrationId = Object.fromEntries(
      (teams || []).map((item) => [item.registration_id, item]),
    );
  }

  const mappedRegistrations = (registrations || []).map((registration) => ({
    ...registration,
    roster_counts: rosterCountsByRegistrationId[registration.id] || {
      total_players: 0,
      active_players: 0,
      captain_count: 0,
    },
    official_team: officialTeamsByRegistrationId[registration.id] || null,
  }));

  return {
    tournament: primary.tournament,
    activeFilter,
    registrations: mappedRegistrations,
    summary: {
      approved_team_count: slotSummary?.approved_team_count || 0,
      pending_registration_count: slotSummary?.pending_registration_count || 0,
      waitlisted_registration_count: slotSummary?.waitlisted_registration_count || 0,
      rejected_registration_count: rejectedCount || 0,
      remaining_slots: slotSummary?.remaining_slots ?? primary.tournament.team_slot_limit,
      team_slot_limit: slotSummary?.team_slot_limit ?? primary.tournament.team_slot_limit,
    },
    error: null,
  };
}

export async function getAdminRegistrationDetailData(registrationId) {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      registration: null,
      players: [],
      error: primary.error,
    };
  }

  if (!primary.tournament || !registrationId) {
    return {
      tournament: primary.tournament || null,
      registration: null,
      players: [],
      error: null,
    };
  }

  const supabase = await createClient();
  const [
    { data: registration, error: registrationError },
    { data: rosterCounts, error: rosterError },
    { data: officialTeam, error: teamError },
    { data: players, error: playersError },
  ] = await Promise.all([
    supabase
      .from("registrations")
      .select(
        "id, submission_code, status, team_name, team_short_name, captain_name, captain_contact, captain_email, region, city, team_bio, admin_notes, submitted_at, reviewed_at, approved_at, rejected_at, waitlisted_at",
      )
      .eq("tournament_id", primary.tournament.id)
      .eq("id", registrationId)
      .maybeSingle(),
    supabase
      .from("registration_roster_counts")
      .select("registration_id, total_players, active_players, captain_count")
      .eq("registration_id", registrationId)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, registration_id, name, slug, status, seed_number")
      .eq("registration_id", registrationId)
      .maybeSingle(),
    supabase
      .from("registration_players")
      .select(
        "id, display_name, in_game_name, game_uid, game_server, roster_role, is_captain, sort_order, created_at",
      )
      .eq("registration_id", registrationId)
      .order("sort_order", { ascending: true }),
  ]);

  if (registrationError || rosterError || teamError || playersError) {
    return {
      tournament: primary.tournament,
      registration: null,
      players: [],
      error:
        registrationError?.message ||
        rosterError?.message ||
        teamError?.message ||
        playersError?.message ||
        "Gagal memuat detail pendaftaran.",
    };
  }

  if (!registration) {
    return {
      tournament: primary.tournament,
      registration: null,
      players: [],
      error: null,
    };
  }

  return {
    tournament: primary.tournament,
    registration: {
      ...registration,
      roster_counts: rosterCounts || {
        total_players: 0,
        active_players: 0,
        captain_count: 0,
      },
      official_team: officialTeam || null,
    },
    players: players || [],
    error: null,
  };
}
