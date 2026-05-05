import Link from "next/link";
import {
  AdminEmptyState,
  AdminSection,
  AdminStatCard,
  AdminWelcomeCard,
} from "../../components/admin/admin-shell";
import { getAdminDashboardData } from "../../lib/admin/dashboard";
import styles from "../../components/admin/admin-shell.module.css";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <>
      <AdminWelcomeCard
        title="Dashboard Turnamen"
        description="Flow paling simple: approve tim, buat pertandingan, input skor, lalu set siaran."
      />

      <AdminSection
        title="Ikhtisar"
        description="Angka utama untuk melihat kondisi turnamen tanpa masuk ke halaman detail."
      >
        {data.tournament && data.summary ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Tim Disetujui"
              value={String(data.summary.approved_team_count)}
              helper={`Unggulan ${data.summary.seeded_team_count}`}
            />
            <AdminStatCard
              label="Pendaftaran Menunggu"
              value={String(data.summary.pending_registration_count)}
              helper={`Daftar tunggu ${data.summary.waitlisted_registration_count}`}
            />
            <AdminStatCard
              label="Sisa Slot"
              value={String(data.summary.remaining_slots)}
              helper={data.tournament.name}
            />
            <AdminStatCard
              label="Pertandingan Live"
              value={String(data.summary.live_match_count)}
              helper={`Selesai ${data.summary.finished_match_count} dari ${data.summary.total_match_count}`}
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen utama"
            description={
              <>
                Buat turnamen awal dulu dari{" "}
                <Link href="/admin/settings" className={styles.filterLink}>
                  Pengaturan
                </Link>{" "}
                supaya dashboard operasional mulai hidup.
              </>
            }
          />
        )}
      </AdminSection>

      <AdminSection
        title="Alur Kerja Simple"
        description="Ikuti urutan ini supaya hari-H tidak ribet."
      >
        {data.tournament && data.summary ? (
          <div className={styles.grid}>
            <article className={styles.card}>
              <h4 className={styles.cardTitle}>1. Approve Tim</h4>
              <p className={styles.pageCopy}>
                Cek pendaftaran, lalu setujui tim yang valid agar masuk ke daftar tim resmi.
              </p>
              <div className={styles.buttonRow}>
                <Link href="/admin/registrations" className={styles.filterLink}>
                  Buka Pendaftaran
                </Link>
              </div>
            </article>

            <article className={styles.card}>
              <h4 className={styles.cardTitle}>2. Cek Tim Resmi</h4>
              <p className={styles.pageCopy}>
                Pastikan nama tim, roster, dan kapten sudah benar sebelum drawing lawan.
              </p>
              <div className={styles.buttonRow}>
                <Link href="/admin/teams" className={styles.filterLink}>
                  Buka Tim
                </Link>
              </div>
            </article>

            <article className={styles.card}>
              <h4 className={styles.cardTitle}>3. Buat & Jalankan Match</h4>
              {data.nextMatch ? (
                <p className={styles.pageCopy}>
                  {data.nextMatch.label}
                  {data.nextMatch.scheduled_at
                    ? ` pada ${new Date(data.nextMatch.scheduled_at).toLocaleString("id-ID")}`
                    : ""}
                </p>
              ) : (
                <p className={styles.pageCopy}>
                  Setelah drawing, buat match dan input skor dari halaman pertandingan.
                </p>
              )}
              <div className={styles.buttonRow}>
                <Link href="/admin/matches" className={styles.filterLink}>
                  Buka Pertandingan
                </Link>
              </div>
            </article>

            <article className={styles.card}>
              <h4 className={styles.cardTitle}>4. Set Siaran</h4>
              <p className={styles.pageCopy}>
                Hubungkan live stream ke match yang sedang atau akan ditayangkan.
              </p>
              <div className={styles.buttonRow}>
                <Link href="/admin/streams" className={styles.filterLink}>
                  Buka Siaran
                </Link>
              </div>
            </article>
          </div>
        ) : (
          <AdminEmptyState
            title="Dashboard menunggu data operasional"
            description="Setelah turnamen aktif tersedia, ringkasan pertandingan, tim, dan siaran akan tampil otomatis di sini."
          />
        )}
      </AdminSection>
    </>
  );
}
