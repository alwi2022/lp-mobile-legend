import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
} from "../../../components/admin/admin-shell";
import { getAdminBracketPageData } from "../../../lib/admin/bracket";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function formatStatus(value = "") {
  return (
    {
      scheduled: "Terjadwal",
      live: "Berlangsung",
      finished: "Selesai",
      cancelled: "Dibatalkan",
    }[value] || String(value).replaceAll("_", " ")
  );
}

function getRoundMatches(matches, roundNumber) {
  return matches.filter((match) => match.round_number === roundNumber);
}

function getAutoLabel(match, side) {
  return "Belum dipilih";
}

function getTeamLabel(match, side) {
  if (side === "team_a") {
    return match.team_a_name || match.team_a_placeholder || getAutoLabel(match, side);
  }

  return match.team_b_name || match.team_b_placeholder || getAutoLabel(match, side);
}

export default async function AdminBracketPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminBracketPageData();
  const quarterFinals = getRoundMatches(data.matches, 1);
  const semiFinals = getRoundMatches(data.matches, 2);
  const grandFinals = getRoundMatches(data.matches, 3);
  const isLandingReady =
    quarterFinals.length === 4 && semiFinals.length === 2 && grandFinals.length === 1;

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Bracket Landing Page"
        description="Semua manual. Buat match Quarter Final, Semi Final, dan Grand Final satu per satu, lalu pilih Tim A dan Tim B sendiri."
      >
        <div className={styles.metaGrid}>
          <AdminStatCard label="Quarter Final" value={`${quarterFinals.length}/4`} compact />
          <AdminStatCard label="Semi Final" value={`${semiFinals.length}/2`} compact />
          <AdminStatCard label="Grand Final" value={`${grandFinals.length}/1`} compact />
          <AdminStatCard
            label="Status Landing"
            value={isLandingReady ? "Siap" : "Belum"}
            helper={isLandingReady ? "Bracket akan tampil dari match" : "Lengkapi jumlah match"}
            compact
          />
        </div>

        <div className={styles.buttonRow}>
          <Link href="/admin/matches/new" className={styles.buttonPrimary}>
            Buat Match Manual
          </Link>
          <Link href="/admin/matches" className={styles.filterLink}>
            Kelola Match
          </Link>
          <Link href="/bracket" className={styles.filterLink}>
            Lihat Bracket Publik
          </Link>
        </div>
      </AdminSection>

      <AdminSection
        title="Isi Bracket"
        description="Yang tampil di bracket publik adalah match yang ada di tabel ini. Tidak ada auto pemenang dan tidak ada placeholder."
      >
        {data.matches.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ronde</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.matches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <p className={styles.tableTitle}>{match.round_name}</p>
                      <p className={styles.tableSubtle}>Match {match.match_number}</p>
                    </td>
                    <td>
                      <p className={styles.tableTitle}>{getTeamLabel(match, "team_a")}</p>
                      <p className={styles.tableSubtle}>vs {getTeamLabel(match, "team_b")}</p>
                    </td>
                    <td>{formatStatus(match.status)}</td>
                    <td>
                      <Link href={`/admin/matches/${match.id}`} className={styles.filterLink}>
                        Edit Match
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada match"
            description="Buat match manual dari halaman Pertandingan. Bracket publik akan memakai data match itu."
            action={
              <Link href="/admin/matches/new" className={styles.buttonPrimary}>
                Buat Match
              </Link>
            }
          />
        )}
      </AdminSection>
    </>
  );
}
