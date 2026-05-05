import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
} from "../../../../components/admin/admin-shell";
import { getAdminMatchesPageData } from "../../../../lib/admin/matches";
import { createMatchAction } from "../actions";
import { MatchFormFields } from "../match-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

export default async function AdminMatchNewPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminMatchesPageData("all");

  return (
    <>
      <div className={styles.backRow}>
        <Link href="/admin/matches" className={styles.backLink}>
          Kembali ke daftar pertandingan
        </Link>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Buat Match"
        description="Setelah drawing, pilih ronde, jam main, Tim A, dan Tim B."
      >
        {data.tournament ? (
          <form action={createMatchAction} className={styles.stack}>
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value="/admin/matches" />
            <MatchFormFields teams={data.teams} />
            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Match
              </button>
              <Link href="/admin/matches" className={styles.filterLink}>
                Lihat Daftar Pertandingan
              </Link>
            </div>
          </form>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen aktif"
            description="Buat dulu turnamen aktif dari halaman Pengaturan sebelum menambah pertandingan baru."
          />
        )}
      </AdminSection>
    </>
  );
}
