"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import { normalizeRegistrationFilter } from "../../../lib/admin/registrations";
import { createClient } from "../../../lib/supabase/server";

function normalizeReturnTo(value, fallback = "/admin/registrations") {
  const candidate = String(value || "").trim();

  if (!candidate.startsWith("/admin") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function buildRegistrationsRedirect(type, message, statusFilter = "all", returnTo = "") {
  const basePath = normalizeReturnTo(returnTo);
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("message", message);

  const normalizedFilter =
    basePath === "/admin/registrations" ? normalizeRegistrationFilter(statusFilter) : "all";
  if (basePath === "/admin/registrations" && normalizedFilter !== "all") {
    params.set("status", normalizedFilter);
  }

  return `${basePath}?${params.toString()}`;
}

function readText(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function getStatusContext(formData) {
  return {
    registrationId: readText(formData, "registration_id"),
    statusFilter: readText(formData, "status_filter", "all"),
    adminNotes: readText(formData, "admin_notes"),
    returnTo: readText(formData, "return_to"),
  };
}

function revalidateRegistrationPaths(registrationId = "", teamId = "") {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/teams");

  if (registrationId) {
    revalidatePath(`/admin/registrations/${registrationId}`);
  }

  if (teamId) {
    revalidatePath(`/admin/teams/${teamId}`);
  }
}

export async function approveRegistrationAction(formData) {
  const state = await getCurrentAdmin();
  const { registrationId, statusFilter, returnTo } = getStatusContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildRegistrationsRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!registrationId) {
    redirect(
      buildRegistrationsRedirect("error", "ID pendaftaran tidak valid.", statusFilter, returnTo),
    );
  }

  const supabase = await createClient();
  const { data: createdTeamId, error } = await supabase.rpc("promote_registration_to_team", {
    target_registration_id: registrationId,
    approver_user_id: state.user.sub,
    target_seed_number: null,
  });

  if (error) {
    redirect(buildRegistrationsRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateRegistrationPaths(registrationId, createdTeamId || "");
  redirect(
    buildRegistrationsRedirect(
      "success",
      "Pendaftaran berhasil disetujui.",
      statusFilter,
      returnTo,
    ),
  );
}

export async function rejectRegistrationAction(formData) {
  const state = await getCurrentAdmin();
  const { registrationId, statusFilter, adminNotes, returnTo } = getStatusContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildRegistrationsRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!registrationId) {
    redirect(
      buildRegistrationsRedirect("error", "ID pendaftaran tidak valid.", statusFilter, returnTo),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .update({
      status: "rejected",
      admin_notes: adminNotes || null,
      rejected_by: state.user.sub,
      reviewed_at: new Date().toISOString(),
      updated_by: state.user.sub,
    })
    .eq("id", registrationId);

  if (error) {
    redirect(buildRegistrationsRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateRegistrationPaths(registrationId);
  redirect(
    buildRegistrationsRedirect(
      "success",
      "Pendaftaran berhasil ditolak.",
      statusFilter,
      returnTo,
    ),
  );
}

export async function waitlistRegistrationAction(formData) {
  const state = await getCurrentAdmin();
  const { registrationId, statusFilter, adminNotes, returnTo } = getStatusContext(formData);

  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildRegistrationsRedirect("error", "Akses admin diperlukan.", statusFilter, returnTo));
  }

  if (!registrationId) {
    redirect(
      buildRegistrationsRedirect("error", "ID pendaftaran tidak valid.", statusFilter, returnTo),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .update({
      status: "waitlisted",
      admin_notes: adminNotes || null,
      waitlisted_by: state.user.sub,
      reviewed_at: new Date().toISOString(),
      updated_by: state.user.sub,
    })
    .eq("id", registrationId);

  if (error) {
    redirect(buildRegistrationsRedirect("error", error.message, statusFilter, returnTo));
  }

  revalidateRegistrationPaths(registrationId);
  redirect(
    buildRegistrationsRedirect(
      "success",
      "Pendaftaran dipindah ke daftar tunggu.",
      statusFilter,
      returnTo,
    ),
  );
}
