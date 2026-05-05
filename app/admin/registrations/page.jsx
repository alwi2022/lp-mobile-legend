import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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

function buildFilterHref(status, query) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  const qs = params.toString();
  return qs ? `/admin/registrations?${qs}` : "/admin/registrations";
}

function registrationMatchesSearch(registration, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    registration.team_name,
    registration.team_short_name,
    registration.captain_name,
    registration.region,
    registration.city,
    registration.status,
    registration.official_team_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdminRegistrationsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const activeFilter = normalizeRegistrationFilter(params?.status);
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const data = await getAdminRegistrationsPageData(activeFilter);
  const registrations = data.registrations.filter((registration) =>
    registrationMatchesSearch(registration, query),
  );

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.stack}>
          <div className={styles.crudHeader}>
            <h1 className={styles.crudTitle}>Pendaftaran</h1>
            <form action="/admin/registrations" className={styles.crudActions}>
              {activeFilter !== "all" ? (
                <input type="hidden" name="status" value={activeFilter} />
              ) : null}
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
              description="Buat turnamen awal dari halaman Pengaturan dulu."
            />
          ) : null}

          <div className={styles.tableToolbar}>
            <div className={styles.filters}>
              {REGISTRATION_FILTERS.map((filter) => {
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

          {registrations.length ? (
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
                  {registrations.map((registration) => (
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
              description="Ubah filter, hapus pencarian, atau tunggu pendaftaran baru masuk."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
