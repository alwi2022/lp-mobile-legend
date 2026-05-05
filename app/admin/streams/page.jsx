import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
} from "../../../components/admin/admin-shell";
import {
  getAdminStreamsPageData,
  normalizeStreamFilter,
  STREAM_FILTERS,
} from "../../../lib/admin/streams";
import { StreamStatusPill } from "./stream-form-parts";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminStreamsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const activeFilter = normalizeStreamFilter(params?.status);
  const data = await getAdminStreamsPageData(activeFilter);

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Siaran"
        description="Panel ini dipakai untuk memantau berapa banyak stream yang aktif, utama, atau sudah selesai."
      >
        {data.tournament && data.summary ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Total Siaran"
              value={String(data.summary.total_count)}
              helper={data.tournament.name}
            />
            <AdminStatCard
              label="Utama"
              value={String(data.summary.featured_count)}
            />
            <AdminStatCard
              label="Live + Segera"
              value={String(
                data.summary.live_count + data.summary.live_soon_count,
              )}
              helper={`Live ${data.summary.live_count}`}
            />
            <AdminStatCard
              label="Diarsipkan"
              value={String(data.summary.archived_count)}
              helper={`Pertandingan terkait ${data.matches.length}`}
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen aktif"
            description={
              <>
                Halaman siaran membutuhkan turnamen utama. Kalau belum ada, buat
                dulu dari{" "}
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
        title="Daftar Siaran"
        description="Halaman ini dibuat ringkas supaya kamu bisa pilih stream yang ingin dikelola tanpa melihat semua form sekaligus."
      >
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <div className={styles.filters} >
              {STREAM_FILTERS.map((filter) => {
                const href =
                  filter.value === "all"
                    ? "/admin/streams"
                    : `/admin/streams?status=${encodeURIComponent(filter.value)}`;

                return (
                  <Link
                    key={filter.value}
                    href={href}
                    className={[
                      styles.filterLink,
                      activeFilter === filter.value
                        ? styles.filterLinkActive
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {filter.label}
                  </Link>
                );
              })}

            </div>
              <Link href="/admin/streams/new"  className={styles.buttonPrimary}>
                Buat Siaran Baru
              </Link>
          </div>

          {data.streams.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Status</th>
                    <th>Pertandingan</th>
                    <th>Jadwal</th>
                    <th>Utama</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.streams.map((stream) => (
                    <tr key={stream.id}>
                      <td>
                        <p className={styles.tableTitle}>{stream.title}</p>
                        <p className={styles.tableSubtle}>{stream.platform}</p>
                      </td>
                      <td>
                        <StreamStatusPill value={stream.status} />
                      </td>
                      <td>
                        <p className={styles.tableTitle}>
                          {stream.match_label || "Siaran mandiri"}
                        </p>
                      </td>
                      <td>
                        <p className={styles.tableTitle}>
                          {formatDateTime(stream.scheduled_start_at)}
                        </p>
                        <p className={styles.tableSubtle}>
                          Mulai {formatDateTime(stream.started_at)}
                        </p>
                      </td>
                      <td>{stream.is_featured ? "Ya" : "-"}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link
                            href={`/admin/streams/${stream.id}`}
                            className={styles.filterLink}
                          >
                            Kelola Siaran
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
              title="Belum ada siaran untuk filter ini"
              description="Buat siaran pertama dulu, lalu kelola link live dan statusnya dari halaman detail."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
