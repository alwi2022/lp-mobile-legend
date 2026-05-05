import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
  AdminStatCard,
  AdminStatusBadge,
} from "../../../components/admin/admin-shell";
import { getAdminAdminsPageData, ADMIN_ROLE_OPTIONS } from "../../../lib/admin/admins";
import {
  createAdminAction,
  deleteAdminAction,
  updateAdminAction,
} from "./actions";
import { CloudinaryUploadField } from "../../../components/admin/cloudinary-upload-field";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function ActivePill({ active }) {
  return (
    <AdminStatusBadge
      label={active ? "aktif" : "nonaktif"}
      tone={active ? "success" : "danger"}
    />
  );
}

function RolePill({ role }) {
  const config = {
    super_admin: { label: "superadmin", tone: "accent" },
    admin: { label: "admin", tone: "info" },
    operator: { label: "operator", tone: "neutral" },
  }[role] || { label: role.replaceAll("_", " "), tone: "neutral" };

  return <AdminStatusBadge label={config.label} tone={config.tone} />;
}

function AdminFormFields({ admin = null }) {
  return (
    <div className={styles.formGrid}>
      
      <CloudinaryUploadField
        label="Avatar"
        name="avatar_url"
        defaultValue={admin?.avatar_url || ""}
        folder="satria-gear/admins"
        variant="avatar"
      />
      <label className={styles.field}>
        Nama Lengkap
        <input
          className={styles.input}
          name="full_name"
          defaultValue={admin?.full_name || ""}
          required
        />
      </label>

      <label className={styles.field}>
        Peran
        <select
          className={styles.select}
          name="role"
          defaultValue={admin?.role || "operator"}
        >
          {ADMIN_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        Telepon
        <input
          className={styles.input}
          name="phone"
          defaultValue={admin?.phone || ""}
          placeholder="Opsional"
        />
      </label>



      <label className={`${styles.field} ${styles.fieldFull} ${styles.checkboxField}`}>
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={admin ? Boolean(admin.is_active) : true}
        />
        Admin aktif
      </label>
    </div>
  );
}

export default async function AdminAdminsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminAdminsPageData();
  const canManage = data.currentAdmin?.role === "super_admin";

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection
        title="Ringkasan Admin"
        description="Pengelolaan akses dibuat sesederhana mungkin: lihat ringkasan peran, lalu tambah atau edit admin hanya saat perlu."
      >
        {data.summary ? (
          <div className={styles.metaGrid}>
            <AdminStatCard
              label="Total Admin"
              value={String(data.summary.total_count)}
              helper={`Aktif ${data.summary.active_count}`}
            />
            <AdminStatCard label="Superadmin" value={String(data.summary.super_admin_count)} />
            <AdminStatCard label="Admin" value={String(data.summary.admin_count)} />
            <AdminStatCard
              label="Operator"
              value={String(data.summary.operator_count)}
              helper={`Nonaktif ${data.summary.inactive_count}`}
            />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada data admin yang bisa ditampilkan"
            description="Halaman ini akan aktif penuh setelah login dengan peran admin dan kebijakan database aktif."
          />
        )}
      </AdminSection>

      <AdminSection
        title="Aturan Akses"
        description="Bagian ini menjelaskan peran sesi kamu saat ini dan apakah kamu boleh mengubah admin lain."
      >
        <div className={styles.grid}>
          <article className={styles.card}>
            <h4 className={styles.cardTitle}>Sesi Saat Ini</h4>
            <p className={styles.pageCopy}>
              {data.currentAdmin
                ? `${data.currentAdmin.full_name} (${data.currentAdmin.role.replaceAll("_", " ")})`
                : "Tidak ada admin aktif."}
            </p>
          </article>

          <article className={styles.card}>
            <h4 className={styles.cardTitle}>Izin Pengelolaan</h4>
            <p className={styles.pageCopy}>
              {canManage
                ? "Kamu bisa menambah, mengubah, dan menghapus data admin."
                : "Halaman ini bisa dibaca, tapi tambah, ubah, dan hapus admin lain dibatasi hanya untuk superadmin."}
            </p>
          </article>
        </div>
      </AdminSection>

      <AdminSection
        title="Tambah Admin"
        description="Buat user-nya dulu di Supabase Auth. Setelah itu, petakan user tersebut ke tabel admin dari form ini."
      >
        {canManage ? (
          <form action={createAdminAction} className={styles.stack}>
            <AdminFormFields />
            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                Tambah Admin
              </button>
            </div>
          </form>
        ) : (
          <AdminEmptyState
            title="Hanya superadmin yang bisa menambah admin baru"
            description="Kalau kamu butuh akun baru untuk panitia, minta superadmin menambahkannya dari halaman ini."
          />
        )}
      </AdminSection>

      <AdminSection
        title="Daftar Admin"
        description="Tabel ini dipakai untuk scan cepat. Form edit diletakkan di bawah dalam accordion supaya halaman tetap ringan."
      >
        {data.admins.length ? (
          <div className={styles.stack}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Peran</th>
                    <th>Status</th>
                    <th>Kontak</th>
                  </tr>
                </thead>
                <tbody>
                  {data.admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <p className={styles.tableTitle}>{admin.full_name}</p>
                      </td>
                      <td>
                        <RolePill role={admin.role} />
                      </td>
                      <td>
                        <ActivePill active={admin.is_active} />
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{admin.phone || "-"}</p>
                      </td>
                     
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canManage ? (
              <div className={styles.stack}>
                {data.admins.map((admin) => (
                  <details key={admin.id} className={styles.accordion}>
                    <summary className={styles.accordionSummary}>
                      <span>Kelola {admin.full_name}</span>
                      <span className={styles.subtle}>Buka form edit</span>
                    </summary>
                    <div className={styles.accordionBody}>
                      <form action={updateAdminAction} className={styles.stack}>
                        <input type="hidden" name="admin_id" value={admin.id} />
                        <AdminFormFields admin={admin} />
                        <div className={styles.buttonRow}>
                          <button type="submit" className={styles.buttonPrimary}>
                            Simpan Admin
                          </button>
                          <button
                            type="submit"
                            formAction={deleteAdminAction}
                            className={styles.buttonDanger}
                          >
                            Hapus Admin
                          </button>
                        </div>
                      </form>
                    </div>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada baris admin yang terlihat"
            description="Kalau kamu login sebagai non-superadmin, kebijakan bisa membatasi akses hanya ke profil admin milikmu sendiri."
          />
        )}
      </AdminSection>
    </>
  );
}
