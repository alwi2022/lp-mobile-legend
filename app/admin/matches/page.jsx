import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
} from "../../../components/admin/admin-shell";
import {
  getAdminMatchesPageData,
  MATCH_FILTERS,
  normalizeMatchFilter,
} from "../../../lib/admin/matches";
import { MatchStatusPill } from "./match-form-parts";
import styles from "../../../components/admin/admin-shell.module.css";

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

export default async function AdminMatchesPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const activeFilter = normalizeMatchFilter(params?.status);
  const data = await getAdminMatchesPageData(activeFilter);

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Pertandingan"
        description="Pusat kerja utama: buat match, atur jam, pilih tim, lalu input skor."
      >
        {data.tournament && data.summary ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Total Pertandingan"
              value={String(data.summary.total_count)}
              helper={data.tournament.name}
            />
            <AdminStatCard label="Terjadwal" value={String(data.summary.scheduled_count)} />
            <AdminStatCard label="Berlangsung" value={String(data.summary.live_count)} />
            <AdminStatCard
              label="Selesai"
              value={String(data.summary.finished_count)}
              helper={`Game ${data.summary.total_games_count} | Dibatalkan ${data.summary.cancelled_count}`}
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen aktif"
            description={
              <>
                Halaman pertandingan membutuhkan turnamen utama. Kalau belum ada, buat dulu dari{" "}
                <Link href="/admin/settings" className={styles.filterLink}>
                  Pengaturan
                </Link>
                .
              </>
            }
          />
        )}
      </AdminSection>

      <AdminSection
        title="Daftar Match"
        description="Kolom dibuat ringkas supaya mudah dipakai saat hari-H."

      >
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              {MATCH_FILTERS.map((filter) => {
                const href =
                  filter.value === "all"
                    ? "/admin/matches"
                    : `/admin/matches?status=${encodeURIComponent(filter.value)}`;

                return (
                  <Link
                    key={filter.value}
                    href={href}
                    className={[
                      styles.filterLink,
                      activeFilter === filter.value ? styles.filterLinkActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
             <Link href="/admin/matches/new" className={styles.buttonPrimary}>
              Buat Pertandingan Baru
            </Link>
          </div>

          {data.matches.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Jam</th>
                    <th>Skor</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matches.map((match) => (
                    <tr key={match.id}>
                      <td>
                        <p className={styles.tableTitle}>{match.display_name}</p>
                        <p className={styles.tableSubtle}>
                          {match.round_name} | Match {match.match_number} | BO{match.best_of}
                        </p>
                        <MatchStatusPill value={match.status} />
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{formatDateTime(match.scheduled_at)}</p>
                      </td>
                      <td>
                        <p className={styles.tableTitle}>
                          {match.score_a_total} - {match.score_b_total}
                        </p>
                        <p className={styles.tableSubtle}>
                          {match.winner_team_name
                            ? `Pemenang ${match.winner_team_name}`
                            : "Belum ada pemenang"}
                        </p>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link href={`/admin/matches/${match.id}`} className={styles.filterLink}>
                            Kelola Match
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              title="Belum ada pertandingan untuk filter ini"
              description="Buat pertandingan pertama dulu, lalu kelola detail pairing dan skor game dari halaman detail masing-masing."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
