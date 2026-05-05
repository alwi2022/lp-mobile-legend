import { DEFAULT_SITE_SETTINGS, DEFAULT_TOURNAMENT_CONFIG } from "../defaults";
import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

function withString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function getDefaultSiteSettingsInput() {
  return {
    brand_name: DEFAULT_SITE_SETTINGS.brandText,
    brand_mark: DEFAULT_SITE_SETTINGS.brandMark,
    site_title: "SATRIA TOURNAMENT",
    meta_description:
      "Website turnamen Mobile Legends Satria Tournament dengan pendaftaran tim, jadwal pertandingan, status turnamen, bracket playoff, daftar tim, dan siaran langsung.",
    hero_eyebrow: DEFAULT_SITE_SETTINGS.hero.eyebrow,
    hero_title: DEFAULT_SITE_SETTINGS.hero.title,
    hero_description: DEFAULT_SITE_SETTINGS.hero.description,
    hero_primary_label: DEFAULT_SITE_SETTINGS.hero.primaryAction.label,
    hero_primary_href: "/register",
    hero_secondary_label: DEFAULT_SITE_SETTINGS.hero.secondaryAction.label,
    hero_secondary_href: DEFAULT_SITE_SETTINGS.hero.secondaryAction.href,
    hero_format_label: DEFAULT_SITE_SETTINGS.hero.format,
    register_eyebrow: DEFAULT_SITE_SETTINGS.register.eyebrow,
    register_title: "Pendaftaran tim dipusatkan lewat form internal",
    register_description:
      "Halaman ini tetap jadi pusat info turnamen, sementara tim yang ingin daftar akan diarahkan ke form internal supaya data masuk langsung ke dashboard panitia.",
    register_cta_label: "Form Internal",
    register_cta_title: "Daftar lewat Form Internal",
    register_cta_description:
      "Pendaftaran tim dipusatkan ke form internal supaya pengiriman data, persetujuan, slot, dan dashboard panitia tetap sinkron.",
    register_cta_action_label: "Daftar Sekarang",
    register_cta_action_href: "/register",
    contact_label: DEFAULT_SITE_SETTINGS.register.contactLabel,
    contact_value: DEFAULT_SITE_SETTINGS.register.contactValue,
    live_eyebrow: DEFAULT_SITE_SETTINGS.live.eyebrow,
    live_title: DEFAULT_SITE_SETTINGS.live.title,
    live_description: DEFAULT_SITE_SETTINGS.live.description,
    footer_title: DEFAULT_SITE_SETTINGS.footer.title,
    footer_description: DEFAULT_SITE_SETTINGS.footer.description,
  };
}

export function getDefaultTournamentInput() {
  return {
    slug: "satria-tournament",
    name: "Satria Tournament",
    short_name: "ST",
    game_title: "Mobile Legends",
    format: "single_elimination",
    status: "registration_open",
    team_slot_limit: DEFAULT_TOURNAMENT_CONFIG.maxTeamSlots,
    roster_min_players: 5,
    roster_max_players: 6,
    registration_open_at: null,
    registration_close_at: null,
    check_in_deadline: null,
    technical_meeting_at: null,
    kickoff_at: null,
    grand_final_at: null,
    timezone: "Asia/Jakarta",
    venue_name: "",
    public_notes: "",
    is_featured: true,
  };
}

export async function getAdminSettingsPageData() {
  const defaults = getDefaultSiteSettingsInput();
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      settings: defaults,
      missingTournament: false,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      settings: defaults,
      missingTournament: true,
      error: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("tournament_id", primary.tournament.id)
    .maybeSingle();

  if (error) {
    return {
      tournament: primary.tournament,
      settings: defaults,
      missingTournament: false,
      error: error.message,
    };
  }

  const settings = data
    ? {
        ...defaults,
        ...Object.fromEntries(
          Object.entries(defaults).map(([key, fallback]) => [key, withString(data[key], fallback)]),
        ),
      }
    : defaults;

  return {
    tournament: primary.tournament,
    settings,
    missingTournament: false,
    error: null,
  };
}
