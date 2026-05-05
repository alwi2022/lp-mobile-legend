import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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
      <div className={styles.backRow}>
        <Link href="/admin/streams" className={styles.backLink}>
          Kembali ke daftar siaran
        </Link>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Buat Siaran Baru"
        description="Kamu bisa menghubungkan siaran ke pertandingan tertentu atau membiarkannya sebagai siaran mandiri."
      >
        {data.tournament ? (
          <form action={createStreamAction} className={styles.stack}>
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value="/admin/streams/new" />
            <StreamFormFields matches={data.matches} />
            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Siaran Baru
              </button>
              <Link href="/admin/streams" className={styles.filterLink}>
                Lihat Daftar Siaran
              </Link>
            </div>
          </form>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen aktif"
            description="Buat dulu turnamen aktif dari halaman Pengaturan sebelum menambah siaran baru."
          />
        )}
      </AdminSection>
    </>
  );
}
