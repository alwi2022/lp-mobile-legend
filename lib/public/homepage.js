import {
  DEFAULT_ABOUT_ITEMS,
  DEFAULT_BANNER_SLIDES,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_TOURNAMENT_CONFIG,
  EMPTY_BRACKET_PREVIEW,
} from "../defaults";
import { buildBracketPreviewFromData } from "./bracket-preview";
import { hasSupabaseEnv } from "../supabase/env";
import { createClient } from "../supabase/server";

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "";
  }

  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));

  return `${formatted.replace(" pukul ", ", ")} WIB`;
}

function withString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getRelationName(value) {
  if (Array.isArray(value)) {
    return withString(value[0]?.name, "");
  }

  return withString(value?.name, "");
}

function isExternalHref(value) {
  return /^https?:\/\//i.test(value || "");
}

function normalizePublicHref(value, fallback = "/") {
  const href = withString(value, fallback);

  const routeMap = {
    "#bracket": "/bracket",
    "#schedule": "/jadwal",
    "#jadwal": "/jadwal",
    "#teams": "/tim",
    "#team": "/tim",
    "#live": "/siaran",
    "#stream": "/siaran",
    "#register": "/register",
    "#faq": "/",
  };

  return routeMap[href] || href;
}

function extractYoutubeId(value) {
  if (!value) {
    return "";
  }

  const source = String(value).trim();

  if (!source) {
    return "";
  }

  if (!source.includes("http")) {
    return source;
  }

  try {
    const url = new URL(source);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\/+/, "");
    }

    if (url.searchParams.get("v")) {
      return url.searchParams.get("v") || "";
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const embedIndex = segments.findIndex((segment) => segment === "embed");

    if (embedIndex >= 0 && segments[embedIndex + 1]) {
      return segments[embedIndex + 1];
    }
  } catch {
    return "";
  }

  return "";
}

function formatStreamStatus(value) {
  switch (value) {
    case "live":
      return "Sedang Tayang";
    case "live_soon":
      return "Segera Tayang";
    case "ended":
      return "Selesai";
    case "archived":
      return "Diarsipkan";
    default:
      return "Akan Datang";
  }
}

function formatTeamStatus(team) {
  if (team.status === "champion" || team.placement === 1) {
    return "Juara";
  }

  if (team.placement === 2) {
    return "Juara 2";
  }

  if (team.status === "eliminated") {
    return team.eliminated_round
      ? `Tereliminasi | ${team.eliminated_round}`
      : "Tereliminasi";
  }

  return team.seed_number ? `Unggulan #${team.seed_number}` : "Tim Resmi";
}

function mapSiteSettings(settings, tournament, remainingSlots) {
  const primaryHref = withString(
    normalizePublicHref(settings?.hero_primary_href, DEFAULT_SITE_SETTINGS.hero.primaryAction.href),
    DEFAULT_SITE_SETTINGS.hero.primaryAction.href,
  );
  const ctaHref = withString(
    normalizePublicHref(
      settings?.register_cta_action_href,
      DEFAULT_SITE_SETTINGS.register.ctaAction.href,
    ),
    DEFAULT_SITE_SETTINGS.register.ctaAction.href,
  );

  return {
    ...DEFAULT_SITE_SETTINGS,
    brandMark: withString(settings?.brand_mark, DEFAULT_SITE_SETTINGS.brandMark),
    brandText: withString(settings?.brand_name, DEFAULT_SITE_SETTINGS.brandText),
    hero: {
      ...DEFAULT_SITE_SETTINGS.hero,
      eyebrow: withString(settings?.hero_eyebrow, DEFAULT_SITE_SETTINGS.hero.eyebrow),
      title: withString(settings?.hero_title, DEFAULT_SITE_SETTINGS.hero.title),
      description: withString(
        settings?.hero_description,
        DEFAULT_SITE_SETTINGS.hero.description,
      ),
      primaryAction: {
        label: withString(
          settings?.hero_primary_label,
          DEFAULT_SITE_SETTINGS.hero.primaryAction.label,
        ),
        href: primaryHref,
      },
      secondaryAction: {
        label: withString(
          settings?.hero_secondary_label,
          DEFAULT_SITE_SETTINGS.hero.secondaryAction.label,
        ),
        href: withString(
          normalizePublicHref(
            settings?.hero_secondary_href,
            DEFAULT_SITE_SETTINGS.hero.secondaryAction.href,
          ),
          DEFAULT_SITE_SETTINGS.hero.secondaryAction.href,
        ),
      },
      format: withString(
        settings?.hero_format_label,
        DEFAULT_SITE_SETTINGS.hero.format,
      ),
    },
    register: {
      ...DEFAULT_SITE_SETTINGS.register,
      eyebrow: withString(
        settings?.register_eyebrow,
        DEFAULT_SITE_SETTINGS.register.eyebrow,
      ),
      title: withString(settings?.register_title, DEFAULT_SITE_SETTINGS.register.title),
      description: withString(
        settings?.register_description,
        DEFAULT_SITE_SETTINGS.register.description,
      ),
      checkInDate:
        formatDateOnly(tournament?.check_in_deadline) ||
        DEFAULT_SITE_SETTINGS.register.checkInDate,
      technicalMeeting:
        formatDateTimeLabel(tournament?.technical_meeting_at) ||
        DEFAULT_SITE_SETTINGS.register.technicalMeeting,
      kickoffMatch:
        formatDateOnly(tournament?.kickoff_at) ||
        DEFAULT_SITE_SETTINGS.register.kickoffMatch,
      notes: DEFAULT_SITE_SETTINGS.register.notes,
      contactLabel: withString(
        settings?.contact_label,
        DEFAULT_SITE_SETTINGS.register.contactLabel,
      ),
      contactValue: withString(
        settings?.contact_value,
        DEFAULT_SITE_SETTINGS.register.contactValue,
      ),
      ctaLabel: withString(
        settings?.register_cta_label,
        DEFAULT_SITE_SETTINGS.register.ctaLabel,
      ),
      ctaTitle: withString(
        settings?.register_cta_title,
        DEFAULT_SITE_SETTINGS.register.ctaTitle,
      ),
      ctaDescription: withString(
        settings?.register_cta_description,
        DEFAULT_SITE_SETTINGS.register.ctaDescription,
      ),
      ctaItems: [
        {
          label: "Metode",
          value: isExternalHref(ctaHref) ? "Form Eksternal" : "Form di Website",
        },
        { label: "Durasi Isi", value: "1-2 Menit" },
        {
          label: "Akses",
          value: isExternalHref(ctaHref) ? "Terbuka di Tab Baru" : "Langsung di Website",
        },
        {
          label: "Status",
          value: remainingSlots <= 0 ? "Daftar Tunggu Aktif" : "Menunggu Verifikasi",
        },
      ],
      ctaAction: {
        label: withString(
          settings?.register_cta_action_label,
          DEFAULT_SITE_SETTINGS.register.ctaAction.label,
        ),
        href: ctaHref,
      },
    },
    live: {
      ...DEFAULT_SITE_SETTINGS.live,
      eyebrow: withString(settings?.live_eyebrow, DEFAULT_SITE_SETTINGS.live.eyebrow),
      title: withString(settings?.live_title, DEFAULT_SITE_SETTINGS.live.title),
      description: withString(
        settings?.live_description,
        DEFAULT_SITE_SETTINGS.live.description,
      ),
    },
    footer: {
      title: withString(settings?.footer_title, DEFAULT_SITE_SETTINGS.footer.title),
      description: withString(
        settings?.footer_description,
        DEFAULT_SITE_SETTINGS.footer.description,
      ),
    },
  };
}

function mapTeamRow(row) {
  return {
    id: row.id,
    name: row.name,
    short: withString(row.short_name, ""),
    captain: row.captain_name,
    contact: withString(row.captain_contact, "-"),
    region: withString(row.region, row.city || "-"),
    city: withString(row.city, ""),
    status: formatTeamStatus(row),
    teamStatus: row.status,
    placement: row.placement,
    eliminatedRound: withString(row.eliminated_round, ""),
    logoUrl: withString(row.logo_path, ""),
    seedNumber: row.seed_number,
  };
}

function mapMatchRow(row) {
  const teamA = getRelationName(row.team_a) || withString(row.team_a_placeholder, "TBD");
  const teamB = getRelationName(row.team_b) || withString(row.team_b_placeholder, "TBD");
  const hasScore =
    row.status === "live" ||
    row.status === "finished" ||
    row.score_a_total > 0 ||
    row.score_b_total > 0;

  return {
    id: row.id,
    event: withString(row.stage_name, "Main Bracket"),
    round: withString(row.round_name, "TBD"),
    roundNumber: row.round_number,
    matchNumber: row.match_number,
    date: row.scheduled_at,
    teamA,
    teamB,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    scoreA: hasScore ? row.score_a_total : null,
    scoreB: hasScore ? row.score_b_total : null,
    venue: withString(row.venue_name, "-"),
    status: row.status,
    winnerTeam: getRelationName(row.winner_team),
  };
}

function mapStreamRow(row, matchesById) {
  const linkedMatch = row.match_id ? matchesById[row.match_id] : null;

  return {
    id: row.id,
    youtubeId:
      withString(row.youtube_id, "") ||
      extractYoutubeId(row.embed_url) ||
      extractYoutubeId(row.stream_url) ||
      "-",
    title: row.title,
    teamA: linkedMatch?.teamA || "TBD",
    teamB: linkedMatch?.teamB || "TBD",
    date: row.scheduled_start_at
      ? formatDateTimeLabel(row.scheduled_start_at)
      : linkedMatch?.date
        ? formatDateTimeLabel(linkedMatch.date)
        : "-",
    status: formatStreamStatus(row.status),
  };
}

function createFallbackHomepageData() {
  return {
    source: "empty",
    tournament: null,
    error: null,
    siteSettings: DEFAULT_SITE_SETTINGS,
    bannerSlides: DEFAULT_BANNER_SLIDES,
    aboutItems: DEFAULT_ABOUT_ITEMS,
    tournamentConfig: DEFAULT_TOURNAMENT_CONFIG,
    remainingSlots: DEFAULT_TOURNAMENT_CONFIG.maxTeamSlots,
    coreTeams: [],
    faqItems: DEFAULT_FAQ_ITEMS,
    matches: [],
    liveStreams: [],
    bracketPreview: EMPTY_BRACKET_PREVIEW,
  };
}

export async function getPublicHomepageData() {
  const fallback = createFallbackHomepageData();

  if (!hasSupabaseEnv()) {
    return fallback;
  }

  const supabase = await createClient();
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select(
      "id, slug, name, short_name, status, format, team_slot_limit, roster_min_players, roster_max_players, registration_open_at, registration_close_at, check_in_deadline, technical_meeting_at, kickoff_at, grand_final_at, timezone, venue_name, public_notes, is_featured, created_at",
    )
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tournamentError || !tournament) {
    return {
      ...fallback,
      error: tournamentError?.message || null,
    };
  }

  const [
    { data: settings, error: settingsError },
    { data: summary, error: summaryError },
    { data: teamRows, error: teamsError },
    { data: matchRows, error: matchesError },
    { data: bracketSlotRows, error: bracketSlotsError },
    { data: streamRows, error: streamsError },
  ] = await Promise.all([
    supabase
      .from("site_settings")
      .select("*")
      .eq("tournament_id", tournament.id)
      .maybeSingle(),
    supabase
      .from("tournament_slot_summary")
      .select("*")
      .eq("tournament_id", tournament.id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select(
        "id, status, seed_number, name, short_name, captain_name, captain_contact, region, city, logo_path, placement, eliminated_round, approved_at",
      )
      .eq("tournament_id", tournament.id)
      .neq("status", "archived")
      .order("approved_at", { ascending: true }),
    supabase
      .from("matches")
      .select(
        "id, stage_name, round_name, round_number, match_number, status, scheduled_at, venue_name, team_a_id, team_b_id, team_a_placeholder, team_b_placeholder, score_a_total, score_b_total, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name), winner_team:teams!matches_winner_team_id_fkey(name)",
      )
      .eq("tournament_id", tournament.id)
      .order("round_number", { ascending: true })
      .order("match_number", { ascending: true }),
    supabase
      .from("bracket_slots")
      .select(
        "id, match_id, slot_side, display_label, source_outcome, source_match_id, team:teams!bracket_slots_team_id_fkey(name), source_match:matches!bracket_slots_source_match_id_fkey(round_name, match_number)",
      )
      .eq("tournament_id", tournament.id)
      .order("round_number", { ascending: true })
      .order("slot_number", { ascending: true }),
    supabase
      .from("streams")
      .select(
        "id, match_id, title, status, stream_url, embed_url, youtube_id, scheduled_start_at, is_featured, sort_order",
      )
      .eq("tournament_id", tournament.id)
      .neq("status", "archived")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("scheduled_start_at", { ascending: true }),
  ]);

  const coreTeams = teamsError ? [] : (teamRows || []).map(mapTeamRow);
  const matches = matchesError ? [] : (matchRows || []).map(mapMatchRow);
  const matchesById = Object.fromEntries(matches.map((match) => [match.id, match]));
  const liveStreams = streamsError
    ? []
    : (streamRows || []).map((stream) => mapStreamRow(stream, matchesById));
  const approvedTeamCount = summary?.approved_team_count ?? coreTeams.length;
  const remainingSlots = summary?.remaining_slots ?? Math.max(
    0,
    tournament.team_slot_limit - approvedTeamCount,
  );
  const siteSettings = mapSiteSettings(settings, tournament, remainingSlots);
  const dynamicBracketPreview =
    matchesError || bracketSlotsError
      ? EMPTY_BRACKET_PREVIEW
      : buildBracketPreviewFromData(EMPTY_BRACKET_PREVIEW, matchRows || [], bracketSlotRows || []);

  return {
    source: "database",
    tournament,
    error:
      settingsError?.message ||
      summaryError?.message ||
      teamsError?.message ||
      matchesError?.message ||
      bracketSlotsError?.message ||
      streamsError?.message ||
      null,
    siteSettings,
    bannerSlides: DEFAULT_BANNER_SLIDES,
    aboutItems: DEFAULT_ABOUT_ITEMS,
    tournamentConfig: {
      maxTeamSlots: tournament.team_slot_limit,
    },
    remainingSlots,
    coreTeams,
    faqItems: DEFAULT_FAQ_ITEMS,
    matches,
    liveStreams,
    bracketPreview: dynamicBracketPreview,
  };
}
