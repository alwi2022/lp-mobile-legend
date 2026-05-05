import { AdminStatusBadge } from "../../../components/admin/admin-shell";
import styles from "../../../components/admin/admin-shell.module.css";
import {
  STREAM_PLATFORM_OPTIONS,
  STREAM_STATUS_OPTIONS,
} from "../../../lib/admin/streams";

export function StreamStatusPill({ value }) {
  const config = {
    draft: { label: "draf", tone: "neutral" },
    live_soon: { label: "segera tayang", tone: "warning" },
    live: { label: "langsung", tone: "success" },
    ended: { label: "selesai", tone: "neutral" },
    archived: { label: "diarsipkan", tone: "danger" },
  }[value] || {
    label: value.replaceAll("_", " "),
    tone: "neutral",
  };

  return <AdminStatusBadge label={config.label} tone={config.tone} />;
}

function FormGroup({ title, children }) {
  return (
    <section className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <h4 className={styles.formGroupTitle}>{title}</h4>
      </div>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}

function formatInputDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (segment) => String(segment).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function MatchSelect({ matches, defaultValue = "" }) {
  return (
    <select className={styles.select} name="match_id" defaultValue={defaultValue}>
      <option value="">Siaran mandiri</option>
      {matches.map((match) => (
        <option key={match.id} value={match.id}>
          {match.label}
        </option>
      ))}
    </select>
  );
}

export function StreamFormFields({ stream = null, matches }) {
  return (
    <div className={styles.stack}>
      <FormGroup
        title="Informasi Dasar"
        description="Tentukan identitas siaran, status penayangan, urutan tampil, dan hubungan ke pertandingan."
      >
        <label className={styles.field}>
          Judul
          <input className={styles.input} name="title" defaultValue={stream?.title || ""} required />
        </label>

        <label className={styles.field}>
          Platform
          <select
            className={styles.select}
            name="platform"
            defaultValue={stream?.platform || "youtube"}
          >
            {STREAM_PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Status
          <select
            className={styles.select}
            name="status"
            defaultValue={stream?.status || "draft"}
          >
            {STREAM_STATUS_OPTIONS.map((option) => (
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
            min="0"
            name="sort_order"
            defaultValue={String(stream?.sort_order ?? 0)}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          Pertandingan Terkait
          <MatchSelect matches={matches} defaultValue={stream?.match_id || ""} />
        </label>

        <label className={`${styles.field} ${styles.fieldFull} ${styles.checkboxField}`}>
          <input type="checkbox" name="is_featured" defaultChecked={Boolean(stream?.is_featured)} />
          Jadikan siaran utama di halaman depan
        </label>
      </FormGroup>

      <FormGroup
        title="Waktu Siaran"
        description="Isi jadwal rencana dan waktu live yang sebenarnya jika siaran sudah berjalan."
      >
        <label className={styles.field}>
          Jadwal Mulai
          <input
            className={styles.input}
            type="datetime-local"
            name="scheduled_start_at"
            defaultValue={formatInputDateTime(stream?.scheduled_start_at)}
          />
        </label>

        <label className={styles.field}>
          Mulai Pada
          <input
            className={styles.input}
            type="datetime-local"
            name="started_at"
            defaultValue={formatInputDateTime(stream?.started_at)}
          />
        </label>

        <label className={styles.field}>
          Selesai Pada
          <input
            className={styles.input}
            type="datetime-local"
            name="ended_at"
            defaultValue={formatInputDateTime(stream?.ended_at)}
          />
        </label>
      </FormGroup>

      <FormGroup
        title="Link dan Sematan"
        description="Isi YouTube ID atau URL siaran supaya homepage bisa menampilkan stream dengan benar."
      >
        <label className={styles.field}>
          YouTube ID
          <input
            className={styles.input}
            name="youtube_id"
            defaultValue={stream?.youtube_id || ""}
            placeholder="1uS8Gk8jb6M"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          URL Siaran
          <input
            className={styles.input}
            name="stream_url"
            defaultValue={stream?.stream_url || ""}
            placeholder="https://youtube.com/watch?v=..."
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          URL Sematan
          <input
            className={styles.input}
            name="embed_url"
            defaultValue={stream?.embed_url || ""}
            placeholder="https://www.youtube.com/embed/..."
          />
        </label>
      </FormGroup>

      <FormGroup
        title="Catatan Operator"
        description="Opsional. Simpan catatan caster, rundown, atau kebutuhan teknis di sini."
      >
        <label className={`${styles.field} ${styles.fieldFull}`}>
          Catatan
          <textarea
            className={styles.textarea}
            name="notes"
            defaultValue={stream?.notes || ""}
            placeholder="Catatan stream, caster, atau rundown"
          />
        </label>
      </FormGroup>
    </div>
  );
}
