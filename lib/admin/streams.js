import { createClient } from "../supabase/server";
import { getPrimaryTournament } from "./tournaments";

export const STREAM_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draf" },
  { value: "live_soon", label: "Segera Tayang" },
  { value: "live", label: "Langsung" },
  { value: "ended", label: "Selesai" },
  { value: "archived", label: "Diarsipkan" },
];

export const STREAM_STATUS_OPTIONS = [
  { value: "draft", label: "Draf" },
  { value: "live_soon", label: "Segera Tayang" },
  { value: "live", label: "Langsung" },
  { value: "ended", label: "Selesai" },
  { value: "archived", label: "Diarsipkan" },
];

export const STREAM_PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "tiktok", label: "TikTok" },
  { value: "custom", label: "Custom" },
];

export function normalizeStreamFilter(value) {
  const validValues = new Set(STREAM_FILTERS.map((item) => item.value));
  return validValues.has(value) ? value : "all";
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

function buildMatchLabel(match) {
  const teamA = getRelationName(match.team_a) || withString(match.team_a_placeholder, "TBD");
  const teamB = getRelationName(match.team_b) || withString(match.team_b_placeholder, "TBD");
  return `${match.round_name} | Pertandingan ${match.match_number} | ${teamA} vs ${teamB}`;
}

export async function getAdminStreamsPageData(filter = "all") {
  const activeFilter = normalizeStreamFilter(filter);
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      activeFilter,
      matches: [],
      streams: [],
      summary: null,
      error: primary.error,
    };
  }

  if (!primary.tournament) {
    return {
      tournament: null,
      activeFilter,
      matches: [],
      streams: [],
      summary: null,
      error: null,
    };
  }

  const supabase = await createClient();
  let streamsQuery = supabase
    .from("streams")
    .select(
      "id, match_id, title, platform, status, stream_url, embed_url, youtube_id, scheduled_start_at, started_at, ended_at, is_featured, sort_order, notes, created_at",
    )
    .eq("tournament_id", primary.tournament.id)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("scheduled_start_at", { ascending: true, nullsFirst: false });

  if (activeFilter !== "all") {
    streamsQuery = streamsQuery.eq("status", activeFilter);
  }

  const [{ data: streamsData, error: streamsError }, { data: matchesData, error: matchesError }] =
    await Promise.all([
      streamsQuery,
      supabase
        .from("matches")
        .select(
          "id, round_name, match_number, scheduled_at, team_a_placeholder, team_b_placeholder, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name)",
        )
        .eq("tournament_id", primary.tournament.id)
        .order("round_number", { ascending: true })
        .order("match_number", { ascending: true }),
    ]);

  if (streamsError || matchesError) {
    return {
      tournament: primary.tournament,
      activeFilter,
      matches: [],
      streams: [],
      summary: null,
      error:
        streamsError?.message || matchesError?.message || "Gagal memuat data siaran.",
    };
  }

  const matches = (matchesData || []).map((match) => ({
    id: match.id,
    label: buildMatchLabel(match),
    scheduled_at: match.scheduled_at,
  }));

  const matchesById = Object.fromEntries(matches.map((match) => [match.id, match]));

  const streams = (streamsData || []).map((stream) => ({
    ...stream,
    match_label: stream.match_id ? matchesById[stream.match_id]?.label || "Pertandingan terkait" : "",
  }));

  const summary = {
    total_count: streams.length,
    featured_count: streams.filter((stream) => stream.is_featured).length,
    live_count: streams.filter((stream) => stream.status === "live").length,
    live_soon_count: streams.filter((stream) => stream.status === "live_soon").length,
    archived_count: streams.filter((stream) => stream.status === "archived").length,
  };

  return {
    tournament: primary.tournament,
    activeFilter,
    matches,
    streams,
    summary,
    error: null,
  };
}

export async function getAdminStreamDetailData(streamId) {
  const primary = await getPrimaryTournament();

  if (primary.error) {
    return {
      tournament: null,
      matches: [],
      stream: null,
      error: primary.error,
    };
  }

  if (!primary.tournament || !streamId) {
    return {
      tournament: primary.tournament || null,
      matches: [],
      stream: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const [
    { data: stream, error: streamError },
    { data: matchesData, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("streams")
      .select(
        "id, match_id, title, platform, status, stream_url, embed_url, youtube_id, scheduled_start_at, started_at, ended_at, is_featured, sort_order, notes, created_at",
      )
      .eq("tournament_id", primary.tournament.id)
      .eq("id", streamId)
      .maybeSingle(),
    supabase
      .from("matches")
      .select(
        "id, round_name, match_number, scheduled_at, team_a_placeholder, team_b_placeholder, team_a:teams!matches_team_a_id_fkey(name), team_b:teams!matches_team_b_id_fkey(name)",
      )
      .eq("tournament_id", primary.tournament.id)
      .order("round_number", { ascending: true })
      .order("match_number", { ascending: true }),
  ]);

  if (streamError || matchesError) {
    return {
      tournament: primary.tournament,
      matches: [],
      stream: null,
      error: streamError?.message || matchesError?.message || "Gagal memuat detail siaran.",
    };
  }

  if (!stream) {
    return {
      tournament: primary.tournament,
      matches: [],
      stream: null,
      error: null,
    };
  }

  const matches = (matchesData || []).map((match) => ({
    id: match.id,
    label: buildMatchLabel(match),
    scheduled_at: match.scheduled_at,
  }));
  const matchesById = Object.fromEntries(matches.map((match) => [match.id, match]));

  return {
    tournament: primary.tournament,
    matches,
    stream: {
      ...stream,
      match_label: stream.match_id
        ? matchesById[stream.match_id]?.label || "Pertandingan terkait"
        : "",
    },
    error: null,
  };
}
