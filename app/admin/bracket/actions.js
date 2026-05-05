"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncBracketState, syncMatchPairingsFromSlots } from "../../../lib/admin/bracket-sync";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";

function normalizeReturnTo(value, fallback = "/admin/bracket") {
  const candidate = String(value || "").trim();

  if (!candidate.startsWith("/admin") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function buildBracketRedirect(type, message, returnTo = "") {
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

function ensureBracketAdmin(state) {
  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildBracketRedirect("error", "Akses admin diperlukan."));
  }

  if (!["super_admin", "admin"].includes(state.admin.role)) {
    redirect(buildBracketRedirect("error", "Role admin diperlukan untuk mengelola bracket."));
  }
}

function getSlotContext(formData) {
  return {
    slotId: readText(formData, "slot_id"),
    tournamentId: readText(formData, "tournament_id"),
    returnTo: readText(formData, "return_to"),
    payload: {
      match_id: readText(formData, "match_id"),
      slot_side: readText(formData, "slot_side", "team_a"),
      round_number: readNullableInteger(formData, "round_number") || 1,
      slot_number: readNullableInteger(formData, "slot_number") || 1,
      team_id: readNullableText(formData, "team_id"),
      display_label: readNullableText(formData, "display_label"),
      source_match_id: readNullableText(formData, "source_match_id"),
      source_outcome: readNullableText(formData, "source_outcome"),
      seed_number: readNullableInteger(formData, "seed_number"),
      is_bye: readCheckbox(formData, "is_bye"),
    },
  };
}

function validateSlotPayload(payload) {
  if (!payload.match_id) {
    return "Target match wajib dipilih.";
  }

  if (!["team_a", "team_b"].includes(payload.slot_side)) {
    return "Sisi slot tidak valid.";
  }

  if (payload.round_number <= 0 || payload.slot_number <= 0) {
    return "Nomor ronde dan nomor slot harus lebih dari 0.";
  }

  if ((payload.source_match_id && !payload.source_outcome) || (!payload.source_match_id && payload.source_outcome)) {
    return "Pertandingan sumber dan hasil sumber harus diisi berpasangan.";
  }

  return null;
}

function revalidateBracketPaths(matchId = "") {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/bracket");
  revalidatePath("/admin/matches");

  if (matchId) {
    revalidatePath(`/admin/bracket/${matchId}`);
  }
}

export async function createBracketSlotAction(formData) {
  const state = await getCurrentAdmin();
  ensureBracketAdmin(state);

  const { tournamentId, payload, returnTo } = getSlotContext(formData);

  if (!tournamentId) {
    redirect(buildBracketRedirect("error", "ID turnamen tidak valid.", returnTo));
  }

  const validationError = validateSlotPayload(payload);
  if (validationError) {
    redirect(buildBracketRedirect("error", validationError, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bracket_slots").insert({
    tournament_id: tournamentId,
    ...payload,
    created_by: state.user.sub,
    updated_by: state.user.sub,
  });

  if (error) {
    redirect(buildBracketRedirect("error", error.message, returnTo));
  }

  const syncError = await syncMatchPairingsFromSlots(supabase, tournamentId, state.user.sub);

  if (syncError) {
    redirect(buildBracketRedirect("error", syncError, returnTo));
  }

  revalidateBracketPaths(payload.match_id);
  redirect(buildBracketRedirect("success", "Bracket slot berhasil dibuat.", returnTo));
}

export async function updateBracketSlotAction(formData) {
  const state = await getCurrentAdmin();
  ensureBracketAdmin(state);

  const { slotId, tournamentId, payload, returnTo } = getSlotContext(formData);

  if (!slotId || !tournamentId) {
    redirect(buildBracketRedirect("error", "Konteks slot tidak valid.", returnTo));
  }

  const validationError = validateSlotPayload(payload);
  if (validationError) {
    redirect(buildBracketRedirect("error", validationError, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bracket_slots")
    .update({
      ...payload,
      updated_by: state.user.sub,
    })
    .eq("id", slotId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildBracketRedirect("error", error.message, returnTo));
  }

  const syncError = await syncMatchPairingsFromSlots(supabase, tournamentId, state.user.sub);

  if (syncError) {
    redirect(buildBracketRedirect("error", syncError, returnTo));
  }

  revalidateBracketPaths(payload.match_id);
  redirect(buildBracketRedirect("success", "Bracket slot berhasil diperbarui.", returnTo));
}

export async function deleteBracketSlotAction(formData) {
  const state = await getCurrentAdmin();
  ensureBracketAdmin(state);

  const { slotId, tournamentId, payload, returnTo } = getSlotContext(formData);

  if (!slotId || !tournamentId) {
    redirect(buildBracketRedirect("error", "Konteks slot tidak valid.", returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bracket_slots")
    .delete()
    .eq("id", slotId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildBracketRedirect("error", error.message, returnTo));
  }

  const syncError = await syncMatchPairingsFromSlots(supabase, tournamentId, state.user.sub);

  if (syncError) {
    redirect(buildBracketRedirect("error", syncError, returnTo));
  }

  revalidateBracketPaths(payload.match_id);
  redirect(buildBracketRedirect("success", "Bracket slot berhasil dihapus.", returnTo));
}

export async function syncBracketProgressionAction(formData) {
  const state = await getCurrentAdmin();
  ensureBracketAdmin(state);

  const tournamentId = readText(formData, "tournament_id");
  const returnTo = readText(formData, "return_to");

  if (!tournamentId) {
    redirect(buildBracketRedirect("error", "ID turnamen tidak valid.", returnTo));
  }

  const supabase = await createClient();
  const syncError = await syncBracketState(supabase, tournamentId, state.user.sub);

  if (syncError) {
    redirect(buildBracketRedirect("error", syncError, returnTo));
  }

  revalidateBracketPaths();
  redirect(buildBracketRedirect("success", "Progres bracket berhasil disinkronkan.", returnTo));
}
