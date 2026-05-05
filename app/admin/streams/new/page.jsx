import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
} from "../../../../components/admin/admin-shell";
import { getAdminStreamsPageData } from "../../../../lib/admin/streams";
import { createStreamAction } from "../actions";
import { StreamFormFields } from "../stream-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

export default async function AdminStreamNewPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminStreamsPageData("all");

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      {data.tournament ? (
        <form action={createStreamAction} className={styles.stack}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Buat Siaran</h1>
            <div className={styles.formActions}>
              <Link href="/admin/streams" className={styles.filterLink}>
                Cancel
              </Link>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Siaran
              </button>
            </div>
          </div>

          <div className={styles.formCard}>
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value="/admin/streams" />
            <StreamFormFields matches={data.matches} />
          </div>
        </form>
      ) : (
        <AdminEmptyState
          title="Belum ada turnamen aktif"
          description="Buat dulu turnamen aktif dari halaman Pengaturan sebelum menambah siaran baru."
        />
      )}
    </>
  );
}
