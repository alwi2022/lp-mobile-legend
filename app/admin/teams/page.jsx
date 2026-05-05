import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatusBadge,
} from "../../../components/admin/admin-shell";
import { getAdminTeamsPageData } from "../../../lib/admin/teams";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function StatusPill({ value }) {
  const config = {
    active: { label: "aktif", tone: "success" },
    eliminated: { label: "tereliminasi", tone: "neutral" },
    champion: { label: "juara", tone: "accent" },
    archived: { label: "diarsipkan", tone: "danger" },
  }[String(value)] || {
    label: String(value).replaceAll("_", " "),
    tone: "neutral",
  };

  return <AdminStatusBadge label={config.label} tone={config.tone} />;
}

function teamMatchesSearch(team, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    team.name,
    team.short_name,
    team.captain_name,
    team.region,
    team.city,
    team.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdminTeamsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const data = await getAdminTeamsPageData();
  const teams = data.teams.filter((team) => teamMatchesSearch(team, query));

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.stack}>
          <div className={styles.crudHeader}>
            <h1 className={styles.crudTitle}>Tim Resmi</h1>
            <form action="/admin/teams" className={styles.crudActions}>
              <input
                className={styles.searchInput}
                name="q"
                defaultValue={query}
                placeholder="Cari tim..."
              />
            </form>
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

          {teams.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tim</th>
                    <th>Kapten</th>
                    <th>Roster</th>
                    <th>Status</th>
                    <th>Peringkat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <p className={styles.tableTitle}>{team.name}</p>

                      </td>
                      <td>
                        <p className={styles.tableTitle}>{team.captain_name}</p>
                      </td>
                      <td>
                        <p className={styles.tableTitle}>
                          {team.roster_counts.total_players} pemain
                        </p>
                       
                      </td>
                      <td>
                        <StatusPill value={team.status} />
                      </td>
                      <td>
                  
                        <p className={styles.tableSubtle}>
                          {team.placement ? `Peringkat ${team.placement}` : "Belum ada peringkat"}
                        </p>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link href={`/admin/teams/${team.id}`} className={styles.filterLink}>
                            Kelola Tim
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
              title="Belum ada tim resmi"
              description="Tim resmi akan muncul setelah pendaftaran disetujui atau setelah pencarian dihapus."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
