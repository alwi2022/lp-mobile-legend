import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminEmptyState,
  AdminMessage,
} from "../../../../components/admin/admin-shell";
import { getAdminMatchDetailData } from "../../../../lib/admin/matches";
import {
  deleteMatchAction,
  updateMatchAction,
  updateMatchResultAction,
} from "../actions";
import {
  MatchFormFields,
  MatchResultFormFields,
} from "../match-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

export default async function AdminMatchDetailPage({ params, searchParams }) {
  const route = await params;
  const query = await searchParams;
  const type = typeof query?.type === "string" ? query.type : "";
  const message = typeof query?.message === "string" ? query.message : "";
  const data = await getAdminMatchDetailData(route.matchId);

  if (!data.tournament || !data.match) {
    notFound();
  }

  const match = data.match;
  const returnTo = `/admin/matches/${match.id}`;
  const hasBothTeams = Boolean(match.team_a_id && match.team_b_id);

  return (
    <>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Edit Match</h1>
        <div className={styles.formActions}>
          <Link href="/admin/matches" className={styles.filterLink}>
            Cancel
          </Link>

          <form action={deleteMatchAction} className={styles.actionForm}>
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <button type="submit" className={styles.buttonDanger}>
              Hapus
            </button>
          </form>

          <button type="submit" form="match-update-form" className={styles.buttonPrimary}>
            Simpan Match
          </button>
        </div>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <div className={styles.formCard}>
        <form id="match-update-form" action={updateMatchAction} className={styles.stack}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="tournament_id" value={data.tournament.id} />
          <input type="hidden" name="status_filter" value="all" />
          <input type="hidden" name="return_to" value={returnTo} />
          <MatchFormFields match={match} teams={data.teams} />
        </form>
      </div>

      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>Input Skor</h2>
        {!hasBothTeams ? (
          <AdminEmptyState
            title="Peserta belum lengkap"
            description="Pilih Tim A dan Tim B dulu."
          />
        ) : (
          <form action={updateMatchResultAction} className={styles.stack}>
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value={returnTo} />
            <MatchResultFormFields match={match} />
            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Skor
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
