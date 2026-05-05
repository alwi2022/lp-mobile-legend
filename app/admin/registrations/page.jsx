import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
  AdminStatusBadge,
} from "../../../components/admin/admin-shell";
import {
  getAdminRegistrationsPageData,
  REGISTRATION_FILTERS,
  normalizeRegistrationFilter,
} from "../../../lib/admin/registrations";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function StatusPill({ value }) {
  const config = {
    pending: { label: "menunggu", tone: "warning" },
    approved: { label: "disetujui", tone: "success" },
    rejected: { label: "ditolak", tone: "danger" },
    waitlisted: { label: "daftar tunggu", tone: "info" },
  }[value] || { label: value, tone: "neutral" };

  return <AdminStatusBadge label={config.label} tone={config.tone} />;
}

function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminRegistrationsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const activeFilter = normalizeRegistrationFilter(params?.status);
  const data = await getAdminRegistrationsPageData(activeFilter);

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Pendaftaran"
        description="Gunakan angka ini untuk melihat antrean yang benar-benar perlu direview lebih dulu."
      >
        {data.tournament && data.summary ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Tim Disetujui"
              value={String(data.summary.approved_team_count)}
              helper={`Batas slot ${data.summary.team_slot_limit}`}
            />
            <AdminStatCard
              label="Menunggu"
              value={String(data.summary.pending_registration_count)}
            />
            <AdminStatCard
              label="Daftar Tunggu"
              value={String(data.summary.waitlisted_registration_count)}
            />
            <AdminStatCard
              label="Sisa Slot"
              value={String(data.summary.remaining_slots)}
              helper={`Ditolak ${data.summary.rejected_registration_count}`}
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen aktif"
            description={
              <>
                Halaman pendaftaran membutuhkan satu baris data di tabel{" "}
                <span className={styles.code}>tournaments</span>. Kamu bisa membuat turnamen awal
                dari halaman Pengaturan dulu.
              </>
            }
          />
        )}
      </AdminSection>

      <AdminSection
        title="Daftar Pendaftaran"
        description="Halaman utama ini dibuat untuk scan dan filter. Buka detail hanya saat kamu perlu cek roster lengkap atau mengambil keputusan."

      >
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              {REGISTRATION_FILTERS.map((filter) => {
                const href =
                  filter.value === "all"
                    ? "/admin/registrations"
                    : `/admin/registrations?status=${encodeURIComponent(filter.value)}`;

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
          </div>

          {data.registrations.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tim</th>
                    <th>Kapten</th>
                    <th>Roster</th>
                    <th>Status</th>
                    <th>Dikirim</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>
                        <p className={styles.tableTitle}>{registration.team_name}</p>
                       
                       
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{registration.captain_name}</p>
                       
                      </td>
                      <td>
                        <p className={styles.tableTitle}>
                          {registration.roster_counts.total_players} pemain
                        </p>
                      
                      </td>
                      <td>
                        <StatusPill value={registration.status} />
                        <p className={styles.tableSubtle}>
                          {registration.official_team_name && `(${registration.official_team_name})`} 
                        </p>
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{formatDateTime(registration.submitted_at)}</p>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link
                            href={`/admin/registrations/${registration.id}`}
                            className={styles.filterLink}
                          >
                            Buka Detail
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
              title="Belum ada data untuk filter ini"
              description="Begitu form publik dihubungkan ke database, kiriman pendaftaran akan muncul di halaman ini."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
