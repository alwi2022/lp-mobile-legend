"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { hasSupabaseEnv } from "../../lib/supabase/env";

function buildRedirect(type, message) {
  return `/register?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message)}`;
}

function readText(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

export async function submitRegistrationAction(formData) {
  if (!hasSupabaseEnv()) {
    redirect(buildRedirect("error", "Supabase belum dikonfigurasi."));
  }

  const tournamentId = readText(formData, "tournament_id");

  if (!tournamentId) {
    redirect(buildRedirect("error", "Turnamen belum tersedia untuk pendaftaran."));
  }

  const selectedCaptain = readText(formData, "captain_choice");
  const players = [];

  for (let index = 1; index <= 6; index += 1) {
    const displayName = readText(formData, `player_display_name_${index}`);
    const inGameName = readText(formData, `player_in_game_name_${index}`);
    const gameUid = readText(formData, `player_game_uid_${index}`);
    const gameServer = readText(formData, `player_game_server_${index}`);
    const rosterRole = readText(
      formData,
      `player_roster_role_${index}`,
      index === 6 ? "substitute" : "player",
    );

    if (!displayName && !inGameName) {
      continue;
    }

    if (!displayName || !inGameName) {
      redirect(
        buildRedirect(
          "error",
          `Pemain ${index} wajib mengisi nama tampil dan nama dalam game.`,
        ),
      );
    }

    players.push({
      display_name: displayName,
      in_game_name: inGameName,
      game_uid: gameUid || null,
      game_server: gameServer || null,
      roster_role: rosterRole === "substitute" ? "substitute" : "player",
      is_captain: selectedCaptain === String(index),
    });
  }

  const payload = {
    team_name: readText(formData, "team_name"),
    team_short_name: readText(formData, "team_short_name"),
    captain_name: readText(formData, "captain_name"),
    captain_contact: readText(formData, "captain_contact"),
    captain_email: readText(formData, "captain_email"),
    region: readText(formData, "region"),
    city: readText(formData, "city"),
    logo_path: readText(formData, "logo_path") || null,
    team_bio: readText(formData, "team_bio"),
    players,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_registration", {
    target_tournament_id: tournamentId,
    payload,
  });

  if (error) {
    redirect(buildRedirect("error", error.message));
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.submission_code) {
    redirect(buildRedirect("error", "Registrasi gagal diproses."));
  }

  const successMessage =
    result.status === "waitlisted"
      ? `Slot inti sedang penuh. Tim kamu masuk waitlist dengan kode ${result.submission_code}.`
      : `Registrasi berhasil dikirim dengan kode ${result.submission_code}.`;

  redirect(buildRedirect("success", successMessage));
}
