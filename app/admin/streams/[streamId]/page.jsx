import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminMessage,
} from "../../../../components/admin/admin-shell";
import { getAdminStreamDetailData } from "../../../../lib/admin/streams";
import {
  deleteStreamAction,
  updateStreamAction,
} from "../actions";
import {
  StreamFormFields,
} from "../stream-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

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
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Edit Siaran</h1>
        <div className={styles.formActions}>
          <Link href="/admin/streams" className={styles.filterLink}>
            Cancel
          </Link>

          <form action={deleteStreamAction} className={styles.actionForm}>
            <input type="hidden" name="stream_id" value={stream.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <button type="submit" className={styles.buttonDanger}>
              Hapus
            </button>
          </form>

          <button type="submit" form="stream-update-form" className={styles.buttonPrimary}>
            Simpan Siaran
          </button>
        </div>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <div className={styles.formCard}>
        <form id="stream-update-form" action={updateStreamAction} className={styles.stack}>
          <input type="hidden" name="stream_id" value={stream.id} />
          <input type="hidden" name="tournament_id" value={data.tournament.id} />
          <input type="hidden" name="status_filter" value="all" />
          <input type="hidden" name="return_to" value={returnTo} />
          <StreamFormFields stream={stream} matches={data.matches} />
        </form>
      </div>
    </>
  );
}
