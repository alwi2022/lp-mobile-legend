import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
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

function adminMatchesSearch(admin, query) {
  if (!query) {
    return true;
  }

  const haystack = [admin.full_name, admin.role, admin.phone]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdminAdminsPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const data = await getAdminAdminsPageData();
  const canManage = data.currentAdmin?.role === "super_admin";
  const admins = data.admins.filter((admin) => adminMatchesSearch(admin, query));

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.crudHeader}>
          <h1 className={styles.crudTitle}>Management Admin</h1>
          <form action="/admin/management" className={styles.crudActions}>
            <input
              className={styles.searchInput}
              name="q"
              defaultValue={query}
              placeholder="Cari admin..."
            />
          </form>
        </div>

        {canManage ? (
          <form action={createAdminAction} className={styles.formCard}>
            <h2 className={styles.formTitle}>Tambah Admin</h2>
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

        {admins.length ? (
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
                  {admins.map((admin) => (
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
                {admins.map((admin) => (
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
            description="Hapus pencarian atau cek akses akun yang sedang login."
          />
        )}
      </AdminSection>
    </>
  );
}
