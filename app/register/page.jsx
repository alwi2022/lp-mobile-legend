import Link from "next/link";
import { getPublicRegistrationPageData } from "../../lib/public/registration";
import { submitRegistrationAction } from "./actions";
import { TeamLogoUpload } from "./team-logo-upload";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PLAYER_SLOTS = [
  { index: 1, label: "Pemain 1", defaultRole: "player", required: true },
  { index: 2, label: "Pemain 2", defaultRole: "player", required: true },
  { index: 3, label: "Pemain 3", defaultRole: "player", required: true },
  { index: 4, label: "Pemain 4", defaultRole: "player", required: true },
  { index: 5, label: "Pemain 5", defaultRole: "player", required: true },
  { index: 6, label: "Cadangan", defaultRole: "substitute", required: false },
];

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Message({ type, message }) {
  if (!message) {
    return null;
  }

  const className = [
    styles.message,
    type === "error" ? styles.messageError : "",
    type === "success" ? styles.messageSuccess : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <p className={className}>{message}</p>;
}

function Stat({ label, value, helper }) {
  return (
    <article className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {helper ? <p className={styles.subtle}>{helper}</p> : null}
    </article>
  );
}

function SectionHeader({ step, title, description }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionStep}>{step}</span>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
      </div>
    </div>
  );
}

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getPublicRegistrationPageData();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.shell}>
          <Link href="/" className={styles.backLink}>
            Kembali ke Halaman Utama
          </Link>
        </div>
      </header>

      <main className={styles.shell}>
        <section className={styles.heroPanel}>
          <div className={styles.heroMain}>
            <h1 className={styles.title}>{data.content.registerEyebrow}</h1>
            {/* <h1 className={styles.title}>{data.content.registerTitle}</h1> */}
            <p className={styles.copy}>{data.content.registerDescription}</p>
          </div>

          <div className={styles.heroHighlights}>
            <article className={styles.heroHighlight}>
              <span>Status</span>
              <strong>{data.tournament ? "Pendaftaran Dibuka" : "Menunggu Aktivasi"}</strong>
            </article>
            <article className={styles.heroHighlight}>
              <span>Format</span>
              <strong>Single Elimination</strong>
            </article>
            <article className={styles.heroHighlight}>
              <span>Alur</span>
              <strong>Isi Form &gt; Review Panitia &gt; Tim Resmi</strong>
            </article>
          </div>
        </section>

        <div className={styles.layout}>
          <aside className={styles.panel}>
            {data.tournament && data.summary ? (
              <div className={styles.infoStack}>
                <section className={styles.infoBlock}>
                  <div className={styles.infoBlockHead}>
                    <h2 className={styles.infoBlockTitle}>Ringkasan Turnamen</h2>
                    <p className={styles.subtle}>
                      Informasi cepat untuk membantu tim memastikan data yang dikirim sudah sesuai.
                    </p>
                  </div>

                  <div className={styles.stats}>
                    <Stat label="Turnamen" value={"Satria Gear"} />
                    <Stat label="Sisa Slot" value={String(data.summary.remaining_slots)} />
                    <Stat
                      label="Roster Minimum"
                      value={String(data.tournament.roster_min_players)}
                      helper="Pemain aktif minimum"
                    />
                    <Stat
                      label="Roster Maksimum"
                      value={String(data.tournament.roster_max_players)}
                      helper="Termasuk pemain cadangan"
                    />
                  </div>
                </section>

                <section className={styles.infoBlock}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span>Kickoff Match</span>
                      <strong>{formatDateOnly(data.tournament.kickoff_at)}</strong>
                    </div>
                    <div className={styles.infoItem}>
                      <span>Technical Meeting</span>
                      <strong>{formatDateTime(data.tournament.technical_meeting_at)}</strong>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            <section className={styles.note}>
              <strong>{data.content.contactLabel}</strong>
              <p className={styles.subtle}>{data.content.contactValue}</p>
            </section>

            <section className={styles.note}>
              <strong>Checklist Sebelum Submit</strong>
              <ul className={styles.noteList}>
                <li>Minimal 5 pemain aktif dan maksimal 1 pemain cadangan.</li>
                <li>Pilih tepat satu kapten dari roster yang diisi.</li>
                <li>Pastikan kontak kapten aktif untuk koordinasi dan briefing.</li>
                <li>Jika slot penuh, kiriman baru akan masuk daftar tunggu.</li>
              </ul>
            </section>

            <section className={styles.note}>
              <strong>Apa yang Terjadi Setelah Submit?</strong>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot}></span>
                  <div>
                    <strong>1. Masuk antrean review</strong>
                    <p className={styles.subtle}>Panitia memeriksa data tim dan roster lebih dulu.</p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot}></span>
                  <div>
                    <strong>2. Diproses admin</strong>
                    <p className={styles.subtle}>Tim bisa disetujui, ditolak, atau masuk daftar tunggu.</p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot}></span>
                  <div>
                    <strong>3. Menjadi tim resmi</strong>
                    <p className={styles.subtle}>Tim resmi akan dipakai untuk match, bracket, dan halaman publik.</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className={styles.formPanel}>
            <Message type={type} message={message || data.error} />

            {!data.configured ? (
              <div className={styles.emptyState}>
                <strong>Pendaftaran belum aktif</strong>
                <p className={styles.subtle}>
                  Koneksi database belum dikonfigurasi. Hubungi panitia untuk sementara.
                </p>
              </div>
            ) : !data.tournament ? (
              <div className={styles.emptyState}>
                <strong>Belum ada turnamen yang membuka pendaftaran</strong>
                <p className={styles.subtle}>
                  Panitia belum mengaktifkan `registration_open` pada tournament saat ini.
                </p>
              </div>
            ) : (
              <form action={submitRegistrationAction} className={styles.form}>
                <input type="hidden" name="tournament_id" value={data.tournament.id} />

                <section className={styles.section}>
                  <SectionHeader
                    step="01"
                    title="Informasi Tim"
                    description="Isi identitas utama tim dan kontak yang akan dipakai panitia untuk koordinasi."
                  />

                  <div className={styles.formGrid}>
                    <TeamLogoUpload />

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Nama Tim</span>
                      <input
                        className={styles.input}
                        name="team_name"
                        required
                        placeholder="Contoh: Satria Gear Alpha"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Singkatan Tim</span>
                      <input
                        className={styles.input}
                        name="team_short_name"
                        placeholder="Opsional, misalnya SGA"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Nama Kapten</span>
                      <input
                        className={styles.input}
                        name="captain_name"
                        required
                        placeholder="Nama lengkap kapten"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Kontak Kapten</span>
                      <input
                        className={styles.input}
                        name="captain_contact"
                        required
                        placeholder="Nomor WhatsApp aktif"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Email Kapten</span>
                      <input
                        className={styles.input}
                        type="email"
                        name="captain_email"
                        placeholder="Opsional"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Region</span>
                      <input
                        className={styles.input}
                        name="region"
                        required
                        placeholder="Contoh: Jakarta Barat"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Kota</span>
                      <input className={styles.input} name="city" placeholder="Opsional" />
                    </label>

                    <label className={`${styles.field} ${styles.fieldFull}`}>
                      <span className={styles.fieldLabel}>Bio / Catatan Tim</span>
                      <textarea
                        className={styles.textarea}
                        name="team_bio"
                        placeholder="Opsional. Bisa isi deskripsi singkat atau catatan tambahan."
                      />
                    </label>
                  </div>
                </section>

                <section className={styles.section}>
                  <SectionHeader
                    step="02"
                    title="Roster Pemain"
                    description="Isi pemain inti terlebih dahulu, lalu tentukan satu orang sebagai kapten roster."
                  />

                  <div className={styles.rosterLegend}>
                    <span>Semua pemain 1-5 wajib diisi</span>
                    <span>Pilih 1 kapten roster</span>
                    <span>Cadangan bersifat opsional</span>
                  </div>

                  <div className={styles.rosterList}>
                    {PLAYER_SLOTS.map((player) => (
                      <article
                        key={player.index}
                        className={[
                          styles.playerCard,
                          !player.required ? styles.playerCardOptional : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className={styles.playerHead}>
                          <div className={styles.playerHeadMeta}>
                            <span className={styles.playerIndex}>
                              {String(player.index).padStart(2, "0")}
                            </span>
                            <div>
                              <h3 className={styles.playerTitle}>{player.label}</h3>
                              <p className={styles.playerHint}>
                                {player.required ? "Wajib diisi" : "Opsional"}
                              </p>
                            </div>
                          </div>

                          <label className={styles.captainChoice}>
                            <input
                              type="radio"
                              name="captain_choice"
                              value={String(player.index)}
                              required
                            />
                            Jadikan Kapten
                          </label>
                        </div>

                        <div className={styles.formGrid}>
                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Nama Tampil</span>
                            <input
                              className={styles.input}
                              name={`player_display_name_${player.index}`}
                              required={player.required}
                              placeholder="Nama lengkap / panggilan"
                            />
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Nama Dalam Game</span>
                            <input
                              className={styles.input}
                              name={`player_in_game_name_${player.index}`}
                              required={player.required}
                              placeholder="Nickname MLBB"
                            />
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Game UID</span>
                            <input
                              className={styles.input}
                              name={`player_game_uid_${player.index}`}
                              placeholder="Opsional"
                            />
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Game Server</span>
                            <input
                              className={styles.input}
                              name={`player_game_server_${player.index}`}
                              placeholder="Opsional"
                            />
                          </label>

                          <label className={`${styles.field} ${styles.fieldFull}`}>
                            <span className={styles.fieldLabel}>Peran Roster</span>
                            <select
                              className={styles.select}
                              name={`player_roster_role_${player.index}`}
                              defaultValue={player.defaultRole}
                            >
                              <option value="player">Pemain</option>
                              <option value="substitute">Cadangan</option>
                            </select>
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.submitCard}>
         

                    <button type="submit" className={styles.submitButton}>
                      Kirim Registrasi
                    </button>
                    
                </section>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
