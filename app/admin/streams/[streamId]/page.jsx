import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminDetailCard,
  AdminMessage,
  AdminSection,
  AdminEmptyState,
} from "../../../../components/admin/admin-shell";
import { getAdminStreamDetailData } from "../../../../lib/admin/streams";
import {
  deleteStreamAction,
  updateStreamAction,
} from "../actions";
import {
  StreamFormFields,
  StreamStatusPill,
} from "../stream-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminStreamDetailPage({ params, searchParams }) {
  const route = await params;
  const query = await searchParams;
  const type = typeof query?.type === "string" ? query.type : "";
  const message = typeof query?.message === "string" ? query.message : "";
  const data = await getAdminStreamDetailData(route.streamId);

  if (!data.tournament || !data.stream) {
    notFound();
  }

  const stream = data.stream;
  const returnTo = `/admin/streams/${stream.id}`;

  return (
    <>
      <div className={styles.backRow}>
        <Link href="/admin/streams" className={styles.backLink}>
          Kembali ke daftar siaran
        </Link>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Siaran"
        description="Cek status live, match terkait, dan identitas stream sebelum mengubah link siaran."
      >
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <div>
              <h4 className={styles.cardTitle}>{stream.title}</h4>
              <p className={styles.subtle}>{stream.match_label || "Siaran mandiri"}</p>
            </div>
            <StreamStatusPill value={stream.status} />
          </div>

          <div className={styles.detailsGrid}>
            <AdminDetailCard label="Platform">
              <strong>{stream.platform}</strong>
            </AdminDetailCard>

            <AdminDetailCard label="Siaran Utama">
              <strong>{stream.is_featured ? "Ya" : "Tidak"}</strong>
            </AdminDetailCard>

            <AdminDetailCard label="Jadwal">
              <strong>{formatDateTime(stream.scheduled_start_at)}</strong>
              <p className={styles.subtle}>Mulai {formatDateTime(stream.started_at)}</p>
            </AdminDetailCard>

            <AdminDetailCard label="YouTube ID">
              <strong>{stream.youtube_id || "-"}</strong>
            </AdminDetailCard>
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Data Siaran"
        description="Ubah judul siaran, tautan live, status penayangan, dan pilihan siaran utama dari form yang sudah dipisah per grup."
      >
        <div className={styles.stack}>
          <form action={updateStreamAction} className={styles.stack}>
            <input type="hidden" name="stream_id" value={stream.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value={returnTo} />
            <StreamFormFields stream={stream} matches={data.matches} />
            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Data Siaran
              </button>
            </div>
          </form>

          <form action={deleteStreamAction}>
            <input type="hidden" name="stream_id" value={stream.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <button type="submit" className={styles.buttonDanger}>
              Hapus Siaran
            </button>
          </form>
        </div>
      </AdminSection>
    </>
  );
}
