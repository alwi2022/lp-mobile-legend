"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import {
  getDefaultSiteSettingsInput,
  getDefaultTournamentInput,
} from "../../../lib/admin/site-settings";
import { createClient } from "../../../lib/supabase/server";

function buildSettingsRedirect(type, message) {
  return `/admin/settings?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message)}`;
}

function readText(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function readDateTimeLocal(formData, key) {
  const value = readText(formData, key);

  if (!value) {
    return null;
  }

  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(value)) {
    return value;
  }

  return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}

function readPositiveInteger(formData, key) {
  const parsed = Number.parseInt(readText(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function createStarterTournamentAction() {
  const state = await getCurrentAdmin();

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildSettingsRedirect("error", "Akses admin diperlukan."));
  }

  const supabase = await createClient();
  const tournamentPayload = {
    ...getDefaultTournamentInput(),
    created_by: state.user.sub,
    updated_by: state.user.sub,
  };

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .insert(tournamentPayload)
    .select("id")
    .single();

  if (tournamentError) {
    redirect(buildSettingsRedirect("error", tournamentError.message));
  }

  const siteSettingsPayload = {
    tournament_id: tournament.id,
    ...getDefaultSiteSettingsInput(),
    created_by: state.user.sub,
    updated_by: state.user.sub,
  };

  const { error: settingsError } = await supabase
    .from("site_settings")
    .upsert(siteSettingsPayload, { onConflict: "tournament_id" });

  if (settingsError) {
    redirect(buildSettingsRedirect("error", settingsError.message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect(buildSettingsRedirect("success", "Turnamen awal berhasil dibuat."));
}

export async function saveSiteSettingsAction(formData) {
  const state = await getCurrentAdmin();

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildSettingsRedirect("error", "Akses admin diperlukan."));
  }

  const tournamentId = readText(formData, "tournament_id");

  if (!tournamentId) {
    redirect(buildSettingsRedirect("error", "Turnamen belum tersedia."));
  }

  const teamSlotLimit = readPositiveInteger(formData, "team_slot_limit");

  if (teamSlotLimit <= 0) {
    redirect(buildSettingsRedirect("error", "Batas slot tim harus lebih dari 0."));
  }

  const tournamentPayload = {
    team_slot_limit: teamSlotLimit,
    registration_open_at: readDateTimeLocal(formData, "registration_open_at"),
    registration_close_at: readDateTimeLocal(formData, "registration_close_at"),
    check_in_deadline: readDateTimeLocal(formData, "check_in_deadline"),
    technical_meeting_at: readDateTimeLocal(formData, "technical_meeting_at"),
    kickoff_at: readDateTimeLocal(formData, "kickoff_at"),
    grand_final_at: readDateTimeLocal(formData, "grand_final_at"),
    updated_by: state.user.sub,
  };

  const payload = {
    tournament_id: tournamentId,
    brand_name: readText(formData, "brand_name"),
    brand_mark: readText(formData, "brand_mark"),
    site_title: readText(formData, "site_title"),
    meta_description: readText(formData, "meta_description"),
    hero_eyebrow: readText(formData, "hero_eyebrow"),
    hero_title: readText(formData, "hero_title"),
    hero_description: readText(formData, "hero_description"),
    hero_primary_label: readText(formData, "hero_primary_label"),
    hero_primary_href: readText(formData, "hero_primary_href"),
    hero_secondary_label: readText(formData, "hero_secondary_label"),
    hero_secondary_href: readText(formData, "hero_secondary_href"),
    hero_format_label: readText(formData, "hero_format_label"),
    register_eyebrow: readText(formData, "register_eyebrow"),
    register_title: readText(formData, "register_title"),
    register_description: readText(formData, "register_description"),
    register_cta_label: readText(formData, "register_cta_label"),
    register_cta_title: readText(formData, "register_cta_title"),
    register_cta_description: readText(formData, "register_cta_description"),
    register_cta_action_label: readText(formData, "register_cta_action_label"),
    register_cta_action_href: readText(formData, "register_cta_action_href"),
    contact_label: readText(formData, "contact_label"),
    contact_value: readText(formData, "contact_value"),
    live_eyebrow: readText(formData, "live_eyebrow"),
    live_title: readText(formData, "live_title"),
    live_description: readText(formData, "live_description"),
    footer_title: readText(formData, "footer_title"),
    footer_description: readText(formData, "footer_description"),
    created_by: state.user.sub,
    updated_by: state.user.sub,
  };

  const supabase = await createClient();
  const { error: tournamentError } = await supabase
    .from("tournaments")
    .update(tournamentPayload)
    .eq("id", tournamentId);

  if (tournamentError) {
    redirect(buildSettingsRedirect("error", tournamentError.message));
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "tournament_id" });

  if (error) {
    redirect(buildSettingsRedirect("error", error.message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect(buildSettingsRedirect("success", "Pengaturan website berhasil disimpan."));
}
