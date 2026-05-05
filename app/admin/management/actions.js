"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";

function buildAdminsRedirect(type, message) {
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("message", message);
  return `/admin/admins?${params.toString()}`;
}

function readText(formData, key, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function readNullableText(formData, key) {
  const value = readText(formData, key);
  return value || null;
}

function readCheckbox(formData, key) {
  return formData.get(key) === "on";
}

function ensureSuperAdmin(state) {
  if (!state.admin?.is_active || !state.user?.sub) {
    redirect(buildAdminsRedirect("error", "Akses admin diperlukan."));
  }

  if (state.admin.role !== "super_admin") {
    redirect(buildAdminsRedirect("error", "Hanya super admin yang boleh mengelola admin lain."));
  }
}

function getContext(formData) {
  return {
    adminId: readText(formData, "admin_id"),
    payload: {
      user_id: readText(formData, "user_id"),
      full_name: readText(formData, "full_name"),
      role: readText(formData, "role", "operator"),
      phone: readNullableText(formData, "phone"),
      avatar_url: readNullableText(formData, "avatar_url"),
      is_active: readCheckbox(formData, "is_active"),
    },
  };
}

function validatePayload(payload) {
  if (!payload.user_id) {
    return "ID pengguna Auth wajib diisi.";
  }

  if (!payload.full_name) {
    return "Nama admin wajib diisi.";
  }

  if (!["super_admin", "admin", "operator"].includes(payload.role)) {
    return "Peran admin tidak valid.";
  }

  return null;
}

function revalidateAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/admins");
}

export async function createAdminAction(formData) {
  const state = await getCurrentAdmin();
  ensureSuperAdmin(state);

  const { payload } = getContext(formData);
  const validationError = validatePayload(payload);

  if (validationError) {
    redirect(buildAdminsRedirect("error", validationError));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("admins").insert({
    ...payload,
    created_by: state.user.sub,
    updated_by: state.user.sub,
  });

  if (error) {
    redirect(buildAdminsRedirect("error", error.message));
  }

  revalidateAdminPaths();
  redirect(buildAdminsRedirect("success", "Admin berhasil dibuat."));
}

export async function updateAdminAction(formData) {
  const state = await getCurrentAdmin();
  ensureSuperAdmin(state);

  const { adminId, payload } = getContext(formData);

  if (!adminId) {
    redirect(buildAdminsRedirect("error", "Context admin tidak valid."));
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    redirect(buildAdminsRedirect("error", validationError));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("admins")
    .update({
      ...payload,
      updated_by: state.user.sub,
    })
    .eq("id", adminId);

  if (error) {
    redirect(buildAdminsRedirect("error", error.message));
  }

  revalidateAdminPaths();
  redirect(buildAdminsRedirect("success", "Admin berhasil diperbarui."));
}

export async function deleteAdminAction(formData) {
  const state = await getCurrentAdmin();
  ensureSuperAdmin(state);

  const adminId = readText(formData, "admin_id");

  if (!adminId) {
    redirect(buildAdminsRedirect("error", "Context admin tidak valid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("admins").delete().eq("id", adminId);

  if (error) {
    redirect(buildAdminsRedirect("error", error.message));
  }

  revalidateAdminPaths();
  redirect(buildAdminsRedirect("success", "Admin berhasil dihapus."));
}
