"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";

function normalizeReturnTo(value, fallback = "/admin/teams") {
  const candidate = String(value || "").trim();

  if (!candidate.startsWith("/admin") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function buildTeamsRedirect(type, message, returnTo = "") {
  const basePath = normalizeReturnTo(returnTo);
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("message", message);
  return `${basePath}?${params.toString()}`;
}

function readText(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function readNullableText(formData, key) {
  const value = readText(formData, key);
  return value || null;
}

function readNullableInteger(formData, key) {
  const rawValue = readText(formData, key);

  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCheckbox(formData, key) {
  return formData.get(key) === "on";
}

function normalizeRosterRole(rosterRole, isCaptain) {
  if (isCaptain) {
    return "captain";
  }

  return rosterRole === "captain" ? "player" : rosterRole;
}

function ensureTeamAdmin(state) {
  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildTeamsRedirect("error", "Akses admin diperlukan."));
  }

  if (!["super_admin", "admin"].includes(state.admin.role)) {
    redirect(buildTeamsRedirect("error", "Peran admin diperlukan untuk mengelola tim."));
  }
}

function getTeamContext(formData) {
  return {
    teamId: readText(formData, "team_id"),
    tournamentId: readText(formData, "tournament_id"),
    returnTo: readText(formData, "return_to"),
    payload: {
      status: readText(formData, "status", "active"),
      seed_number: readNullableInteger(formData, "seed_number"),
      name: readText(formData, "name"),
      short_name: readNullableText(formData, "short_name"),
      captain_name: readText(formData, "captain_name"),
      captain_contact: readText(formData, "captain_contact"),
      captain_email: readNullableText(formData, "captain_email"),
      region: readText(formData, "region"),
      city: readNullableText(formData, "city"),
      logo_path: readNullableText(formData, "logo_path"),
      placement: readNullableInteger(formData, "placement"),
      eliminated_round: readNullableText(formData, "eliminated_round"),
      notes: readNullableText(formData, "notes"),
    },
  };
}

function getPlayerContext(formData) {
  const isCaptain = readCheckbox(formData, "is_captain");
  const rosterRole = normalizeRosterRole(
    readText(formData, "roster_role", "player"),
    isCaptain,
  );

  return {
    playerId: readText(formData, "player_id"),
    teamId: readText(formData, "team_id"),
    tournamentId: readText(formData, "tournament_id"),
    returnTo: readText(formData, "return_to"),
    payload: {
      display_name: readText(formData, "display_name"),
      in_game_name: readText(formData, "in_game_name"),
      game_uid: readNullableText(formData, "game_uid"),
      game_server: readNullableText(formData, "game_server"),
      roster_role: rosterRole,
      is_captain: isCaptain,
      is_active: readCheckbox(formData, "is_active"),
      sort_order: readNullableInteger(formData, "sort_order") || 1,
    },
  };
}

function validateTeamPayload(payload) {
  if (!payload.name) {
    return "Nama tim wajib diisi.";
  }

  if (!payload.captain_name || !payload.captain_contact) {
    return "Nama kapten dan kontak kapten wajib diisi.";
  }

  if (!payload.region) {
    return "Region wajib diisi.";
  }

  if (payload.seed_number !== null && payload.seed_number <= 0) {
    return "Nomor unggulan harus lebih dari 0.";
  }

  if (payload.placement !== null && payload.placement <= 0) {
    return "Peringkat harus lebih dari 0.";
  }

  return null;
}

function validatePlayerPayload(payload) {
  if (!payload.display_name || !payload.in_game_name) {
    return "Nama tampil dan nama dalam game wajib diisi.";
  }

  if (payload.sort_order <= 0) {
    return "Urutan tampil harus lebih dari 0.";
  }

  return null;
}

async function clearExistingCaptain(supabase, teamId, excludePlayerId = "") {
  let query = supabase
    .from("team_players")
    .update({
      is_captain: false,
      roster_role: "player",
    })
    .eq("team_id", teamId)
    .eq("is_captain", true);

  if (excludePlayerId) {
    query = query.neq("id", excludePlayerId);
  }

  return query;
}

function revalidateTeamPaths(teamId = "", registrationId = "") {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/registrations");

  if (teamId) {
    revalidatePath(`/admin/teams/${teamId}`);
  }

  if (registrationId) {
    revalidatePath(`/admin/registrations/${registrationId}`);
  }
}

export async function createTeamAction(formData) {
  const state = await getCurrentAdmin();
  ensureTeamAdmin(state);

  const { tournamentId, payload, returnTo } = getTeamContext(formData);

  if (!tournamentId) {
    redirect(buildTeamsRedirect("error", "ID turnamen tidak valid.", returnTo));
  }

  const validationError = validateTeamPayload(payload);
  if (validationError) {
    redirect(buildTeamsRedirect("error", validationError, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({
    tournament_id: tournamentId,
    ...payload,
    created_by: state.user.sub,
    updated_by: state.user.sub,
  });

  if (error) {
    redirect(buildTeamsRedirect("error", error.message, returnTo));
  }

  revalidateTeamPaths();
  redirect(buildTeamsRedirect("success", "Tim berhasil dibuat.", returnTo));
}

export async function updateTeamAction(formData) {
  const state = await getCurrentAdmin();
  ensureTeamAdmin(state);

  const { teamId, tournamentId, payload, returnTo } = getTeamContext(formData);

  if (!teamId || !tournamentId) {
    redirect(buildTeamsRedirect("error", "Konteks tim tidak valid.", returnTo));
  }

  const validationError = validateTeamPayload(payload);
  if (validationError) {
    redirect(buildTeamsRedirect("error", validationError, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({
      ...payload,
      updated_by: state.user.sub,
    })
    .eq("id", teamId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildTeamsRedirect("error", error.message, returnTo));
  }

  revalidateTeamPaths(teamId);
  redirect(buildTeamsRedirect("success", "Tim berhasil diperbarui.", returnTo));
}

export async function deleteTeamAction(formData) {
  const state = await getCurrentAdmin();
  ensureTeamAdmin(state);

  const { teamId, tournamentId, returnTo } = getTeamContext(formData);

  if (!teamId || !tournamentId) {
    redirect(buildTeamsRedirect("error", "Konteks tim tidak valid.", returnTo));
  }

  const supabase = await createClient();
  const { data: deletedTeam, error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("tournament_id", tournamentId)
    .select("id, registration_id")
    .maybeSingle();

  if (error) {
    redirect(buildTeamsRedirect("error", error.message, returnTo));
  }

  if (!deletedTeam) {
    redirect(buildTeamsRedirect("error", "Tim tidak ditemukan.", returnTo));
  }

  if (deletedTeam.registration_id) {
    const { error: registrationError } = await supabase
      .from("registrations")
      .delete()
      .eq("id", deletedTeam.registration_id)
      .eq("tournament_id", tournamentId);

    if (registrationError) {
      redirect(buildTeamsRedirect("error", registrationError.message, returnTo));
    }
  }

  revalidateTeamPaths(teamId, deletedTeam.registration_id || "");
  redirect(
    buildTeamsRedirect(
      "success",
      deletedTeam.registration_id
        ? "Tim dan data pendaftaran terkait berhasil dihapus."
        : "Tim berhasil dihapus.",
    ),
  );
}

export async function createTeamPlayerAction(formData) {
  const state = await getCurrentAdmin();
  ensureTeamAdmin(state);

  const { teamId, payload, returnTo } = getPlayerContext(formData);

  if (!teamId) {
    redirect(buildTeamsRedirect("error", "ID tim tidak valid.", returnTo));
  }

  const validationError = validatePlayerPayload(payload);
  if (validationError) {
    redirect(buildTeamsRedirect("error", validationError, returnTo));
  }

  const supabase = await createClient();

  if (payload.is_captain) {
    const { error: captainError } = await clearExistingCaptain(supabase, teamId);

    if (captainError) {
      redirect(buildTeamsRedirect("error", captainError.message, returnTo));
    }
  }

  const { error } = await supabase.from("team_players").insert({
    team_id: teamId,
    ...payload,
    created_by: state.user.sub,
    updated_by: state.user.sub,
  });

  if (error) {
    redirect(buildTeamsRedirect("error", error.message, returnTo));
  }

  revalidateTeamPaths(teamId);
  redirect(buildTeamsRedirect("success", "Pemain roster berhasil dibuat.", returnTo));
}

export async function updateTeamPlayerAction(formData) {
  const state = await getCurrentAdmin();
  ensureTeamAdmin(state);

  const { playerId, teamId, payload, returnTo } = getPlayerContext(formData);

  if (!playerId || !teamId) {
    redirect(buildTeamsRedirect("error", "Konteks pemain roster tidak valid.", returnTo));
  }

  const validationError = validatePlayerPayload(payload);
  if (validationError) {
    redirect(buildTeamsRedirect("error", validationError, returnTo));
  }

  const supabase = await createClient();

  if (payload.is_captain) {
    const { error: captainError } = await clearExistingCaptain(
      supabase,
      teamId,
      playerId,
    );

    if (captainError) {
      redirect(buildTeamsRedirect("error", captainError.message, returnTo));
    }
  }

  const { error } = await supabase
    .from("team_players")
    .update({
      ...payload,
      updated_by: state.user.sub,
    })
    .eq("id", playerId)
    .eq("team_id", teamId);

  if (error) {
    redirect(buildTeamsRedirect("error", error.message, returnTo));
  }

  revalidateTeamPaths(teamId);
  redirect(buildTeamsRedirect("success", "Pemain roster berhasil diperbarui.", returnTo));
}

export async function deleteTeamPlayerAction(formData) {
  const state = await getCurrentAdmin();
  ensureTeamAdmin(state);

  const { playerId, teamId, returnTo } = getPlayerContext(formData);

  if (!playerId || !teamId) {
    redirect(buildTeamsRedirect("error", "Konteks pemain roster tidak valid.", returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_players")
    .delete()
    .eq("id", playerId)
    .eq("team_id", teamId);

  if (error) {
    redirect(buildTeamsRedirect("error", error.message, returnTo));
  }

  revalidateTeamPaths(teamId);
  redirect(buildTeamsRedirect("success", "Pemain roster berhasil dihapus.", returnTo));
}
