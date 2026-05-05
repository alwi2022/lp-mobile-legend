import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminDetailCard,
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatusBadge,
} from "../../../../components/admin/admin-shell";
import { getAdminRegistrationDetailData } from "../../../../lib/admin/registrations";
import {
  approveRegistrationAction,
  rejectRegistrationAction,
  waitlistRegistrationAction,
} from "../actions";
import styles from "../../../../components/admin/admin-shell.module.css";

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

export default async function AdminRegistrationDetailPage({
  params,
  searchParams,
}) {
  const route = await params;
  const query = await searchParams;
  const type = typeof query?.type === "string" ? query.type : "";
  const message = typeof query?.message === "string" ? query.message : "";
  const data = await getAdminRegistrationDetailData(route.registrationId);

  if (!data.tournament || !data.registration) {
    notFound();
  }

  const registration = data.registration;
  const returnTo = `/admin/registrations/${registration.id}`;

  return (
    <>
      <div className={styles.backRow}>
        <Link href="/admin/registrations" className={styles.backLink}>
          Kembali ke daftar pendaftaran
        </Link>

        {registration.official_team ? (
          <Link
            href={`/admin/teams/${registration.official_team.id}`}
            className={styles.filterLink}
          >
            Buka Tim Resmi
          </Link>
        ) : null}
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Pendaftaran"
        description="Cek data kapten, jumlah pemain, dan status resmi tim sebelum mengambil keputusan."
      >
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <div>
              <h4 className={styles.cardTitle}>{registration.team_name}</h4>
              <p className={styles.subtle}>
                {registration.team_short_name || "Tanpa singkatan"} |{" "}
                {registration.region}
                {registration.city ? `, ${registration.city}` : ""}
              </p>
            </div>
            <StatusPill value={registration.status} />
          </div>

          <div className={styles.detailsGrid}>
            <AdminDetailCard label="Kapten">
              <strong>{registration.captain_name}</strong>
            </AdminDetailCard>

            <AdminDetailCard label="Roster">
              <strong>{registration.roster_counts.total_players} pemain</strong>
            </AdminDetailCard>

            <AdminDetailCard label="Waktu Kirim">
              <strong>{formatDateTime(registration.submitted_at)}</strong>
            </AdminDetailCard>

            <AdminDetailCard label="Tim Resmi">
              {registration.official_team ? (
                <>
                  <strong>{registration.official_team.name}</strong>
                </>
              ) : (
                <p className={styles.subtle}>
                  Belum dipromosikan menjadi tim resmi.
                </p>
              )}
            </AdminDetailCard>
          </div>

          {registration.team_bio ? (
            <AdminDetailCard label="Catatan Tim Saat Daftar">
              <p className={styles.subtle}>{registration.team_bio}</p>
            </AdminDetailCard>
          ) : null}
        </div>
      </AdminSection>

      <AdminSection
        title="Roster Pendaftaran"
        description="Roster ini berasal langsung dari form publik. Gunakan untuk memastikan komposisi pemain sudah sesuai."
      >
        {data.players.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Urutan</th>
                  <th>Nama Tampil</th>
                  <th>Nama Dalam Game</th>
                  <th>Peran</th>
                  <th>Kapten</th>
                  <th>UID / Server</th>
                </tr>
              </thead>
              <tbody>
                {data.players.map((player) => (
                  <tr key={player.id}>
                    <td>{player.sort_order}</td>
                    <td>{player.display_name}</td>
                    <td>{player.in_game_name}</td>
                    <td>
                      {player.roster_role === "substitute"
                        ? "Cadangan"
                        : "Pemain"}
                    </td>
                    <td>{player.is_captain ? "Ya" : "-"}</td>
                    <td>
                      <p className={styles.tableTitle}>
                        {player.game_uid || "-"}
                      </p>
                      <p className={styles.tableSubtle}>
                        {player.game_server || "-"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada roster"
            description="Roster pemain belum masuk pada pendaftaran ini."
          />
        )}
      </AdminSection>

      <AdminSection
        title="Tindakan Pendaftaran"
        description="Setelah data dicek, pilih satu tindakan yang paling sesuai. Peserta tidak perlu daftar ulang setelah disetujui."
      >
        <form className={styles.inlineForm}>
          <input type="hidden" name="registration_id" value={registration.id} />
          <input type="hidden" name="status_filter" value="all" />
          <input type="hidden" name="admin_notes" value="" />
          <input type="hidden" name="return_to" value={returnTo} />
          <div className={styles.buttonRow}>
            {registration.status !== "approved" ? (
              <button
                type="submit"
                formAction={approveRegistrationAction}
                className={styles.buttonPrimary}
              >
                Setujui Pendaftaran
              </button>
            ) : null}
            {registration.status !== "waitlisted" ? (
              <button
                type="submit"
                formAction={waitlistRegistrationAction}
                className={styles.buttonSecondary}
              >
                Pindah ke Daftar Tunggu
              </button>
            ) : null}
            {registration.status !== "rejected" ? (
              <button
                type="submit"
                formAction={rejectRegistrationAction}
                className={styles.buttonDanger}
              >
                Tolak Pendaftaran
              </button>
            ) : null}
          </div>
        </form>
      </AdminSection>
    </>
  );
}
