import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminDetailCard,
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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
  MatchStatusPill,
} from "../match-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function formatDateTime(value) {
  if (!value) {
    return "Belum diatur";
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "Belum diatur";
  }

  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

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
      <div className={styles.backRow}>
        <Link href="/admin/matches" className={styles.backLink}>
          Kembali ke daftar pertandingan
        </Link>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Kelola Match"
        description="Edit tim dan jam main di atas, lalu input skor game di bawah."
      >
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <div>
              <h4 className={styles.cardTitle}>{match.display_name}</h4>
              <p className={styles.subtle}>
                {match.stage_name} | {match.round_name} | Match {match.match_number}
              </p>
            </div>
            <MatchStatusPill value={match.status} />
          </div>

          <div className={styles.detailsGrid}>
            <AdminDetailCard label="Jadwal">
              <strong>{formatDateTime(match.scheduled_at)}</strong>
            </AdminDetailCard>

            <AdminDetailCard label="Format">
              <strong>BO{match.best_of}</strong>
              <p className={styles.subtle}>Ronde {match.round_number}</p>
            </AdminDetailCard>

            <AdminDetailCard label="Skor Seri">
              <strong>
                {match.score_a_total} - {match.score_b_total}
              </strong>
              <p className={styles.subtle}>
                {match.winner_team_name
                  ? `Pemenang ${match.winner_team_name}`
                  : "Belum ada pemenang"}
              </p>
            </AdminDetailCard>

            <AdminDetailCard label="Peserta">
              <strong>{match.team_a_name || match.team_a_placeholder || "TBD"}</strong>
              <p className={styles.subtle}>
                vs {match.team_b_name || match.team_b_placeholder || "TBD"}
              </p>
            </AdminDetailCard>
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Edit Match"
        description="Yang penting hanya ronde, jam main, tim, BO, dan status."
      >
        <div className={styles.stack}>
          <form action={updateMatchAction} className={styles.stack}>
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <input type="hidden" name="return_to" value={returnTo} />
            <MatchFormFields match={match} teams={data.teams} />
            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Match
              </button>
            </div>
          </form>

          <form action={deleteMatchAction}>
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <input type="hidden" name="status_filter" value="all" />
            <button type="submit" className={styles.buttonDanger}>
              Hapus Pertandingan
            </button>
          </form>
        </div>
      </AdminSection>

      <AdminSection
        title="Input Skor"
        description="Isi skor seri langsung. Untuk BO3 biasanya 2-0 atau 2-1."
      >
        <div className={styles.stack}>
          {!hasBothTeams ? (
            <AdminEmptyState
              title="Peserta belum lengkap"
              description="Pilih Tim A dan Tim B di form Edit Match dulu. Setelah itu input skor akan aktif."
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
                  Simpan Skor Match
                </button>
              </div>
            </form>
          )}
        </div>
      </AdminSection>
    </>
  );
}
