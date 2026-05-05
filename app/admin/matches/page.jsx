import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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

function buildFilterHref(status, query) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  const qs = params.toString();
  return qs ? `/admin/matches?${qs}` : "/admin/matches";
}

function matchesSearch(match, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    match.display_name,
    match.round_name,
    match.team_a_name,
    match.team_b_name,
    match.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdminMatchesPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const activeFilter = normalizeMatchFilter(params?.status);
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const data = await getAdminMatchesPageData(activeFilter);
  const matches = data.matches.filter((match) => matchesSearch(match, query));

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.stack}>
          <div className={styles.crudHeader}>
            <h1 className={styles.crudTitle}>Jadwal Pertandingan</h1>
            <div className={styles.crudActions}>
              <form action="/admin/matches" className={styles.crudActions}>
                {activeFilter !== "all" ? (
                  <input type="hidden" name="status" value={activeFilter} />
                ) : null}
                <input
                  className={styles.searchInput}
                  name="q"
                  defaultValue={query}
                  placeholder="Cari match..."
                />
              </form>
              <Link href="/admin/matches/new" className={styles.buttonPrimary}>
                + Buat Match
              </Link>
            </div>
          </div>

          {!data.tournament ? (
            <AdminEmptyState
              title="Belum ada turnamen aktif"
              description={
                <>
                  Buat turnamen aktif dulu dari{" "}
                  <Link href="/admin/settings" className={styles.filterLink}>
                    Pengaturan
                  </Link>
                  .
                </>
              }
            />
          ) : null}

          <div className={styles.tableToolbar}>
            <div className={styles.filters}>
              {MATCH_FILTERS.map((filter) => {
                return (
                  <Link
                    key={filter.value}
                    href={buildFilterHref(filter.value, query)}
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
          </div>

          {matches.length ? (
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
                  {matches.map((match) => (
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
              description="Buat match baru atau ubah filter pencarian."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
