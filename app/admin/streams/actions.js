"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import { normalizeStreamFilter } from "../../../lib/admin/streams";
import { createClient } from "../../../lib/supabase/server";

function normalizeReturnTo(value, fallback = "/admin/streams") {
  const candidate = String(value || "").trim();

  if (!candidate.startsWith("/admin") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function buildStreamsRedirect(type, message, statusFilter = "all", returnTo = "") {
  const basePath = normalizeReturnTo(returnTo);
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("message", message);

  const normalizedFilter =
    basePath === "/admin/streams" ? normalizeStreamFilter(statusFilter) : "all";
  if (basePath === "/admin/streams" && normalizedFilter !== "all") {
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

function readNullableIsoDateTime(formData, key) {
  const rawValue = readText(formData, key);

  if (!rawValue) {
    return null;
  }

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function readCheckbox(formData, key) {
  return formData.get(key) === "on";
}

function getContext(formData) {
  return {
    streamId: readText(formData, "stream_id"),
    tournamentId: readText(formData, "tournament_id"),
    statusFilter: readText(formData, "status_filter", "all"),
    returnTo: readText(formData, "return_to"),
    payload: {
      match_id: readNullableText(formData, "match_id"),
      title: readText(formData, "title"),
      platform: readText(formData, "platform", "youtube"),
      status: readText(formData, "status", "draft"),
      stream_url: readNullableText(formData, "stream_url"),
      embed_url: readNullableText(formData, "embed_url"),
      youtube_id: readNullableText(formData, "youtube_id"),
      scheduled_start_at: readNullableIsoDateTime(formData, "scheduled_start_at"),
      started_at: readNullableIsoDateTime(formData, "started_at"),
      ended_at: readNullableIsoDateTime(formData, "ended_at"),
      is_featured: readCheckbox(formData, "is_featured"),
      sort_order: readInteger(formData, "sort_order", 0),
      notes: readNullableText(formData, "notes"),
    },
  };
}

function revalidateStreamPaths(streamId = "") {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/streams");

  if (streamId) {
    revalidatePath(`/admin/streams/${streamId}`);
  }
}

function validatePayload(payload) {
  if (!payload.title) {
    return "Judul stream wajib diisi.";
  }

  if (payload.sort_order < 0) {
    return "Sort order tidak boleh negatif.";
  }

  return null;
}

async function clearFeaturedStreams(supabase, tournamentId, excludeId = "") {
  let query = supabase
    .from("streams")
    .update({ is_featured: false })
    .eq("tournament_id", tournamentId)
    .eq("is_featured", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  return query;
}

export async function createStreamAction(formData) {
  const state = await getCurrentAdmin();
  const { tournamentId, statusFilter, payload, returnTo } = getContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildStreamsRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!tournamentId) {
    redirect(buildStreamsRedirect("error", "ID turnamen tidak valid.", statusFilter, returnTo));
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    redirect(buildStreamsRedirect("error", validationError, statusFilter, returnTo));
  }

  const supabase = await createClient();

  if (payload.is_featured) {
    const { error: featuredError } = await clearFeaturedStreams(supabase, tournamentId);

    if (featuredError) {
      redirect(buildStreamsRedirect("error", featuredError.message, statusFilter, returnTo));
    }
  }

  const { data, error } = await supabase
    .from("streams")
    .insert({
      tournament_id: tournamentId,
      ...payload,
      created_by: state.user.sub,
      updated_by: state.user.sub,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(buildStreamsRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateStreamPaths(data?.id || "");
  redirect(buildStreamsRedirect("success", "Siaran berhasil dibuat.", statusFilter, returnTo));
}

export async function updateStreamAction(formData) {
  const state = await getCurrentAdmin();
  const { streamId, tournamentId, statusFilter, payload, returnTo } = getContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildStreamsRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!streamId || !tournamentId) {
    redirect(buildStreamsRedirect("error", "Konteks siaran tidak valid.", statusFilter, returnTo));
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    redirect(buildStreamsRedirect("error", validationError, statusFilter, returnTo));
  }

  const supabase = await createClient();

  if (payload.is_featured) {
    const { error: featuredError } = await clearFeaturedStreams(
      supabase,
      tournamentId,
      streamId,
    );

    if (featuredError) {
      redirect(buildStreamsRedirect("error", featuredError.message, statusFilter, returnTo));
    }
  }

  const { error } = await supabase
    .from("streams")
    .update({
      ...payload,
      updated_by: state.user.sub,
    })
    .eq("id", streamId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildStreamsRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateStreamPaths(streamId);
  redirect(buildStreamsRedirect("success", "Siaran berhasil diperbarui.", statusFilter, returnTo));
}

export async function deleteStreamAction(formData) {
  const state = await getCurrentAdmin();
  const { streamId, tournamentId, statusFilter, returnTo } = getContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildStreamsRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!streamId || !tournamentId) {
    redirect(buildStreamsRedirect("error", "Konteks siaran tidak valid.", statusFilter, returnTo));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("streams")
    .delete()
    .eq("id", streamId)
    .eq("tournament_id", tournamentId);

  if (error) {
    redirect(buildStreamsRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateStreamPaths();
  redirect(buildStreamsRedirect("success", "Siaran berhasil dihapus.", statusFilter));
}
