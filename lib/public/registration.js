import { DEFAULT_SITE_SETTINGS } from "../defaults";
import { hasSupabaseEnv } from "../supabase/env";
import { createClient } from "../supabase/server";

export async function getPublicRegistrationPageData() {
  const defaults = {
    registerEyebrow: DEFAULT_SITE_SETTINGS.register.eyebrow,
    registerTitle: "Daftar Tim",
    registerDescription:
      "Isi form internal ini untuk mengirimkan data tim langsung ke dashboard panitia.",
    contactLabel: DEFAULT_SITE_SETTINGS.register.contactLabel,
    contactValue: DEFAULT_SITE_SETTINGS.register.contactValue,
  };

  if (!hasSupabaseEnv()) {
    return {
      configured: false,
      tournament: null,
      summary: null,
      content: defaults,
      error: null,
    };
  }

  const supabase = await createClient();
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select(
      "id, slug, name, short_name, status, format, team_slot_limit, roster_min_players, roster_max_players, timezone, registration_open_at, registration_close_at, kickoff_at, technical_meeting_at, venue_name",
    )
    .eq("status", "registration_open")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tournamentError) {
    return {
      configured: true,
      tournament: null,
      summary: null,
      content: defaults,
      error: tournamentError.message,
    };
  }

  if (!tournament) {
    return {
      configured: true,
      tournament: null,
      summary: null,
      content: defaults,
      error: null,
    };
  }

  const [{ data: settings, error: settingsError }, { data: summary, error: summaryError }] =
    await Promise.all([
      supabase
        .from("site_settings")
        .select(
          "register_eyebrow, register_title, register_description, contact_label, contact_value",
        )
        .eq("tournament_id", tournament.id)
        .maybeSingle(),
      supabase
        .from("tournament_slot_summary")
        .select("*")
        .eq("tournament_id", tournament.id)
        .maybeSingle(),
    ]);

  return {
    configured: true,
    tournament,
    summary: summaryError ? null : summary,
    content: {
      registerEyebrow: settings?.register_eyebrow || defaults.registerEyebrow,
      registerTitle: settings?.register_title || defaults.registerTitle,
      registerDescription: settings?.register_description || defaults.registerDescription,
      contactLabel: settings?.contact_label || defaults.contactLabel,
      contactValue: settings?.contact_value || defaults.contactValue,
    },
    error: settingsError?.message || summaryError?.message || null,
  };
}
