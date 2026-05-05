import { redirect } from "next/navigation";
import { AdminShell } from "../../components/admin/admin-shell";
import { SetupRequired } from "../../components/admin/setup-required";
import { getCurrentAdmin } from "../../lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const state = await getCurrentAdmin();

  if (!state.configured) {
    return <SetupRequired />;
  }

  if (state.error) {
    return (
      <SetupRequired
        eyebrow="Pemeriksaan Database"
        title="Admin database belum siap"
        description="Auth sudah tersambung, tapi tabel atau kebijakan admin belum siap dipakai."
        details={state.error}
      />
    );
  }

  if (!state.user) {
    redirect("/login?next=/admin/overview");
  }

  if (!state.admin || !state.admin.is_active) {
    redirect("/login?error=Akses admin diperlukan&next=/admin/overview");
  }

  return (
    <AdminShell
      admin={state.admin}
      title="Dashboard Turnamen"
      description="Pusat operasional panitia untuk mengelola peserta, tim, pertandingan, bracket, siaran, dan akses admin."
    >
      {children}
    </AdminShell>
  );
}
