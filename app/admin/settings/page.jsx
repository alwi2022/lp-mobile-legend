//app/admin/settings/page.jsx
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
} from "../../../components/admin/admin-shell";
import { getAdminSettingsPageData } from "../../../lib/admin/site-settings";
import { createStarterTournamentAction, saveSiteSettingsAction } from "./actions";
import { SettingsTabPanel, SettingsTabs } from "./settings-tabs";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function SettingGroup({ id, title, location, description, children }) {
  return (
    <section id={id} className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <h4 className={styles.formGroupTitle}>{title}</h4>
        {location ? <span className={styles.detailLabel}>{location}</span> : null}
        <p className={styles.formGroupCopy}>{description}</p>
      </div>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}

function formatTournamentStatus(value = "") {
  return (
    {
      draft: "Draf",
      registration_open: "Pendaftaran Dibuka",
      registration_closed: "Pendaftaran Ditutup",
      ongoing: "Berlangsung",
      completed: "Selesai",
      archived: "Diarsipkan",
    }[value] || value.replaceAll("_", " ")
  );
}

function formatTournamentFormat(value = "") {
  return (
    {
      single_elimination: "Single Elimination",
      double_elimination: "Double Elimination",
      round_robin: "Round Robin",
      hybrid: "Hybrid",
    }[value] || value.replaceAll("_", " ")
  );
}

function formatDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}

export default async function AdminSettingsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminSettingsPageData();
  const settingTabs = [
    { id: "identitas", label: "Identitas" },
    { id: "hero", label: "Hero" },
    { id: "pendaftaran", label: "Pendaftaran" },
    { id: "siaran", label: "Siaran" },
    { id: "footer", label: "Footer" },
  ];

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Turnamen Aktif"
        description="Ringkasan kecil ini membantu kamu memastikan turnamen utama sudah aktif sebelum mengubah konten website."
      >
        {data.tournament ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Turnamen"
              value={data.tournament.name}
              helper={data.tournament.slug}
              compact
            />
            <AdminStatCard
              label="Status"
              value={formatTournamentStatus(data.tournament.status)}
              compact
            />
            <AdminStatCard
              label="Format"
              value={formatTournamentFormat(data.tournament.format)}
              compact
            />
            <AdminStatCard
              label="Batas Slot"
              value={String(data.tournament.team_slot_limit)}
              compact
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada turnamen utama"
            description={
              <>
                Pengaturan website butuh satu baris data di tabel{" "}
                <span className={styles.code}>tournaments</span>. Kamu bisa membuat turnamen awal
                langsung dari sini agar alur admin bisa lanjut.
              </>
            }
            action={
              <form action={createStarterTournamentAction}>
                <button type="submit" className={styles.buttonPrimary}>
                  Buat Turnamen Awal
                </button>
              </form>
            }
          />
        )}
      </AdminSection>

      <AdminSection
        title="Konten Website"
        description="Pakai tab Pendaftaran untuk tanggal penting dan batas slot. Tab lain hanya untuk teks website publik."
      >
        {data.tournament ? (
          <form action={saveSiteSettingsAction} className={styles.stack}>
            <input type="hidden" name="tournament_id" value={data.tournament.id} />
            <SettingsTabs tabs={settingTabs} defaultValue="identitas">
              <SettingsTabPanel value="identitas">
                <SettingGroup
                  id="identitas"
                  title="Identitas Website"
                  location="Muncul di: browser, navbar, dan metadata website"
                  description="Bagian ini dipakai untuk identitas umum website dan informasi yang muncul di tab browser."
                >
                  <label className={styles.field}>
                    Nama Brand
                    <input className={styles.input} name="brand_name" defaultValue={data.settings.brand_name} required />
                  </label>

                  <label className={styles.field}>
                    Singkatan Brand
                    <input className={styles.input} name="brand_mark" defaultValue={data.settings.brand_mark} required />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Judul Website
                    <input className={styles.input} name="site_title" defaultValue={data.settings.site_title} required />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Deskripsi Meta
                    <textarea
                      className={styles.textarea}
                      name="meta_description"
                      defaultValue={data.settings.meta_description}
                      required
                    />
                  </label>
                </SettingGroup>
              </SettingsTabPanel>

              <SettingsTabPanel value="hero">
                <SettingGroup
                  id="hero"
                  title="Bagian Hero"
                  location="Muncul di: Beranda > Hero"
                  description="Semua field di bawah ini tampil di section paling atas halaman utama."
                >
                  <label className={styles.field}>
                    Label Hero Kecil
                    <input className={styles.input} name="hero_eyebrow" defaultValue={data.settings.hero_eyebrow} required />
                  </label>

                  <label className={styles.field}>
                    Judul Hero
                    <input className={styles.input} name="hero_title" defaultValue={data.settings.hero_title} required />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Deskripsi Hero
                    <textarea
                      className={styles.textarea}
                      name="hero_description"
                      defaultValue={data.settings.hero_description}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Label Tombol Hero Utama
                    <input
                      className={styles.input}
                      name="hero_primary_label"
                      defaultValue={data.settings.hero_primary_label}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Tautan Tombol Hero Utama
                    <input
                      className={styles.input}
                      name="hero_primary_href"
                      defaultValue={data.settings.hero_primary_href}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Label Tombol Hero Kedua
                    <input
                      className={styles.input}
                      name="hero_secondary_label"
                      defaultValue={data.settings.hero_secondary_label}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Tautan Tombol Hero Kedua
                    <input
                      className={styles.input}
                      name="hero_secondary_href"
                      defaultValue={data.settings.hero_secondary_href}
                      required
                    />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Label Format Hero
                    <input
                      className={styles.input}
                      name="hero_format_label"
                      defaultValue={data.settings.hero_format_label}
                      required
                    />
                  </label>
                </SettingGroup>
              </SettingsTabPanel>

              <SettingsTabPanel value="pendaftaran">
                <SettingGroup
                  id="jadwal-pendaftaran"
                  title="Jadwal Pendaftaran & Turnamen"
                  location="Muncul di: Halaman /register dan ringkasan turnamen"
                  description="Isi hanya yang dibutuhkan untuk operasional turnamen."
                >
                  <label className={styles.field}>
                    Batas Slot Tim
                    <input
                      className={styles.input}
                      type="number"
                      min="1"
                      name="team_slot_limit"
                      defaultValue={String(data.tournament.team_slot_limit)}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Buka Pendaftaran
                    <input
                      className={styles.input}
                      type="datetime-local"
                      name="registration_open_at"
                      defaultValue={formatDateTimeLocal(data.tournament.registration_open_at)}
                    />
                  </label>

                  <label className={styles.field}>
                    Tutup Pendaftaran
                    <input
                      className={styles.input}
                      type="datetime-local"
                      name="registration_close_at"
                      defaultValue={formatDateTimeLocal(data.tournament.registration_close_at)}
                    />
                  </label>

                  <label className={styles.field}>
                    Deadline Check-in
                    <input
                      className={styles.input}
                      type="datetime-local"
                      name="check_in_deadline"
                      defaultValue={formatDateTimeLocal(data.tournament.check_in_deadline)}
                    />
                  </label>

                  <label className={styles.field}>
                    Technical Meeting
                    <input
                      className={styles.input}
                      type="datetime-local"
                      name="technical_meeting_at"
                      defaultValue={formatDateTimeLocal(data.tournament.technical_meeting_at)}
                    />
                  </label>

                  <label className={styles.field}>
                    Kickoff Match
                    <input
                      className={styles.input}
                      type="datetime-local"
                      name="kickoff_at"
                      defaultValue={formatDateTimeLocal(data.tournament.kickoff_at)}
                    />
                  </label>

                  <label className={styles.field}>
                    Grand Final
                    <input
                      className={styles.input}
                      type="datetime-local"
                      name="grand_final_at"
                      defaultValue={formatDateTimeLocal(data.tournament.grand_final_at)}
                    />
                  </label>
                </SettingGroup>

                <SettingGroup
                  id="pendaftaran"
                  title="Bagian Pendaftaran"
                  location="Muncul di: Beranda > Pendaftaran"
                  description="Field ini tampil di section pendaftaran dan kartu ajakan daftar di halaman utama."
                >
                  <label className={styles.field}>
                    Label Kecil Pendaftaran
                    <input
                      className={styles.input}
                      name="register_eyebrow"
                      defaultValue={data.settings.register_eyebrow}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Judul Pendaftaran
                    <input
                      className={styles.input}
                      name="register_title"
                      defaultValue={data.settings.register_title}
                      required
                    />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Deskripsi Pendaftaran
                    <textarea
                      className={styles.textarea}
                      name="register_description"
                      defaultValue={data.settings.register_description}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Label CTA Pendaftaran
                    <input
                      className={styles.input}
                      name="register_cta_label"
                      defaultValue={data.settings.register_cta_label}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Judul CTA Pendaftaran
                    <input
                      className={styles.input}
                      name="register_cta_title"
                      defaultValue={data.settings.register_cta_title}
                      required
                    />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Deskripsi CTA Pendaftaran
                    <textarea
                      className={styles.textarea}
                      name="register_cta_description"
                      defaultValue={data.settings.register_cta_description}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Label Tombol CTA Pendaftaran
                    <input
                      className={styles.input}
                      name="register_cta_action_label"
                      defaultValue={data.settings.register_cta_action_label}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Tautan Tombol CTA Pendaftaran
                    <input
                      className={styles.input}
                      name="register_cta_action_href"
                      defaultValue={data.settings.register_cta_action_href}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    Label Kontak
                    <input className={styles.input} name="contact_label" defaultValue={data.settings.contact_label} required />
                  </label>

                  <label className={styles.field}>
                    Isi Kontak
                    <input className={styles.input} name="contact_value" defaultValue={data.settings.contact_value} required />
                  </label>
                </SettingGroup>
              </SettingsTabPanel>

              <SettingsTabPanel value="siaran">
                <SettingGroup
                  id="siaran"
                  title="Bagian Siaran"
                  location="Muncul di: Beranda > Siaran"
                  description="Field ini tampil di section siaran langsung pada halaman utama."
                >
                  <label className={styles.field}>
                    Label Kecil Siaran
                    <input className={styles.input} name="live_eyebrow" defaultValue={data.settings.live_eyebrow} required />
                  </label>

                  <label className={styles.field}>
                    Judul Siaran
                    <input className={styles.input} name="live_title" defaultValue={data.settings.live_title} required />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Deskripsi Siaran
                    <textarea
                      className={styles.textarea}
                      name="live_description"
                      defaultValue={data.settings.live_description}
                      required
                    />
                  </label>
                </SettingGroup>
              </SettingsTabPanel>

              <SettingsTabPanel value="footer">
                <SettingGroup
                  id="footer"
                  title="Bagian Footer"
                  location="Muncul di: Footer website"
                  description="Field ini tampil di bagian paling bawah website."
                >
                  <label className={styles.field}>
                    Judul Footer
                    <input className={styles.input} name="footer_title" defaultValue={data.settings.footer_title} required />
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    Deskripsi Footer
                    <textarea
                      className={styles.textarea}
                      name="footer_description"
                      defaultValue={data.settings.footer_description}
                      required
                    />
                  </label>
                </SettingGroup>
              </SettingsTabPanel>
            </SettingsTabs>

            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Simpan Pengaturan
              </button>
            </div>
          </form>
        ) : (
          <AdminEmptyState
            title="Form pengaturan akan aktif setelah turnamen dibuat"
            description="Begitu turnamen awal tersedia, halaman ini langsung bisa dipakai untuk mengubah konten website publik."
          />
        )}
      </AdminSection>
    </>
  );
}
