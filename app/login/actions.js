"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { hasSupabaseEnv } from "../../lib/supabase/env";
import { normalizeNextPath } from "../../lib/auth/utils";

export async function loginAction(formData) {
  const next = normalizeNextPath(formData.get("next"), "/admin/overview");

  if (!hasSupabaseEnv()) {
    redirect(`/login?error=${encodeURIComponent("Supabase belum dikonfigurasi.")}&next=${encodeURIComponent(next)}`);
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email dan password wajib diisi.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
