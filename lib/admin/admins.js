import { getCurrentAdmin } from "../auth/admin";
import { createClient } from "../supabase/server";

export const ADMIN_ROLE_OPTIONS = [
  { value: "super_admin", label: "Superadmin" },
  { value: "admin", label: "Admin" },
  { value: "operator", label: "Operator" },
];

export async function getAdminAdminsPageData() {
  const state = await getCurrentAdmin();

  if (!state.configured) {
    return {
      currentAdmin: null,
      admins: [],
      summary: null,
      error: null,
    };
  }

  if (state.error) {
    return {
      currentAdmin: state.admin,
      admins: [],
      summary: null,
      error: state.error,
    };
  }

  if (!state.admin) {
    return {
      currentAdmin: null,
      admins: [],
      summary: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, user_id, full_name, role, phone, avatar_url, is_active, created_at, updated_at");

  if (error) {
    return {
      currentAdmin: state.admin,
      admins: [],
      summary: null,
      error: error.message,
    };
  }

  const admins = (data || []).sort((left, right) =>
    new Date(right.created_at) - new Date(left.created_at),
  );

  return {
    currentAdmin: state.admin,
    admins,
    summary: {
      total_count: admins.length,
      super_admin_count: admins.filter((item) => item.role === "super_admin").length,
      admin_count: admins.filter((item) => item.role === "admin").length,
      operator_count: admins.filter((item) => item.role === "operator").length,
      active_count: admins.filter((item) => item.is_active).length,
      inactive_count: admins.filter((item) => !item.is_active).length,
    },
    error: null,
  };
}

export async function getAdminDetailData(adminId) {
  const state = await getCurrentAdmin();

  if (!state.configured) {
    return {
      currentAdmin: null,
      admin: null,
      error: null,
    };
  }

  if (state.error) {
    return {
      currentAdmin: state.admin,
      admin: null,
      error: state.error,
    };
  }

  if (!state.admin || !adminId) {
    return {
      currentAdmin: state.admin || null,
      admin: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, user_id, full_name, role, phone, avatar_url, is_active, created_at, updated_at")
    .eq("id", adminId)
    .maybeSingle();

  if (error) {
    return {
      currentAdmin: state.admin,
      admin: null,
      error: error.message,
    };
  }

  return {
    currentAdmin: state.admin,
    admin: data || null,
    error: null,
  };
}
