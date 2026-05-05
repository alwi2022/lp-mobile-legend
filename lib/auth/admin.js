import { createClient } from "../supabase/server";
import { hasSupabaseEnv } from "../supabase/env";

export async function getCurrentAdmin() {
  if (!hasSupabaseEnv()) {
    return {
      configured: false,
      user: null,
      admin: null,
      error: null,
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub || null;

  if (claimsError) {
    return {
      configured: true,
      user: null,
      admin: null,
      error: claimsError.message,
    };
  }

  if (!userId) {
    return {
      configured: true,
      user: null,
      admin: null,
      error: null,
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id, user_id, full_name, role, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    return {
      configured: true,
      user: claimsData.claims,
      admin: null,
      error: adminError.message,
    };
  }

  return {
    configured: true,
    user: claimsData.claims,
    admin,
    error: null,
  };
}
