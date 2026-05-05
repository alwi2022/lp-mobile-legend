import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
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

export default async function AdminTeamsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminTeamsPageData();

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Tim"
        description="Gunakan halaman ini untuk memantau tim final yang sudah siap dipakai di pertandingan dan bracket."
      >
        {data.tournament && data.summary ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Total Tim"
              value={String(data.summary.total_count)}
              helper={data.tournament.name}
            />
            <AdminStatCard
              label="Aktif"
              value={String(data.summary.active_count)}
              helper={`Unggulan ${data.summary.seeded_count}`}
            />
            <AdminStatCard
              label="Tereliminasi"
              value={String(data.summary.eliminated_count)}
              helper={`Juara ${data.summary.champion_count}`}
            />
            <AdminStatCard
              label="Total Roster"
              value={String(data.summary.roster_count)}
              helper={`Diarsipkan ${data.summary.archived_count}`}
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen aktif"
            description={
              <>
                Halaman tim membutuhkan turnamen utama. Kalau belum ada, buat dulu dari{" "}
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
        title="Daftar Tim Resmi"
        description="Tim resmi muncul otomatis setelah pendaftaran disetujui. Halaman utama ini sengaja dibuat sederhana, sedangkan edit data dan roster dipindah ke halaman detail."
      >
        <div className={styles.stack}>
          {data.teams.length ? (
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
                  {data.teams.map((team) => (
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
              description="Tim resmi akan muncul setelah pendaftaran publik disetujui dari halaman Pendaftaran."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
