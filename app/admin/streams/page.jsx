import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
} from "../../../components/admin/admin-shell";
import { AdminListFilterControls } from "../../../components/admin/list-filter-controls";
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

function streamMatchesSearch(stream, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    stream.title,
    stream.platform,
    stream.status,
    stream.match_label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdminStreamsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const activeFilter = normalizeStreamFilter(params?.status);
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const data = await getAdminStreamsPageData(activeFilter);
  const streams = data.streams.filter((stream) => streamMatchesSearch(stream, query));

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.stack}>
          <div className={styles.crudHeader}>
            <h1 className={styles.crudTitle}>Siaran</h1>
            <div className={styles.crudActions}>
              <AdminListFilterControls
                basePath="/admin/streams"
                filters={STREAM_FILTERS}
                activeFilter={activeFilter}
                initialQuery={query}
                searchPlaceholder="Cari siaran..."
                filterLabel="Filter status siaran"
              />
              <Link href="/admin/streams/new" className={styles.buttonPrimary}>
                + Buat Siaran
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

          {streams.length ? (
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
                  {streams.map((stream) => (
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
              description="Buat siaran baru atau ubah filter pencarian."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
