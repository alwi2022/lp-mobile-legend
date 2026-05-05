import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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

function buildFilterHref(status, query) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  const qs = params.toString();
  return qs ? `/admin/streams?${qs}` : "/admin/streams";
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
              <form action="/admin/streams" className={styles.crudActions}>
                {activeFilter !== "all" ? (
                  <input type="hidden" name="status" value={activeFilter} />
                ) : null}
                <input
                  className={styles.searchInput}
                  name="q"
                  defaultValue={query}
                  placeholder="Cari siaran..."
                />
              </form>
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

          <div className={styles.tableToolbar}>
            <div className={styles.filters}>
              {STREAM_FILTERS.map((filter) => {
                return (
                  <Link
                    key={filter.value}
                    href={buildFilterHref(filter.value, query)}
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
          </div>

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
              description="Buat siaran baru atau ubah filter pencarian."
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
