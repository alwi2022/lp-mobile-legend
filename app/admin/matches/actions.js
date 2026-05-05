"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import { normalizeMatchFilter } from "../../../lib/admin/matches";
import { createClient } from "../../../lib/supabase/server";

function normalizeReturnTo(value, fallback = "/admin/matches") {
  const candidate = String(value || "").trim();

  if (!candidate.startsWith("/admin") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function buildMatchesRedirect(type, message, statusFilter = "all", returnTo = "") {
  const basePath = normalizeReturnTo(returnTo);
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("message", message);

  const normalizedFilter =
    basePath === "/admin/matches" ? normalizeMatchFilter(statusFilter) : "all";
  if (basePath === "/admin/matches" && normalizedFilter !== "all") {
    params.set("status", normalizedFilter);
  }

  return `${basePath}?${params.toString()}`;
}

function readText(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function readNullableText(formData, key) {
  const value = readText(formData, key);
  return value || null;
}

function readInteger(formData, key, fallback = 0) {
  const rawValue = readText(formData, key);
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNullableInteger(formData, key) {
  const rawValue = readText(formData, key);

  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readNullableIsoDateTime(formData, key) {
  const rawValue = readText(formData, key);

  if (!rawValue) {
    return null;
  }

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseRoundPreset(value, fallbackName = "Quarter Final", fallbackNumber = 1) {
  const [roundNumberValue, ...nameParts] = String(value || "").split("|");
  const parsedRoundNumber = Number.parseInt(roundNumberValue, 10);
  const roundName = nameParts.join("|").trim();

  return {
    round_name: roundName || fallbackName,
    round_number: Number.isFinite(parsedRoundNumber) && parsedRoundNumber > 0
      ? parsedRoundNumber
      : fallbackNumber,
  };
}

function isMatchUniqueConstraintError(error) {
  return (
    error?.code === "23505" &&
    String(error?.message || "").includes(
      "matches_tournament_id_stage_name_round_number_match_number_key",
    )
  );
}

function getDuplicateMatchMessage(payload) {
  return `${payload.round_name} Match ${payload.match_number} sudah ada. Buka daftar pertandingan lalu edit match yang sudah ada, atau pilih ronde lain.`;
}

async function assignNextMatchNumber(supabase, tournamentId, payload) {
  const { data, error } = await supabase
    .from("matches")
    .select("match_number")
    .eq("tournament_id", tournamentId)
    .eq("stage_name", payload.stage_name)
    .eq("round_number", payload.round_number)
    .order("match_number", { ascending: true });

  if (error) {
    return { payload, error: error.message };
  }

  const usedNumbers = new Set((data || []).map((match) => match.match_number));
  let nextMatchNumber = 1;

  while (usedNumbers.has(nextMatchNumber)) {
    nextMatchNumber += 1;
  }

  return {
    payload: {
      ...payload,
      match_number: nextMatchNumber,
    },
    error: null,
  };
}

function getContext(formData) {
  const round = parseRoundPreset(
    readText(formData, "round_preset"),
    readText(formData, "round_name", "Quarter Final"),
    readInteger(formData, "round_number", 1),
  );

  const payload = {
    stage_name: readText(formData, "stage_name", "Bracket Utama"),
    round_name: round.round_name,
    round_number: round.round_number,
    match_number: readInteger(formData, "match_number", 1),
    best_of: readInteger(formData, "best_of", 3),
    status: readText(formData, "status", "scheduled"),
    scheduled_at: readNullableIsoDateTime(formData, "scheduled_at"),
    venue_name: readNullableText(formData, "venue_name"),
    team_a_id: readNullableText(formData, "team_a_id"),
    team_b_id: readNullableText(formData, "team_b_id"),
    team_a_placeholder: null,
    team_b_placeholder: null,
    notes: readNullableText(formData, "notes"),
  };

  return {
    matchId: readText(formData, "match_id"),
    tournamentId: readText(formData, "tournament_id"),
    statusFilter: readText(formData, "status_filter", "all"),
    returnTo: readText(formData, "return_to"),
    payload,
  };
}

function getGameContext(formData) {
  return {
    gameId: readText(formData, "game_id"),
    matchId: readText(formData, "match_id"),
    tournamentId: readText(formData, "tournament_id"),
    statusFilter: readText(formData, "status_filter", "all"),
    returnTo: readText(formData, "return_to"),
    payload: {
      game_number: readInteger(formData, "game_number", 1),
      status: readText(formData, "game_status", "scheduled"),
      started_at: readNullableIsoDateTime(formData, "started_at"),
      ended_at: readNullableIsoDateTime(formData, "ended_at"),
      team_a_score: readNullableInteger(formData, "team_a_score"),
      team_b_score: readNullableInteger(formData, "team_b_score"),
      winner_choice: readText(formData, "winner_choice"),
      notes: readNullableText(formData, "game_notes"),
    },
  };
}

function getResultContext(formData) {
  return {
    matchId: readText(formData, "match_id"),
    tournamentId: readText(formData, "tournament_id"),
    statusFilter: readText(formData, "status_filter", "all"),
    returnTo: readText(formData, "return_to"),
    payload: {
      score_a_total: readInteger(formData, "score_a_total", 0),
      score_b_total: readInteger(formData, "score_b_total", 0),
      winner_choice: readText(formData, "winner_choice"),
    },
  };
}

function revalidateMatchPaths(matchId = "") {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/bracket");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/streams");

  if (matchId) {
    revalidatePath(`/admin/matches/${matchId}`);
  }
}

function validatePayload(payload) {
  if (payload.team_a_id && payload.team_b_id && payload.team_a_id === payload.team_b_id) {
    return "Tim A dan Tim B tidak boleh sama.";
  }

  if (!payload.round_name) {
    return "Nama ronde wajib diisi.";
  }

  if (payload.round_number <= 0 || payload.match_number <= 0) {
    return "Nomor ronde dan nomor pertandingan harus lebih dari 0.";
  }

  if (![1, 3, 5, 7].includes(payload.best_of)) {
    return "Best-of hanya boleh 1, 3, 5, atau 7.";
  }

  if (!payload.team_a_id || !payload.team_b_id) {
    return "Pilih Tim A dan Tim B dulu. Semua match diatur manual tanpa placeholder.";
  }

  return null;
}

function validateGamePayload(payload) {
  if (payload.game_number <= 0) {
    return "Nomor game harus lebih dari 0.";
  }

  if (
    payload.team_a_score !== null &&
    payload.team_a_score < 0
  ) {
    return "Skor Tim A tidak boleh negatif.";
  }

  if (
    payload.team_b_score !== null &&
    payload.team_b_score < 0
  ) {
    return "Skor Tim B tidak boleh negatif.";
  }

  if (payload.status === "finished") {
    if (payload.team_a_score === null || payload.team_b_score === null) {
      return "Game yang selesai harus punya skor Tim A dan Tim B.";
    }

    if (payload.team_a_score === payload.team_b_score && !payload.winner_choice) {
      return "Pilih pemenang game atau isi skor yang menentukan pemenang.";
    }
  }

  return null;
}

function validateResultPayload(payload) {
  if (payload.score_a_total < 0 || payload.score_b_total < 0) {
    return "Skor tidak boleh negatif.";
  }

  if (payload.score_a_total === payload.score_b_total && !payload.winner_choice) {
    return "Pilih pemenang match atau isi skor yang tidak seri.";
  }

  return null;
}

async function resolveWinnerTeamId(supabase, matchId, payload) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, team_a_id, team_b_id")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    return { error: error.message, winnerTeamId: null };
  }

  if (!match) {
    return { error: "Pertandingan tidak ditemukan.", winnerTeamId: null };
  }

  if (payload.winner_choice === "team_a") {
    if (!match.team_a_id) {
      return { error: "Tim A belum dipilih di pertandingan ini.", winnerTeamId: null };
    }

    return { error: null, winnerTeamId: match.team_a_id || null };
  }

  if (payload.winner_choice === "team_b") {
    if (!match.team_b_id) {
      return { error: "Tim B belum dipilih di pertandingan ini.", winnerTeamId: null };
    }

    return { error: null, winnerTeamId: match.team_b_id || null };
  }

  if (
    payload.status === "finished" &&
    payload.team_a_score !== null &&
    payload.team_b_score !== null &&
    payload.team_a_score !== payload.team_b_score
  ) {
    return {
      error: null,
      winnerTeamId:
        payload.team_a_score > payload.team_b_score ? match.team_a_id || null : match.team_b_id || null,
    };
  }

  return { error: null, winnerTeamId: null };
}

async function resolveMatchResult(supabase, matchId, payload) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, team_a_id, team_b_id")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    return { error: error.message, winnerTeamId: null, loserTeamId: null };
  }

  if (!match) {
    return { error: "Pertandingan tidak ditemukan.", winnerTeamId: null, loserTeamId: null };
  }

  if (!match.team_a_id || !match.team_b_id) {
    return {
      error: "Pilih Tim A dan Tim B dulu sebelum input skor.",
      winnerTeamId: null,
      loserTeamId: null,
    };
  }

  if (payload.winner_choice === "team_a") {
    return { error: null, winnerTeamId: match.team_a_id, loserTeamId: match.team_b_id };
  }

  if (payload.winner_choice === "team_b") {
    return { error: null, winnerTeamId: match.team_b_id, loserTeamId: match.team_a_id };
  }

  if (payload.score_a_total > payload.score_b_total) {
    return { error: null, winnerTeamId: match.team_a_id, loserTeamId: match.team_b_id };
  }

  if (payload.score_b_total > payload.score_a_total) {
    return { error: null, winnerTeamId: match.team_b_id, loserTeamId: match.team_a_id };
  }

  return { error: "Pemenang match belum dipilih.", winnerTeamId: null, loserTeamId: null };
}

export async function createMatchAction(formData) {
  const state = await getCurrentAdmin();
  const context = getContext(formData);
  const { tournamentId, statusFilter, returnTo } = context;
  let payload = context.payload;

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!tournamentId) {
    redirect(buildMatchesRedirect("error", "ID turnamen tidak valid.", statusFilter, returnTo));
  }

  const supabase = await createClient();
  const nextNumberResult = await assignNextMatchNumber(supabase, tournamentId, payload);

  if (nextNumberResult.error) {
    redirect(buildMatchesRedirect("error", nextNumberResult.error, statusFilter, returnTo));
  }

  payload = nextNumberResult.payload;

  const validationError = validatePayload(payload);
  if (validationError) {
    redirect(buildMatchesRedirect("error", validationError, statusFilter, returnTo));
  }

  const { data, error } = await supabase
    .from("matches")
    .insert({
      tournament_id: tournamentId,
      ...payload,
      created_by: state.user.sub,
      updated_by: state.user.sub,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMatchUniqueConstraintError(error)) {
      redirect(buildMatchesRedirect("error", getDuplicateMatchMessage(payload), statusFilter, returnTo));
    }

    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths(data?.id || "");
  redirect(buildMatchesRedirect("success", "Pertandingan berhasil dibuat.", statusFilter, returnTo));
}

export async function updateMatchAction(formData) {
  const state = await getCurrentAdmin();
  const { matchId, tournamentId, statusFilter, payload, returnTo } = getContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!matchId || !tournamentId) {
    redirect(
      buildMatchesRedirect("error", "Konteks pertandingan tidak valid.", statusFilter, returnTo),
    );
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    redirect(buildMatchesRedirect("error", validationError, statusFilter, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({
      ...payload,
      updated_by: state.user.sub,
    })
    .eq("id", matchId)
    .eq("tournament_id", tournamentId);

  if (error) {
    if (isMatchUniqueConstraintError(error)) {
      redirect(buildMatchesRedirect("error", getDuplicateMatchMessage(payload), statusFilter, returnTo));
    }

    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths(matchId);
  redirect(
    buildMatchesRedirect("success", "Pertandingan berhasil diperbarui.", statusFilter, returnTo),
  );
}

export async function deleteMatchAction(formData) {
  const state = await getCurrentAdmin();
  const { matchId, tournamentId, statusFilter, returnTo } = getContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!matchId || !tournamentId) {
    redirect(
      buildMatchesRedirect("error", "Konteks pertandingan tidak valid.", statusFilter, returnTo),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths();
  redirect(buildMatchesRedirect("success", "Pertandingan berhasil dihapus.", statusFilter));
}

export async function updateMatchResultAction(formData) {
  const state = await getCurrentAdmin();
  const { matchId, tournamentId, statusFilter, payload, returnTo } = getResultContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!matchId || !tournamentId) {
    redirect(
      buildMatchesRedirect("error", "Konteks pertandingan tidak valid.", statusFilter, returnTo),
    );
  }

  const validationError = validateResultPayload(payload);
  if (validationError) {
    redirect(buildMatchesRedirect("error", validationError, statusFilter, returnTo));
  }

  const supabase = await createClient();
  const { winnerTeamId, loserTeamId, error: resultError } = await resolveMatchResult(
    supabase,
    matchId,
    payload,
  );

  if (resultError) {
    redirect(buildMatchesRedirect("error", resultError, statusFilter, returnTo));
  }

  const { error } = await supabase
    .from("matches")
    .update({
      score_a_total: payload.score_a_total,
      score_b_total: payload.score_b_total,
      winner_team_id: winnerTeamId,
      loser_team_id: loserTeamId,
      status: "finished",
      ended_at: new Date().toISOString(),
      updated_by: state.user.sub,
    })
    .eq("id", matchId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths(matchId);
  redirect(buildMatchesRedirect("success", "Skor match berhasil disimpan.", statusFilter, returnTo));
}

export async function createMatchGameAction(formData) {
  const state = await getCurrentAdmin();
  const { matchId, tournamentId, statusFilter, payload, returnTo } = getGameContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!matchId) {
    redirect(
      buildMatchesRedirect("error", "ID pertandingan tidak valid.", statusFilter, returnTo),
    );
  }

  const validationError = validateGamePayload(payload);
  if (validationError) {
    redirect(buildMatchesRedirect("error", validationError, statusFilter, returnTo));
  }

  const supabase = await createClient();
  const { winnerTeamId, error: winnerError } = await resolveWinnerTeamId(
    supabase,
    matchId,
    payload,
  );

  if (winnerError) {
    redirect(buildMatchesRedirect("error", winnerError, statusFilter, returnTo));
  }

  const { error } = await supabase.from("match_games").insert({
    match_id: matchId,
    game_number: payload.game_number,
    status: payload.status,
    started_at: payload.started_at,
    ended_at: payload.ended_at,
    winner_team_id: winnerTeamId,
    team_a_score: payload.team_a_score,
    team_b_score: payload.team_b_score,
    notes: payload.notes,
    created_by: state.user.sub,
    updated_by: state.user.sub,
  });

  if (error) {
    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths(matchId);
  redirect(buildMatchesRedirect("success", "Skor game berhasil dibuat.", statusFilter, returnTo));
}

export async function updateMatchGameAction(formData) {
  const state = await getCurrentAdmin();
  const { gameId, matchId, tournamentId, statusFilter, payload, returnTo } =
    getGameContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!gameId || !matchId) {
    redirect(buildMatchesRedirect("error", "Konteks game tidak valid.", statusFilter, returnTo));
  }

  const validationError = validateGamePayload(payload);
  if (validationError) {
    redirect(buildMatchesRedirect("error", validationError, statusFilter, returnTo));
  }

  const supabase = await createClient();
  const { winnerTeamId, error: winnerError } = await resolveWinnerTeamId(
    supabase,
    matchId,
    payload,
  );

  if (winnerError) {
    redirect(buildMatchesRedirect("error", winnerError, statusFilter, returnTo));
  }

  const { error } = await supabase
    .from("match_games")
    .update({
      game_number: payload.game_number,
      status: payload.status,
      started_at: payload.started_at,
      ended_at: payload.ended_at,
      winner_team_id: winnerTeamId,
      team_a_score: payload.team_a_score,
      team_b_score: payload.team_b_score,
      notes: payload.notes,
      updated_by: state.user.sub,
    })
    .eq("id", gameId)
    .eq("match_id", matchId);

  if (error) {
    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths(matchId);
  redirect(
    buildMatchesRedirect("success", "Skor game berhasil diperbarui.", statusFilter, returnTo),
  );
}

export async function deleteMatchGameAction(formData) {
  const state = await getCurrentAdmin();
  const { gameId, matchId, tournamentId, statusFilter, returnTo } = getGameContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildMatchesRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!gameId || !matchId) {
    redirect(buildMatchesRedirect("error", "Konteks game tidak valid.", statusFilter, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("match_games")
    .delete()
    .eq("id", gameId)
    .eq("match_id", matchId);

  if (error) {
    redirect(buildMatchesRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateMatchPaths(matchId);
  redirect(buildMatchesRedirect("success", "Skor game berhasil dihapus.", statusFilter, returnTo));
}
