import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
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
      <AdminMessage type={type} message={message || data.error} />

      {data.tournament ? (
        <form action={createMatchAction} className={styles.stack}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Buat Match</h1>
            <div className={styles.formActions}>
              <Link href="/admin/matches" className={styles.filterLink}>
                Cancel
              </Link>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Match
              </button>
            </div>
          </div>

          <div className={styles.formCard}>
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value="/admin/matches" />
            <MatchFormFields teams={data.teams} />
          </div>
        </form>
      ) : (
        <AdminEmptyState
          title="Belum ada turnamen aktif"
          description="Buat dulu turnamen aktif dari halaman Pengaturan sebelum menambah pertandingan baru."
        />
      )}
    </>
  );
}
