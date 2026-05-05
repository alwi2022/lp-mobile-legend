import {
  ROSTER_ROLE_OPTIONS,
  TEAM_STATUS_OPTIONS,
} from "../../../lib/admin/teams";
import { CloudinaryUploadField } from "../../../components/admin/cloudinary-upload-field";
import styles from "../../../components/admin/admin-shell.module.css";

function FormGroup({ title, description, children }) {
  return (
    <section className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <h4 className={styles.formGroupTitle}>{title}</h4>
        {description ? <p className={styles.formGroupCopy}>{description}</p> : null}
      </div>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}

export function TeamFormFields({ team = null }) {
  return (
    <div className={styles.stack}>
      <FormGroup
        title="Data Utama Tim"
        description="Isi identitas tim dan kontak kapten yang benar-benar dipakai saat operasional."
      >

          <CloudinaryUploadField
          label="Logo Tim"
          name="logo_path"
          defaultValue={team?.logo_path || ""}
          folder="satria-gear/teams"
        />
        
        <label className={styles.field}>
          Nama Tim
          <input className={styles.input} name="name" defaultValue={team?.name || ""} required />
        </label>

        <label className={styles.field}>
          Singkatan Tim
          <input
            className={styles.input}
            name="short_name"
            defaultValue={team?.short_name || ""}
            placeholder="Opsional"
          />
        </label>

        <label className={styles.field}>
          Status
          <select
            className={styles.select}
            name="status"
            defaultValue={team?.status || "active"}
          >
            {TEAM_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Nomor Unggulan
          <input
            className={styles.input}
            type="number"
            min="1"
            name="seed_number"
            defaultValue={team?.seed_number ?? ""}
            placeholder="Opsional"
          />
        </label>

        <label className={styles.field}>
          Nama Kapten
          <input
            className={styles.input}
            name="captain_name"
            defaultValue={team?.captain_name || ""}
            required
          />
        </label>

        <label className={styles.field}>
          Kontak Kapten
          <input
            className={styles.input}
            name="captain_contact"
            defaultValue={team?.captain_contact || ""}
            required
          />
        </label>

        <label className={styles.field}>
          Email Kapten
          <input
            className={styles.input}
            type="email"
            name="captain_email"
            defaultValue={team?.captain_email || ""}
            placeholder="Opsional"
          />
        </label>

        <label className={styles.field}>
          Region
          <input
            className={styles.input}
            name="region"
            defaultValue={team?.region || ""}
            required
          />
        </label>

        <label className={styles.field}>
          Kota
          <input
            className={styles.input}
            name="city"
            defaultValue={team?.city || ""}
            placeholder="Opsional"
          />
        </label>
      </FormGroup>

      <FormGroup
        title="Data Tambahan"
        description="Gunakan bagian ini hanya jika perlu menyimpan hasil akhir atau catatan internal panitia."
      >
        <label className={styles.field}>
          Peringkat
          <input
            className={styles.input}
            type="number"
            min="1"
            name="placement"
            defaultValue={team?.placement ?? ""}
            placeholder="Opsional"
          />
        </label>

        <label className={styles.field}>
          Ronde Eliminasi
          <input
            className={styles.input}
            name="eliminated_round"
            defaultValue={team?.eliminated_round || ""}
            placeholder="Opsional"
          />
        </label>

      

        <label className={`${styles.field} ${styles.fieldFull}`}>
          Catatan
          <textarea
            className={styles.textarea}
            name="notes"
            defaultValue={team?.notes || ""}
            placeholder="Catatan internal untuk seeding, roster, atau operasional"
          />
        </label>
      </FormGroup>
    </div>
  );
}

export function TeamPlayerFormFields({ player = null }) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        Nama Tampil
        <input
          className={styles.input}
          name="display_name"
          defaultValue={player?.display_name || ""}
          required
        />
      </label>

      <label className={styles.field}>
        Nama Dalam Game
        <input
          className={styles.input}
          name="in_game_name"
          defaultValue={player?.in_game_name || ""}
          required
        />
      </label>

      <label className={styles.field}>
        Game UID
        <input
          className={styles.input}
          name="game_uid"
          defaultValue={player?.game_uid || ""}
          placeholder="Opsional"
        />
      </label>

      <label className={styles.field}>
        Server Game
        <input
          className={styles.input}
          name="game_server"
          defaultValue={player?.game_server || ""}
          placeholder="Opsional"
        />
      </label>

      <label className={styles.field}>
        Peran Roster
        <select
          className={styles.select}
          name="roster_role"
          defaultValue={player?.roster_role || "player"}
        >
          {ROSTER_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        Urutan Tampil
        <input
          className={styles.input}
          type="number"
          min="1"
          name="sort_order"
          defaultValue={player?.sort_order ?? 1}
          required
        />
      </label>

      <label className={`${styles.field} ${styles.checkboxField}`}>
        <input type="checkbox" name="is_captain" defaultChecked={Boolean(player?.is_captain)} />
        Jadikan kapten tim
      </label>

      <label className={`${styles.field} ${styles.checkboxField}`}>
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={player ? Boolean(player.is_active) : true}
        />
        Pemain aktif
      </label>
    </div>
  );
}
