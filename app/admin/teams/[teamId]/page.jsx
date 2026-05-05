import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatusBadge,
} from "../../../../components/admin/admin-shell";
import { getAdminTeamDetailData } from "../../../../lib/admin/teams";
import {
  createTeamPlayerAction,
  deleteTeamAction,
  deleteTeamPlayerAction,
  updateTeamAction,
  updateTeamPlayerAction,
} from "../actions";
import { TeamFormFields, TeamPlayerFormFields } from "../team-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function PlayerStatusPill({ player }) {
  return (
    <AdminStatusBadge
      label={player.is_active ? "aktif" : "arsip"}
      tone={player.is_active ? "success" : "danger"}
    />
  );
}

export default async function AdminTeamDetailPage({ params, searchParams }) {
  const route = await params;
  const query = await searchParams;
  const type = typeof query?.type === "string" ? query.type : "";
  const message = typeof query?.message === "string" ? query.message : "";
  const data = await getAdminTeamDetailData(route.teamId);

  if (!data.tournament || !data.team) {
    notFound();
  }

  const team = data.team;
  const returnTo = `/admin/teams/${team.id}`;

  return (
    <>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Edit Tim</h1>
        <div className={styles.formActions}>
          <Link href="/admin/teams" className={styles.filterLink}>
            Cancel
          </Link>

          <form action={deleteTeamAction} className={styles.actionForm}>
            <input type="hidden" name="team_id" value={team.id} />
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <button type="submit" className={styles.buttonDanger}>
              Hapus
            </button>
          </form>

          <button type="submit" form="team-update-form" className={styles.buttonPrimary}>
            Simpan Tim
          </button>
        </div>
      </div>

      <AdminMessage type={type} message={message || data.error} />

      <div className={styles.formCard}>
        <form id="team-update-form" action={updateTeamAction} className={styles.stack}>
          <input type="hidden" name="team_id" value={team.id} />
          <input type="hidden" name="tournament_id" value={data.tournament.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <TeamFormFields team={team} />
        </form>
      </div>

      <AdminSection title="Roster Tim">
        <div className={styles.stack}>
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
                    <th>Status</th>
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
                          : player.roster_role === "captain"
                            ? "Kapten"
                            : "Pemain"}
                      </td>
                      <td>{player.is_captain ? "Ya" : "-"}</td>
                      <td>
                        <PlayerStatusPill player={player} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              title="Belum ada roster final"
              description="Tambahkan pemain inti dan cadangan di bawah supaya tim ini siap dipakai untuk pertandingan."
            />
          )}

          <div className={styles.subSection}>
            <div>
              <strong className={styles.cardTitle}>Tambah Pemain Roster</strong>
              <p className={styles.subtle}>
                Gunakan form ini untuk menambahkan pemain baru ke tim.
              </p>
            </div>
            <form action={createTeamPlayerAction} className={styles.stack}>
              <input type="hidden" name="team_id" value={team.id} />
              <input
                type="hidden"
                name="tournament_id"
                value={data.tournament.id}
              />
              <input type="hidden" name="return_to" value={returnTo} />
              <TeamPlayerFormFields />
              <div className={styles.buttonRow}>
                <button type="submit" className={styles.buttonSecondary}>
                  Tambah Pemain
                </button>
              </div>
            </form>
          </div>

          {data.players.length ? (
            <div className={styles.stack}>
              {data.players.map((player) => (
                <details key={player.id} className={styles.accordion}>
                  <summary className={styles.accordionSummary}>
                    <span>
                      Edit {player.display_name} | {player.in_game_name}
                    </span>
                    <span className={styles.subtle}>Buka form edit</span>
                  </summary>
                  <div className={styles.accordionBody}>
                    <form
                      action={updateTeamPlayerAction}
                      className={styles.stack}
                    >
                      <input type="hidden" name="player_id" value={player.id} />
                      <input type="hidden" name="team_id" value={team.id} />
                      <input
                        type="hidden"
                        name="tournament_id"
                        value={data.tournament.id}
                      />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <TeamPlayerFormFields player={player} />
                      <div className={styles.buttonRow}>
                        <button type="submit" className={styles.buttonPrimary}>
                          Simpan Pemain
                        </button>
                      </div>
                    </form>

                    <form action={deleteTeamPlayerAction}>
                      <input type="hidden" name="player_id" value={player.id} />
                      <input type="hidden" name="team_id" value={team.id} />
                      <input
                        type="hidden"
                        name="tournament_id"
                        value={data.tournament.id}
                      />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <button type="submit" className={styles.buttonDanger}>
                        Hapus Pemain
                      </button>
                    </form>
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </AdminSection>
    </>
  );
}
