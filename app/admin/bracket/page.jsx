import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.crudHeader}>
          <h1 className={styles.crudTitle}>Bracket</h1>
          <div className={styles.crudActions}>
            <Link href="/admin/matches/new" className={styles.buttonPrimary}>
              + Buat Match
            </Link>
            <Link href="/bracket" className={styles.filterLink}>
              Lihat Publik
            </Link>
          </div>
        </div>

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
